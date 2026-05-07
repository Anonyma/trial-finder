/**
 * ChiCTR (Chinese Clinical Trial Registry) ingestion.
 *
 * STATUS: STUB. Best primary path is via WHO ICTRP. Direct scraping is fragile.
 *
 * Why this is hard:
 *   - chictr.org.cn has aggressive bot protection and is frequently slow/down.
 *   - Many Chinese-only fields; English fields are often abbreviated or missing.
 *   - The cancer trials you most want (Chinese pharma CAR-T, TCE, mRNA programs)
 *     are often on chinadrugtrials.org.cn (NMPA Drug Clinical Trial Registration
 *     and Information Disclosure Platform), which is a separate, Chinese-only system.
 *
 * Recommended path (in order of effort vs. value):
 *   1. WHO ICTRP weekly XML — covers ChiCTR with English fields. Implement first.
 *   2. Direct ChiCTR scrape with retries/circuit-breaker — useful for fresher data,
 *      but expect 70–80% success rate.
 *   3. chinadrugtrials.org.cn scrape with Claude-based Chinese-to-English translation
 *      of key fields. Highest signal for Chinese pharma oncology pipeline. Significant
 *      engineering effort.
 *
 * If/when implementing direct ChiCTR:
 *   - Search endpoint: http://www.chictr.org.cn/searchproj.html (POSTs form data)
 *   - Detail pages: http://www.chictr.org.cn/showproj.html?proj={internal_id}
 *   - Use a polite User-Agent, throttle aggressively (≤0.5 req/s), retry on timeout.
 *   - Parse with cheerio; many fields are in tables with stable IDs.
 */

import { NewTrial } from "@/lib/db/schema";

export async function fetchChictr(opts: {
  full?: boolean;
  updatedSince?: string;
  onPage?: (trials: NewTrial[], pageNum: number) => Promise<void>;
}): Promise<{ total: number; oncologyCount: number }> {
  // TODO: Implement once ICTRP coverage is verified to be insufficient.
  console.warn(
    "[chictr] Skipped — direct scraper not yet implemented. ChiCTR data is available via ICTRP."
  );
  return { total: 0, oncologyCount: 0 };
}
