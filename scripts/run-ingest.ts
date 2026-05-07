/**
 * Main ingestion entry point. Run via:
 *   pnpm ingest         — incremental (last 7 days)
 *   pnpm ingest:full    — full backfill (all recruiting cancer trials)
 *
 * Designed to run from GitHub Actions on a daily schedule.
 *
 * Flow:
 *   1. Open ingestion_runs row
 *   2. For each source, fetch + upsert in pages
 *   3. Close ingestion_runs row with stats
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { trials, ingestionRuns, type NewTrial } from "../src/lib/db/schema";
import { fetchClinicalTrialsGov } from "../src/lib/ingest/clinicaltrials-gov";
import { fetchIctrp } from "../src/lib/ingest/ictrp";
import { fetchAnzctr } from "../src/lib/ingest/anzctr";
import { fetchChictr } from "../src/lib/ingest/chictr";
import { sql } from "drizzle-orm";

const SOURCES = [
  { name: "clinicaltrials_gov" as const, fn: fetchClinicalTrialsGov, enabled: true },
  { name: "ictrp" as const, fn: fetchIctrp, enabled: false },
  { name: "anzctr" as const, fn: fetchAnzctr, enabled: false },
  { name: "chictr" as const, fn: fetchChictr, enabled: false },
];

const args = new Set(process.argv.slice(2));
const FULL = args.has("--full");

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function upsertTrials(batch: NewTrial[]): Promise<{ inserted: number; updated: number }> {
  if (batch.length === 0) return { inserted: 0, updated: 0 };

  // Use INSERT ... ON CONFLICT (id) DO UPDATE for atomic upsert.
  // We track inserts vs updates by comparing the row's xmax (rough proxy).
  const result = await db
    .insert(trials)
    .values(batch)
    .onConflictDoUpdate({
      target: trials.id,
      set: {
        source: sql`excluded.source`,
        sourceUrl: sql`excluded.source_url`,
        crossReferenceIds: sql`excluded.cross_reference_ids`,
        briefTitle: sql`excluded.brief_title`,
        officialTitle: sql`excluded.official_title`,
        briefSummary: sql`excluded.brief_summary`,
        detailedDescription: sql`excluded.detailed_description`,
        status: sql`excluded.status`,
        phase: sql`excluded.phase`,
        studyType: sql`excluded.study_type`,
        conditions: sql`excluded.conditions`,
        cancerTypes: sql`excluded.cancer_types`,
        interventions: sql`excluded.interventions`,
        eligibilityCriteria: sql`excluded.eligibility_criteria`,
        minAgeYears: sql`excluded.min_age_years`,
        maxAgeYears: sql`excluded.max_age_years`,
        sex: sql`excluded.sex`,
        healthyVolunteers: sql`excluded.healthy_volunteers`,
        enrollmentCount: sql`excluded.enrollment_count`,
        startDate: sql`excluded.start_date`,
        primaryCompletionDate: sql`excluded.primary_completion_date`,
        completionDate: sql`excluded.completion_date`,
        sponsorName: sql`excluded.sponsor_name`,
        sponsorClass: sql`excluded.sponsor_class`,
        collaborators: sql`excluded.collaborators`,
        countries: sql`excluded.countries`,
        locations: sql`excluded.locations`,
        primaryOutcomes: sql`excluded.primary_outcomes`,
        secondaryOutcomes: sql`excluded.secondary_outcomes`,
        centralContacts: sql`excluded.central_contacts`,
        sourceLastUpdated: sql`excluded.source_last_updated`,
        // Note: do NOT touch modalities, plainLanguageSummary, lastClassifiedAt — those
        // are owned by the classifier job and we don't want to clobber them.
      },
    });

  // We don't get insert/update split from postgres-js easily without RETURNING xmax.
  // Treat the whole batch as "upserts" — the classifier will handle whichever need re-classification.
  return { inserted: batch.length, updated: 0 };
}

async function runSource(source: (typeof SOURCES)[number]): Promise<void> {
  if (!source.enabled) {
    console.log(`[${source.name}] disabled, skipping`);
    return;
  }

  const [run] = await db
    .insert(ingestionRuns)
    .values({ source: source.name, status: "running" })
    .returning();
  if (!run) throw new Error("Failed to create ingestion run row");

  let trialsSeen = 0;
  let trialsInserted = 0;
  let trialsUpdated = 0;

  try {
    const updatedSince = FULL ? undefined : dateNDaysAgo(7);
    console.log(
      `[${source.name}] starting ${
        FULL ? "FULL" : `INCREMENTAL since ${updatedSince}`
      }`
    );

    const stats = await source.fn({
      full: FULL,
      updatedSince,
      onPage: async (batch, pageNum) => {
        trialsSeen += batch.length;
        const { inserted, updated } = await upsertTrials(batch);
        trialsInserted += inserted;
        trialsUpdated += updated;
        console.log(
          `[${source.name}] page ${pageNum}: +${batch.length} oncology trials (running total ${trialsInserted})`
        );
      },
    });

    await db
      .update(ingestionRuns)
      .set({
        status: "succeeded",
        completedAt: new Date(),
        trialsSeen,
        trialsInserted,
        trialsUpdated,
        metadata: { totalFromSource: stats.total, oncologyCount: stats.oncologyCount },
      })
      .where(sql`${ingestionRuns.id} = ${run.id}`);

    console.log(
      `[${source.name}] DONE — saw ${trialsSeen} oncology trials (source returned ${stats.total})`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${source.name}] FAILED: ${message}`);
    await db
      .update(ingestionRuns)
      .set({
        status: "failed",
        completedAt: new Date(),
        trialsSeen,
        trialsInserted,
        trialsUpdated,
        errorMessage: message,
      })
      .where(sql`${ingestionRuns.id} = ${run.id}`);
    throw err;
  }
}

async function main() {
  console.log("=== trial-finder ingestion ===");
  console.log(`Mode: ${FULL ? "FULL backfill" : "incremental (last 7 days)"}`);
  console.log(`Started: ${new Date().toISOString()}`);

  for (const source of SOURCES) {
    try {
      await runSource(source);
    } catch (err) {
      console.error(`Source ${source.name} failed but continuing with others`);
    }
  }

  console.log(`Finished: ${new Date().toISOString()}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error in ingestion:", err);
  process.exit(1);
});
