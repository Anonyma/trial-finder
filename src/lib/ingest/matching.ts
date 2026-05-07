/**
 * Structured matching: takes a user profile and returns ranked trials they may be
 * eligible for, with plain-language explanations.
 *
 * Two-stage filter:
 *
 * Stage 1 — SQL pre-filter (cheap, exact):
 *   - Status must be recruiting / not yet recruiting / enrolling by invitation
 *   - At least one cancer_types overlap with user's cancer type(s)
 *   - User's age within trial's age range (if specified)
 *   - User's sex matches trial's sex requirement
 *   - At least one location in user's selected countries (if any)
 *
 * Stage 2 — LLM eligibility match (Sonnet, ~30 candidates):
 *   - Reads the trial's full eligibility criteria
 *   - Compares to the user's stage, prior treatments, biomarkers
 *   - Outputs a fit score (0–100), a verdict (likely_eligible / possibly_eligible /
 *     unlikely_eligible), and a plain-language explanation of which criteria match,
 *     which conflict, and which the user can't determine without more info.
 *
 * The LLM step is expensive enough that we cap at 30 trials per match request and
 * cache by (trial_id, user_profile_hash) for subsequent visits.
 */

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { trials } from "@/lib/db/schema";
import { and, or, sql, inArray, lte, gte, isNull, eq } from "drizzle-orm";
import type { Trial } from "@/lib/db/schema";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MATCHING_MODEL =
  process.env.MATCHING_MODEL || "claude-sonnet-4-6";

export interface UserProfile {
  cancerTypeIds: string[]; // from our taxonomy
  stage: "early" | "locally_advanced" | "metastatic" | "recurrent" | "unknown";
  priorTreatments: string[]; // free-text list, e.g. ["FOLFIRINOX", "gemcitabine + nab-paclitaxel", "radiation to pancreas"]
  biomarkers: string; // free-text, e.g. "HER2 negative, MSS, KRAS G12D, BRCA wildtype"
  ageYears: number;
  sex: "MALE" | "FEMALE" | "OTHER";
  countries: string[]; // ISO names, e.g. ["United States", "India"]; empty = anywhere
  willingToTravelInternational: boolean;
  additionalContext?: string; // anything else the user wants to share
}

export interface MatchResult {
  trial: Trial;
  fitScore: number; // 0–100
  verdict: "likely_eligible" | "possibly_eligible" | "unlikely_eligible";
  explanation: {
    matches: string[]; // criteria the user appears to satisfy
    conflicts: string[]; // criteria that exclude the user
    uncertain: string[]; // criteria that need more info
  };
}

const MATCH_LIMIT_LLM = 30;
const PREFILTER_LIMIT = 200;

export async function findMatches(profile: UserProfile): Promise<MatchResult[]> {
  // Stage 1: SQL pre-filter
  const candidates = await sqlPrefilter(profile);
  if (candidates.length === 0) return [];

  // Stage 2: LLM scoring on the top N
  const toScore = candidates.slice(0, MATCH_LIMIT_LLM);
  const scored = await Promise.all(toScore.map((t) => scoreTrial(t, profile)));

  // Sort by score desc
  scored.sort((a, b) => b.fitScore - a.fitScore);
  return scored;
}

