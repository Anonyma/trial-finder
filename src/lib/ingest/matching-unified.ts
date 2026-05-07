/**
 * Unified matching with tiered model selection.
 * 
 * Strategy:
 * 1. SQL pre-filter (free) - age, sex, location, cancer type
 * 2. Tier 1: Rule-based scoring (free) - simple eligibility checks
 * 3. Tier 2: Cheap LLM via unlimited subscription - Haiku/GPT-4o-mini/Flash
 * 4. Tier 3: Strong model only for complex cases (if needed)
 * 
 * With QuadMax subscription: All tiers are effectively free.
 */

import { db } from "@/lib/db";
import { trials } from "@/lib/db/schema";
import { and, or, sql, inArray, lte, gte, isNull, eq } from "drizzle-orm";
import type { Trial } from "@/lib/db/schema";
import { chatCompletion, isUnlimitedProvider, logUsage } from "@/lib/ai/providers";
import type { UserProfile } from "./matching";

export interface MatchResult {
  trial: Trial;
  fitScore: number;
  verdict: "likely_eligible" | "possibly_eligible" | "unlikely_eligible";
  explanation: {
    matches: string[];
    conflicts: string[];
    uncertain: string[];
  };
  modelUsed?: string;
  cost?: number;
}

const PREFILTER_LIMIT = 50;
const MATCH_LIMIT_LLM = 30;

// Track which models we use
const MODELS = {
  cheap: process.env.MATCHING_CHEAP_MODEL || "claude-haiku-4-5-20251001",
  strong: process.env.MATCHING_STRONG_MODEL || "claude-sonnet-4-6",
};

/**
 * Main matching function with smart model selection.
 */
export async function findMatchesUnified(
  profile: UserProfile,
  options: { useStrongModel?: boolean } = {}
): Promise<MatchResult[]> {
  // Stage 1: SQL pre-filter
  const candidates = await sqlPrefilter(profile);
  if (candidates.length === 0) return [];

  // Stage 2: Score each candidate
  const toScore = candidates.slice(0, MATCH_LIMIT_LLM);
  
  // If unlimited provider, can afford to use LLM on all
  // Otherwise use rule-based for most
  const useLLM = isUnlimitedProvider() || options.useStrongModel;
  
  const scored = await Promise.all(
    toScore.map((t) => scoreTrial(t, profile, useLLM))
  );

  // Sort by score desc
  scored.sort((a, b) => b.fitScore - a.fitScore);
  return scored;
}

async function sqlPrefilter(profile: UserProfile): Promise<Trial[]> {
  const recruitingStatuses = ["recruiting", "not_yet_recruiting", "enrolling_by_invitation"];

  const conditions = [
    inArray(trials.status, recruitingStatuses as never[]),
    sql`${trials.cancerTypes} && ${profile.cancerTypeIds}`,
    or(isNull(trials.minAgeYears), lte(trials.minAgeYears, profile.ageYears)),
    or(isNull(trials.maxAgeYears), gte(trials.maxAgeYears, profile.ageYears)),
    or(isNull(trials.sex), eq(trials.sex, "ALL"), eq(trials.sex, profile.sex)),
  ];

  if (profile.countries.length > 0 && !profile.willingToTravelInternational) {
    conditions.push(sql`${trials.countries} && ${profile.countries}`);
  }

  const rows = await db
    .select()
    .from(trials)
    .where(and(...conditions))
    .orderBy(sql`${trials.sourceLastUpdated} DESC NULLS LAST`)
    .limit(PREFILTER_LIMIT);

  return rows;
}

async function scoreTrial(
  trial: Trial,
  profile: UserProfile,
  useLLM: boolean
): Promise<MatchResult> {
  // Always start with rule-based for speed
  const ruleBased = scoreTrialRuleBased(trial, profile);
  
  // If score is extreme (very high or very low) and not using LLM, trust rules
  if (!useLLM && (ruleBased.fitScore >= 85 || ruleBased.fitScore <= 25)) {
    return { ...ruleBased, modelUsed: "rule-based" };
  }
  
  // Otherwise use LLM for nuanced scoring
  return scoreTrialLLM(trial, profile, useLLM);
}

function scoreTrialRuleBased(trial: Trial, profile: UserProfile): MatchResult {
  const matches: string[] = [];
  const conflicts: string[] = [];
  const uncertain: string[] = [];
  let score = 50;

  // Cancer type
  const cancerMatch = trial.cancerTypes?.some(ct => profile.cancerTypeIds.includes(ct));
  if (cancerMatch) {
    matches.push("Cancer type matches");
    score += 15;
  } else {
    conflicts.push("Cancer type not listed in trial");
    score -= 20;
  }

  // Age
  if (trial.minAgeYears && profile.ageYears < trial.minAgeYears) {
    conflicts.push(`Below minimum age (${trial.minAgeYears})`);
    score -= 30;
  } else if (trial.maxAgeYears && profile.ageYears > trial.maxAgeYears) {
    conflicts.push(`Above maximum age (${trial.maxAgeYears})`);
    score -= 30;
  } else {
    matches.push("Age requirement satisfied");
    score += 10;
  }

  // Sex
  if (trial.sex && trial.sex !== "ALL" && trial.sex !== profile.sex) {
    conflicts.push(`Trial limited to ${trial.sex.toLowerCase()} patients`);
    score -= 50;
  } else {
    matches.push("Sex requirement satisfied");
    score += 5;
  }

  // Location
  const locationMatch = trial.countries?.some(c => 
    profile.countries.includes(c) || profile.willingToTravelInternational
  );
  if (locationMatch) {
    matches.push("Available in your region");
    score += 10;
  }

  // Check for obvious exclusions in criteria
  const criteria = trial.eligibilityCriteria?.toLowerCase() || "";
  const biomarkers = profile.biomarkers.toLowerCase();
  
  // Simple keyword checks
  if (criteria.includes("egfr mutation") && !biomarkers.includes("egfr")) {
    uncertain.push("Trial may require specific EGFR mutations - verify your biomarker status");
  }
  if (criteria.includes("her2 positive") && !biomarkers.includes("her2")) {
    uncertain.push("Trial may require HER2 positive status");
  }

  uncertain.push("Review full eligibility with your care team");

  const finalScore = Math.max(0, Math.min(100, score));
  
  let verdict: MatchResult["verdict"];
  if (finalScore >= 70) verdict = "likely_eligible";
  else if (finalScore >= 40) verdict = "possibly_eligible";
  else verdict = "unlikely_eligible";

  return {
    trial,
    fitScore: finalScore,
    verdict,
    explanation: { matches, conflicts, uncertain },
  };
}

