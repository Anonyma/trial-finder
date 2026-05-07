/**
 * ANZCTR (Australian New Zealand Clinical Trials Registry) ingestion.
 *
 * STATUS: STUB. Direct implementation possible but lower priority once ICTRP is wired up
 * (ICTRP includes ANZCTR data). Use this as a fallback or for fresher data.
 *
 * No public API. The search page accepts query parameters and returns parseable HTML.
 * Trial detail pages have stable structure.
 *
 * Implementation approach:
 *   1. POST to https://www.anzctr.org.au/TrialSearch.aspx with form data:
 *      - ctkSearchHealthCondition: "cancer" (or rotate through specific cancer terms)
 *      - ctkSearchRecruitmentStatus: "Recruiting", "Not yet recruiting", etc.
 *      - ctkSearchType: "Interventional"
 *   2. Parse result table to get a list of ACTRN trial IDs.
 *   3. For each ACTRN ID, fetch:
 *      https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?id={ACTRN_NUM}
 *      and parse the structured tables on the page.
 *   4. Throttle to ≤1 request/second; cache aggressively.
 *
 * Use a library like `cheerio` for HTML parsing (add to deps when you implement this).
 *
 * Output: trials with id="ACTRN12624...", source="anzctr",
 * sourceUrl="https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?id=...".
 */

import { NewTrial } from "@/lib/db/schema";

export async function fetchAnzctr(opts: {
  full?: boolean;
  updatedSince?: string;
  onPage?: (trials: NewTrial[], pageNum: number) => Promise<void>;
}): Promise<{ total: number; oncologyCount: number }> {
  // TODO: Implement scraper. For MVP, ANZCTR-specific data comes via ICTRP.
  console.warn(
    "[anzctr] Skipped — direct scraper not yet implemented. ANZCTR data is available via ICTRP."
  );
  return { total: 0, oncologyCount: 0 };
}