async function sqlPrefilter(profile: UserProfile): Promise<Trial[]> {
  const recruitingStatuses: Array<
    "recruiting" | "not_yet_recruiting" | "enrolling_by_invitation"
  > = ["recruiting", "not_yet_recruiting", "enrolling_by_invitation"];

  const conditions = [
    inArray(trials.status, recruitingStatuses),
    // Cancer type overlap
    sql`${trials.cancerTypes} && ${profile.cancerTypeIds}`,
    // Age — only filter if trial specifies bounds
    or(
      isNull(trials.minAgeYears),
      lte(trials.minAgeYears, profile.ageYears)
    ),
    or(
      isNull(trials.maxAgeYears),
      gte(trials.maxAgeYears, profile.ageYears)
    ),
    // Sex match — "ALL" trials match anyone
    or(
      isNull(trials.sex),
      eq(trials.sex, "ALL"),
      eq(trials.sex, profile.sex)
    ),
  ];

  // Country filter (only if user specified countries AND is not willing to travel internationally)
  if (
    profile.countries.length > 0 &&
    !profile.willingToTravelInternational
  ) {
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

const SCORING_SYSTEM_PROMPT = `You are an oncology trial matching assistant. Given a user's medical profile and a trial's eligibility criteria, judge how well the user fits.

Output rules:
- Respond ONLY with valid JSON, no markdown.
- JSON shape: {"fitScore": number 0–100, "verdict": "likely_eligible"|"possibly_eligible"|"unlikely_eligible", "matches": [strings], "conflicts": [strings], "uncertain": [strings]}
- "matches": criteria the user appears to satisfy (1 sentence each, plain language).
- "conflicts": criteria that exclude the user (1 sentence each, be specific about what excludes them).
- "uncertain": criteria where you can't tell from the user's info — list what info would resolve it.
- fitScore guide: 90+ = clear fit on all major criteria; 60-89 = fits primary criteria but uncertainty on details; 30-59 = partial fit, several uncertainties or minor conflicts; 0-29 = clear conflict on a major criterion (e.g., wrong cancer subtype, prohibited prior therapy, biomarker mismatch).
- verdict: "likely_eligible" for 70+, "possibly_eligible" for 40-69, "unlikely_eligible" for <40.

Be honest. False hope hurts patients. False rejection also hurts patients. When uncertain, say so in the "uncertain" array rather than guessing.

Never make medical recommendations. You are evaluating eligibility match only — actual enrollment requires medical screening by the trial team.`;

async function scoreTrial(
  trial: Trial,
  profile: UserProfile
): Promise<MatchResult> {
  const userBlock = formatProfile(profile);
  const trialBlock = formatTrialForScoring(trial);

  try {
    const response = await anthropic.messages.create({
      model: MATCHING_MODEL,
      max_tokens: 800,
      system: SCORING_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `USER PROFILE:\n${userBlock}\n\nTRIAL:\n${trialBlock}\n\nRespond with the JSON object only.`,
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const cleaned = text
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
      fitScore: clamp(parsed.fitScore ?? 0, 0, 100),
      verdict: parsed.verdict ?? "possibly_eligible",
      explanation: {
        matches: parsed.matches ?? [],
        conflicts: parsed.conflicts ?? [],
        uncertain: parsed.uncertain ?? [],
      },
    };
  } catch (err) {
    // If the LLM call fails for any reason, return a low-confidence default
    // so the trial still appears but with a clear "couldn't auto-match" signal.
    console.error("[matching] scoreTrial failed for", trial.id, err);
    return {
      trial,
      fitScore: 30,
      verdict: "possibly_eligible",
      explanation: {
        matches: [],
        conflicts: [],
        uncertain: [
          "Automatic matching couldn't be completed for this trial — review the eligibility criteria with your care team.",
        ],
      },
    };
  }
}

function formatProfile(p: UserProfile): string {
  const lines: string[] = [];
  lines.push(`Cancer type(s): ${p.cancerTypeIds.join(", ")}`);
  lines.push(`Stage: ${p.stage}`);
  lines.push(`Age: ${p.ageYears}`);
  lines.push(`Sex: ${p.sex}`);
  lines.push(
    `Prior treatments: ${
      p.priorTreatments.length > 0 ? p.priorTreatments.join("; ") : "None reported"
    }`
  );
  lines.push(`Biomarkers / molecular profile: ${p.biomarkers || "Not reported"}`);
  lines.push(
    `Countries available for treatment: ${
      p.countries.length > 0 ? p.countries.join(", ") : "Anywhere"
    }`
  );
  lines.push(
    `Willing to travel internationally: ${
      p.willingToTravelInternational ? "Yes" : "No"
    }`
  );
  if (p.additionalContext) {
    lines.push(`Additional context: ${p.additionalContext}`);
  }
  return lines.join("\n");
}

function formatTrialForScoring(t: Trial): string {
  const lines: string[] = [];
  lines.push(`Trial ID: ${t.id}`);
  lines.push(`Title: ${t.briefTitle ?? t.officialTitle ?? "(no title)"}`);
  lines.push(`Phase: ${t.phase ?? "Unknown"}`);
  lines.push(`Status: ${t.status}`);
  lines.push(`Conditions: ${(t.conditions ?? []).join("; ") || "(none)"}`);
  if (t.interventions) {
    lines.push(
      `Interventions: ${t.interventions
        .map((iv) => `[${iv.type}] ${iv.name}`)
        .join("; ")}`
    );
  }
  lines.push(`Modalities (auto-classified): ${(t.modalities ?? []).join(", ")}`);
  lines.push(
    `Locations (countries): ${(t.countries ?? []).join(", ") || "(none)"}`
  );
  lines.push(
    `Age range: ${t.minAgeYears ?? "no min"}–${t.maxAgeYears ?? "no max"} years`
  );
  lines.push(`Sex: ${t.sex ?? "ALL"}`);
  lines.push("");
  lines.push("ELIGIBILITY CRITERIA:");
  lines.push(t.eligibilityCriteria ?? "(not provided)");
  return lines.join("\n");
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