const SCORING_SYSTEM_PROMPT = `You are an oncology trial matching assistant.

Given a user's profile and trial eligibility criteria, output a JSON object:
{
  "fitScore": 0-100,
  "verdict": "likely_eligible" | "possibly_eligible" | "unlikely_eligible",
  "matches": ["specific criteria they meet"],
  "conflicts": ["specific criteria that exclude them"],
  "uncertain": ["what info is needed to decide"]
}

Scoring guide:
- 90+: Clear fit on all major criteria
- 60-89: Fits primary criteria but uncertainties remain
- 30-59: Partial fit with concerns
- 0-29: Clear conflict (wrong cancer type, prohibited prior therapy, etc.)

Be honest. False hope and false rejection both hurt patients.
Never make medical recommendations - this is eligibility screening only.`;

async function scoreTrialLLM(
  trial: Trial,
  profile: UserProfile,
  useStrongModel: boolean
): Promise<MatchResult> {
  const userBlock = formatProfile(profile);
  const trialBlock = formatTrialForScoring(trial);

  // Use cheap model unless explicitly requesting strong model
  // With unlimited provider, can use strong model on everything
  const model = useStrongModel ? MODELS.strong : MODELS.cheap;

  try {
    const result = await chatCompletion({
      model,
      messages: [
        { role: "system", content: SCORING_SYSTEM_PROMPT },
        { role: "user", content: `USER:\n${userBlock}\n\nTRIAL:\n${trialBlock}\n\nOutput JSON only.` },
      ],
      temperature: 0.2,
      maxTokens: 800,
      responseFormat: "json",
    });

    logUsage(result, "match");

    const cleaned = result.content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as {
      fitScore: number;
      verdict: MatchResult["verdict"];
      matches: string[];
      conflicts: string[];
      uncertain: string[];
    };

    return {
      trial,
      fitScore: Math.max(0, Math.min(100, parsed.fitScore ?? 50)),
      verdict: parsed.verdict ?? "possibly_eligible",
      explanation: {
        matches: parsed.matches ?? [],
        conflicts: parsed.conflicts ?? [],
        uncertain: parsed.uncertain ?? ["Review with care team"],
      },
      modelUsed: model,
    };
  } catch (err) {
    console.error(`[matching] LLM failed for ${trial.id}:`, err);
    // Fall back to rule-based
    return { ...scoreTrialRuleBased(trial, profile), modelUsed: "rule-based (fallback)" };
  }
}

function formatProfile(p: UserProfile): string {
  return [
    `Cancer: ${p.cancerTypeIds.join(", ")}`,
    `Stage: ${p.stage}`,
    `Age: ${p.ageYears}`,
    `Sex: ${p.sex}`,
    `Prior treatments: ${p.priorTreatments.join("; ") || "None"}`,
    `Biomarkers: ${p.biomarkers || "Not reported"}`,
    `Location: ${p.countries.join(", ") || "Anywhere"}`,
    `Travel: ${p.willingToTravelInternational ? "Yes" : "No"}`,
  ].join("\n");
}

function formatTrialForScoring(t: Trial): string {
  return [
    `ID: ${t.id}`,
    `Title: ${t.briefTitle ?? t.officialTitle ?? "N/A"}`,
    `Phase: ${t.phase ?? "Unknown"}`,
    `Conditions: ${(t.conditions ?? []).join("; ")}`,
    `Interventions: ${t.interventions?.map(i => i.name).join("; ") ?? "N/A"}`,
    `Age: ${t.minAgeYears ?? "any"}-${t.maxAgeYears ?? "any"}`,
    `Sex: ${t.sex ?? "all"}`,
    ``,
    `ELIGIBILITY:`,
    t.eligibilityCriteria ?? "(not provided)",
  ].join("\n");
}

/**
 * Get cost estimate for matching.
 */
export function getMatchingCostEstimate(): string {
  if (isUnlimitedProvider()) {
    return "$0.00 (unlimited subscription)";
  }
  
  const provider = process.env.AI_PROVIDER || "anthropic";
  const costs: Record<string, string> = {
    quadmax: "$0.00 (unlimited)",
    openai: "~$0.03 per match (GPT-4o-mini)",
    gemini: "~$0.01 per match (Flash)",
    anthropic: "~$0.10 per match (Sonnet)",
    ollama: "$0.00 (local)",
  };
  
  return costs[provider] || "~$0.10 per match";
}
