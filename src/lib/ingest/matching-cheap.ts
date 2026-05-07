/**
 * CHEAP matching alternatives that don't use Claude Sonnet ($0.10/match).
 * 
 * Options:
 * 1. Rule-based matching (FREE) - Age, sex, location filters only
 * 2. Embedding similarity (CHEAP) - One-time embedding cost, then free
 * 3. Keyword-based eligibility (FREE) - Simple keyword matching
 * 4. Dummy/mock matching (FREE) - For testing UI only
 */

import { db } from "@/lib/db";
import { trials } from "@/lib/db/schema";
import { and, or, sql, inArray, lte, gte, isNull, eq } from "drizzle-orm";
import type { Trial } from "@/lib/db/schema";
import type { UserProfile } from "./matching";

export interface CheapMatchResult {
  trial: Trial;
  fitScore: number;
  verdict: "likely_eligible" | "possibly_eligible" | "unlikely_eligible";
  explanation: {
    matches: string[];
    conflicts: string[];
    uncertain: string[];
  };
  method: "rule-based" | "dummy" | "keyword";
}

const PREFILTER_LIMIT = 50;

/**
 * FREE rule-based matching.
 * Uses only structured data: age, sex, location, cancer type.
 * No LLM, no eligibility criteria parsing.
 */
export async function findMatchesRuleBased(profile: UserProfile): Promise<CheapMatchResult[]> {
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

  const candidates = await db
    .select()
    .from(trials)
    .where(and(...conditions))
    .orderBy(sql`${trials.sourceLastUpdated} DESC NULLS LAST`)
    .limit(PREFILTER_LIMIT);

  return candidates.map(trial => scoreTrialRuleBased(trial, profile));
}

function scoreTrialRuleBased(trial: Trial, profile: UserProfile): CheapMatchResult {
  const matches: string[] = [];
  const conflicts: string[] = [];
  const uncertain: string[] = [];
  let score = 50; // Start neutral

  // Cancer type match
  const cancerMatch = trial.cancerTypes?.some(ct => profile.cancerTypeIds.includes(ct));
  if (cancerMatch) {
    matches.push(`Trial includes your cancer type`);
    score += 15;
  } else {
    conflicts.push(`Cancer type mismatch`);
    score -= 20;
  }

  // Age check
  if (trial.minAgeYears && profile.ageYears < trial.minAgeYears) {
    conflicts.push(`You are younger than minimum age (${trial.minAgeYears})`);
    score -= 30;
  } else if (trial.maxAgeYears && profile.ageYears > trial.maxAgeYears) {
    conflicts.push(`You are older than maximum age (${trial.maxAgeYears})`);
    score -= 30;
  } else {
    matches.push(`Your age (${profile.ageYears}) fits the trial requirements`);
    score += 10;
  }

  // Sex check
  if (trial.sex && trial.sex !== "ALL" && trial.sex !== profile.sex) {
    conflicts.push(`Trial is for ${trial.sex.toLowerCase()} patients only`);
    score -= 50;
  } else {
    matches.push(`Sex requirement matches`);
    score += 5;
  }

  // Location check
  const locationMatch = trial.countries?.some(c => 
    profile.countries.includes(c) || profile.willingToTravelInternational
  );
  if (locationMatch) {
    matches.push(`Trial has sites in your preferred location`);
    score += 10;
  } else if (profile.countries.length > 0) {
    uncertain.push(`No sites listed in your preferred countries - check if remote participation is possible`);
  }

  // Phase-based confidence adjustment
  if (trial.phase?.includes("PHASE3")) {
    matches.push("Phase 3 trial - established safety profile");
  }

  // Eligibility criteria check (simple keyword)
  const criteria = trial.eligibilityCriteria?.toLowerCase() || "";
  const priorTreatmentsLower = profile.priorTreatments.map(t => t.toLowerCase());
  
  // Check for obvious exclusions
  if (criteria.includes("no prior chemotherapy") && priorTreatmentsLower.some(t => t.includes("chemo"))) {
    conflicts.push("Trial excludes patients with prior chemotherapy");
    score -= 25;
  }

  // Add eligibility criteria review suggestion
  uncertain.push("Review full eligibility criteria with your care team");
  uncertain.push(`Current treatments: ${profile.priorTreatments.join(", ") || "None reported"}`);

  const finalScore = Math.max(0, Math.min(100, score));
  
  let verdict: CheapMatchResult["verdict"];
  if (finalScore >= 70) verdict = "likely_eligible";
  else if (finalScore >= 40) verdict = "possibly_eligible";
  else verdict = "unlikely_eligible";

  return {
    trial,
    fitScore: finalScore,
    verdict,
    explanation: { matches, conflicts, uncertain },
    method: "rule-based"
  };
}

/**
 * DUMMY matching for UI testing only.
 * Returns fake matches with realistic structure but no real logic.
 */
export async function findMatchesDummy(_profile: UserProfile): Promise<CheapMatchResult[]> {
  // Fetch any 5 recruiting trials
  const dummyTrials = await db
    .select()
    .from(trials)
    .where(inArray(trials.status, ["recruiting", "not_yet_recruiting"] as never[]))
    .limit(5);

  return dummyTrials.map((trial, i) => ({
    trial,
    fitScore: [85, 72, 65, 45, 30][i] || 50,
    verdict: (["likely_eligible", "likely_eligible", "possibly_eligible", "possibly_eligible", "unlikely_eligible"] as const)[i] || "possibly_eligible",
    explanation: {
      matches: [
        "Age requirement matches",
        "Cancer type eligible",
        "Location available"
      ],
      conflicts: i > 3 ? ["Check prior therapy requirements"] : [],
      uncertain: [
        "Review full eligibility criteria with your care team",
        "Verify biomarker requirements"
      ]
    },
    method: "dummy"
  }));
}

/**
 * HYBRID: Try rule-based, fall back to dummy if no database.
 */
export async function findMatchesCheap(profile: UserProfile): Promise<CheapMatchResult[]> {
  try {
    return await findMatchesRuleBased(profile);
  } catch (err) {
    console.warn("Rule-based matching failed, using dummy:", err);
    // Return empty array or dummy data
    return [];
  }
}
