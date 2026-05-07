/**
 * WHO ICTRP (International Clinical Trials Registry Platform) ingestion.
 *
 * STATUS: STUB. Requires SharePoint access from WHO.
 *
 * Why ICTRP matters: it aggregates ChiCTR (China), ANZCTR (Australia/NZ), CTRI (India),
 * jRCT (Japan), KCT (Korea), EU-CTR, ISRCTN, and more — about 20 registries total.
 * It's the most efficient single source for non-ClinicalTrials.gov global coverage.
 *
 * How to enable:
 *   1. Email ictrpinfo@who.int requesting SharePoint folder access for weekly bulk
 *      download of new/updated records. Mention this is for a non-commercial
 *      patient-facing oncology trial aggregator.
 *   2. They will provide credentials and a SharePoint URL with weekly XML files.
 *   3. Implement download + XML parse below. The format is documented at
 *      https://www.who.int/tools/clinical-trials-registry-platform/network/who-data-set
 *   4. Add WHO_ICTRP_USERNAME, WHO_ICTRP_PASSWORD, WHO_ICTRP_SHAREPOINT_URL to env.
 *
 * Key fields in ICTRP XML to extract:
 *   - TrialID (registry-prefixed: e.g. "ChiCTR2400012345", "ACTRN12624000001234")
 *   - Public_title / Scientific_title
 *   - Recruitment_Status
 *   - Date_registration / Last_Refreshed_on
 *   - Source_Register (use this to set our `source` enum)
 *   - Primary_sponsor
 *   - Condition (semicolon-separated)
 *   - Intervention (semicolon-separated)
 *   - Inclusion/Exclusion criteria
 *   - Countries (semicolon-separated)
 *   - Contact_Firstname / Contact_Lastname / Contact_Email
 *
 * Deduplication: ICTRP records may include NCT IDs in Secondary_IDs. We use these
 * to merge with ClinicalTrials.gov records via the `crossReferenceIds` field.
 */

import { NewTrial } from "@/lib/db/schema";

export async function fetchIctrp(opts: {
  full?: boolean;
  updatedSince?: string;
  onPage?: (trials: NewTrial[], pageNum: number) => Promise<void>;
}): Promise<{ total: number; oncologyCount: number }> {
  // TODO: Implement once SharePoint access is granted by WHO.
  console.warn(
    "[ictrp] Skipped — WHO ICTRP SharePoint access not yet configured. See src/lib/ingest/ictrp.ts for instructions."
  );
  return { total: 0, oncologyCount: 0 };
}
