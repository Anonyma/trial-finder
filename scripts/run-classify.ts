/**
 * Modality classification + plain-language summary generation.
 *
 * Runs after ingestion. For each trial that:
 *   - has no classification yet (lastClassifiedAt IS NULL), OR
 *   - has a stale classification version (older than CURRENT_CLASSIFICATION_VERSION)
 *
 * we call Claude to classify modalities and generate a patient-friendly summary.
 *
 * We process in parallel batches with a concurrency limit to avoid rate limits.
 */

import "dotenv/config";
import pLimit from "p-limit";
import { db } from "../src/lib/db";
import { trials } from "../src/lib/db/schema";
import { sql, or, isNull, lt, eq } from "drizzle-orm";
import {
  classifyTrial,
  CURRENT_CLASSIFICATION_VERSION,
} from "../src/lib/ingest/classify";

const CONCURRENCY = 5;
const BATCH_SIZE = 100;
const MAX_PER_RUN = parseInt(process.env.MAX_CLASSIFY_PER_RUN || "2000", 10);

async function fetchUnclassified(limit: number) {
  return db
    .select()
    .from(trials)
    .where(
      or(
        isNull(trials.lastClassifiedAt),
        lt(trials.classificationVersion, CURRENT_CLASSIFICATION_VERSION)
      )
    )
    .orderBy(sql`${trials.sourceLastUpdated} DESC NULLS LAST`)
    .limit(limit);
}

async function classifyOne(trialId: string, input: {
  briefTitle: string | null;
  briefSummary: string | null;
  interventions: Array<{ type: string; name: string; description?: string }> | null;
  conditions: string[];
}) {
  try {
    const result = await classifyTrial(input);
    await db
      .update(trials)
      .set({
        modalities: result.modalities,
        plainLanguageSummary: result.plainLanguageSummary,
        lastClassifiedAt: new Date(),
        classificationVersion: CURRENT_CLASSIFICATION_VERSION,
      })
      .where(eq(trials.id, trialId));
    return { id: trialId, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[classify] ${trialId} failed: ${message}`);
    // Mark as classified but with empty modalities so we don't retry forever.
    // The next version bump will pick it up again.
    await db
      .update(trials)
      .set({
        modalities: ["other"],
        lastClassifiedAt: new Date(),
        classificationVersion: CURRENT_CLASSIFICATION_VERSION,
      })
      .where(eq(trials.id, trialId));
    return { id: trialId, ok: false };
  }
}

async function main() {
  console.log("=== trial-finder classification ===");
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Max per run: ${MAX_PER_RUN}, concurrency: ${CONCURRENCY}`);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const limit = pLimit(CONCURRENCY);

  while (processed < MAX_PER_RUN) {
    const remaining = MAX_PER_RUN - processed;
    const fetchN = Math.min(BATCH_SIZE, remaining);
    const batch = await fetchUnclassified(fetchN);
    if (batch.length === 0) {
      console.log("[classify] no more trials need classification, exiting");
      break;
    }

    const results = await Promise.all(
      batch.map((t) =>
        limit(() =>
          classifyOne(t.id, {
            briefTitle: t.briefTitle,
            briefSummary: t.briefSummary,
            interventions: t.interventions,
            conditions: t.conditions ?? [],
          })
        )
      )
    );

    for (const r of results) {
      processed++;
      if (r.ok) succeeded++;
      else failed++;
    }

    console.log(
      `[classify] processed ${processed}/${MAX_PER_RUN}  (✓ ${succeeded}  ✗ ${failed})`
    );
  }

  console.log(`Finished: ${new Date().toISOString()}`);
  console.log(`Total: ${processed}  succeeded: ${succeeded}  failed: ${failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error in classification:", err);
  process.exit(1);
});
