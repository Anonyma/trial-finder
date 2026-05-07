/**
 * UNIFIED classification script - works with any AI provider.
 * 
 * Usage:
 *   AI_PROVIDER=quadmax npm run ingest:classify-unified
 *   AI_PROVIDER=gemini npm run ingest:classify-unified -- --limit=100
 *   AI_PROVIDER=openai npm run ingest:classify-unified
 * 
 * Providers:
 *   - quadmax: Unlimited Claude ($20/mo subscription) - RECOMMENDED
 *   - gemini: Cheapest per-call (~$0.10 for 50k trials)
 *   - openai: GPT-4o-mini (~$0.50 for 50k trials)
 *   - anthropic: Original per-call (~$15 for 50k trials)
 *   - ollama: Local models (FREE, requires setup)
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { trials } from "../src/lib/db/schema";
import { sql, or, isNull, lt, eq } from "drizzle-orm";
import {
  classifyTrialUnified,
  CURRENT_CLASSIFICATION_VERSION,
} from "../src/lib/ingest/classify-unified";
import { isUnlimitedProvider, getProvider } from "../src/lib/ai/providers";

const CONCURRENCY = isUnlimitedProvider() ? 10 : 5;
const BATCH_SIZE = 100;

const args = new Set(process.argv.slice(2));
const MAX_PER_RUN = parseInt(
  [...args].find(a => a.startsWith("--limit="))?.split("=")[1] || "2000",
  10
);

async function fetchUnclassified(limit: number) {
  return db
    .select({
      id: trials.id,
      briefTitle: trials.briefTitle,
      briefSummary: trials.briefSummary,
      interventions: trials.interventions,
      conditions: trials.conditions,
    })
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

async function classifyOne(
  trialId: string,
  input: {
    briefTitle: string | null;
    briefSummary: string | null;
    interventions: Array<{ type: string; name: string; description?: string }> | null;
    conditions: string[];
  }
) {
  const startTime = Date.now();
  
  try {
    const result = await classifyTrialUnified(input);
    const duration = Date.now() - startTime;

    await db
      .update(trials)
      .set({
        modalities: result.modalities,
        plainLanguageSummary: result.plainLanguageSummary,
        lastClassifiedAt: new Date(),
        classificationVersion: CURRENT_CLASSIFICATION_VERSION,
      })
      .where(eq(trials.id, trialId));

    return { 
      id: trialId, 
      ok: true, 
      duration,
      modalities: result.modalities.length 
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[classify-unified] ${trialId} failed: ${message}`);

    // Mark as classified with empty modalities to avoid retry loop
    await db
      .update(trials)
      .set({
        modalities: ["other"],
        lastClassifiedAt: new Date(),
        classificationVersion: CURRENT_CLASSIFICATION_VERSION,
      })
      .where(eq(trials.id, trialId));

    return { id: trialId, ok: false, duration: Date.now() - startTime, error: message };
  }
}

async function main() {
  const provider = getProvider();
  const unlimited = isUnlimitedProvider();

  console.log("=== trial-finder UNIFIED classification ===");
  console.log(`Provider: ${provider} ${unlimited ? "(UNLIMITED)" : ""}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Max per run: ${MAX_PER_RUN}, concurrency: ${CONCURRENCY}`);
  console.log("");

  const batch = await fetchUnclassified(MAX_PER_RUN);
  console.log(`Found ${batch.length} trials to classify`);

  if (batch.length === 0) {
    console.log("Nothing to classify. Exiting.");
    process.exit(0);
  }

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let totalDuration = 0;

  // Process in parallel with concurrency limit
  const queue = [...batch];
  const running: Promise<void>[] = [];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()!;
      const result = await classifyOne(item.id, {
        briefTitle: item.briefTitle,
        briefSummary: item.briefSummary,
        interventions: item.interventions,
        conditions: item.conditions ?? [],
      });

      processed++;
      if (result.ok) succeeded++;
      else failed++;
      totalDuration += result.duration;

      if (processed % 50 === 0 || processed === batch.length) {
        const avgDuration = Math.round(totalDuration / processed);
        console.log(
          `  Progress: ${processed}/${batch.length} (${Math.round(processed/batch.length*100)}%) | ` +
          `✓ ${succeeded} ✗ ${failed} | avg ${avgDuration}ms/trial`
        );
      }
    }
  }

  // Start workers
  for (let i = 0; i < Math.min(CONCURRENCY, batch.length); i++) {
    running.push(worker());
  }

  await Promise.all(running);

  const totalTime = Date.now() - new Date(`${new Date().toISOString().split('T')[0]}T00:00:00.000Z`).getTime();
  
  console.log("\n" + "=".repeat(50));
  console.log("Classification Complete");
  console.log("=".repeat(50));
  console.log(`Provider: ${provider}`);
  console.log(`Total: ${processed}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Avg speed: ${Math.round(totalDuration / processed)}ms/trial`);
  
  if (unlimited) {
    console.log(`Cost: $0.00 (unlimited subscription)`);
  } else {
    // Rough estimate based on provider
    const costs: Record<string, number> = {
      gemini: 0.002,
      openai: 0.01,
      anthropic: 0.20,
    };
    const costPer1k = costs[provider] || 0.20;
    const estimatedCost = (processed / 1000) * costPer1k;
    console.log(`Estimated cost: ~$${estimatedCost.toFixed(2)} (${provider})`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
