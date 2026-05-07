/**
 * Cheap classification using keywords instead of Claude API.
 * 
 * Use this for testing with real data without spending $10-15 on LLM classification.
 * 
 * Usage:
 *   npm run ingest:classify-cheap
 * 
 * Options:
 *   --limit=100     # Only classify first N trials (default: 1000)
 *   --ollama        # Use local Ollama LLM if available (better quality, still free)
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { trials } from "../src/lib/db/schema";
import { sql, or, isNull, lt, eq } from "drizzle-orm";
import { 
  classifyTrialCheap, 
  classifyTrialLocal, 
  isOllamaAvailable 
} from "../src/lib/ingest/classify-cheap";

const CURRENT_CLASSIFICATION_VERSION = 99; // Different from LLM version to allow side-by-side

const args = new Set(process.argv.slice(2));
const LIMIT = parseInt(
  [...args].find(a => a.startsWith("--limit="))?.split("=")[1] || "1000",
  10
);
const USE_OLLAMA = args.has("--ollama");

async function fetchUnclassified(limit: number) {
  return db
    .select({
      id: trials.id,
      briefTitle: trials.briefTitle,
      briefSummary: trials.briefSummary,
      interventions: trials.interventions,
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
  useOllama: boolean,
  input: {
    briefTitle: string | null;
    briefSummary: string | null;
    interventions: Array<{ type: string; name: string; description?: string }> | null;
  }
) {
  try {
    let result;
    
    if (useOllama) {
      result = await classifyTrialLocal(
        input.briefTitle,
        input.briefSummary,
        input.interventions
      );
    } else {
      result = classifyTrialCheap(
        input.briefTitle,
        input.briefSummary,
        input.interventions
      );
    }

    await db
      .update(trials)
      .set({
        modalities: result.modalities,
        plainLanguageSummary: result.plainLanguageSummary,
        lastClassifiedAt: new Date(),
        classificationVersion: CURRENT_CLASSIFICATION_VERSION,
      })
      .where(eq(trials.id, trialId));

    return { id: trialId, ok: true, method: result.method };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[classify-cheap] ${trialId} failed: ${message}`);
    
    // Fallback to basic classification
    const fallback = classifyTrialCheap(
      input.briefTitle,
      input.briefSummary,
      input.interventions
    );
    
    await db
      .update(trials)
      .set({
        modalities: fallback.modalities,
        lastClassifiedAt: new Date(),
        classificationVersion: CURRENT_CLASSIFICATION_VERSION,
      })
      .where(eq(trials.id, trialId));

    return { id: trialId, ok: false, method: "fallback" };
  }
}

async function main() {
  console.log("=== trial-finder CHEAP classification ===");
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Limit: ${LIMIT}, Use Ollama: ${USE_OLLAMA}`);

  // Check Ollama availability if requested
  if (USE_OLLAMA) {
    const available = await isOllamaAvailable();
    if (!available) {
      console.log("⚠️  Ollama not available on localhost:11434");
      console.log("   Install: https://ollama.com/download");
      console.log("   Then run: ollama pull llama3.2:3b");
      console.log("   Falling back to keyword classification...\n");
    } else {
      console.log("✅ Ollama detected - using local LLM\n");
    }
  }

  const batch = await fetchUnclassified(LIMIT);
  console.log(`Found ${batch.length} trials to classify`);

  if (batch.length === 0) {
    console.log("Nothing to classify. Exiting.");
    process.exit(0);
  }

  let succeeded = 0;
  let failed = 0;
  let keywordCount = 0;
  let ollamaCount = 0;

  // Process sequentially to avoid overwhelming local Ollama
  for (let i = 0; i < batch.length; i++) {
    const t = batch[i];
    const result = await classifyOne(
      t.id,
      USE_OLLAMA,
      {
        briefTitle: t.briefTitle,
        briefSummary: t.briefSummary,
        interventions: t.interventions,
      }
    );

    if (result.ok) succeeded++;
    else failed++;
    
    if (result.method === "keyword") keywordCount++;
    else ollamaCount++;

    if ((i + 1) % 50 === 0) {
      console.log(`  Processed ${i + 1}/${batch.length}...`);
    }
  }

  console.log(`\nFinished: ${new Date().toISOString()}`);
  console.log(`Total: ${batch.length}  ✓ ${succeeded}  ✗ ${failed}`);
  console.log(`Methods: keyword=${keywordCount}  ollama=${ollamaCount}`);
  console.log(`\nCost: $0.00 (keyword-based classification)`);
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
