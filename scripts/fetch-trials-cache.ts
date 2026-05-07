/**
 * Standalone script: fetch real cancer trials from ClinicalTrials.gov v2 API
 * and save them as a JSON cache file used by the mock DB.
 *
 * No Supabase or database required. Run with:
 *   npx tsx scripts/fetch-trials-cache.ts
 *   npx tsx scripts/fetch-trials-cache.ts --limit=200
 *
 * Output: src/lib/db/trials-cache.json
 */

import { writeFileSync } from "fs";
import { join } from "path";

const BASE_URL = "https://clinicaltrials.gov/api/v2/studies";
const PAGE_SIZE = 100;

const RELEVANT_STATUSES = [
  "RECRUITING",
  "NOT_YET_RECRUITING",
  "ENROLLING_BY_INVITATION",
];

const CANCER_QUERY =
  "(cancer OR carcinoma OR neoplasm OR tumor OR lymphoma OR leukemia OR myeloma OR sarcoma OR melanoma OR glioblastoma OR glioma)";

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : 500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseAge(ageStr?: string): number | null {
  if (!ageStr) return null;
  const m = ageStr.match(/(\d+)\s*(year|month|week|day)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("year")) return n;
  if (unit.startsWith("month")) return Math.floor(n / 12);
  if (unit.startsWith("week")) return Math.floor(n / 52);
  if (unit.startsWith("day")) return Math.floor(n / 365);
  return null;
}

function mapStatus(s?: string): string {
  const m: Record<string, string> = {
    RECRUITING: "recruiting",
    NOT_YET_RECRUITING: "not_yet_recruiting",
    ENROLLING_BY_INVITATION: "enrolling_by_invitation",
    ACTIVE_NOT_RECRUITING: "active_not_recruiting",
    COMPLETED: "completed",
    SUSPENDED: "suspended",
    TERMINATED: "terminated",
    WITHDRAWN: "withdrawn",
  };
  return m[s ?? ""] ?? "unknown";
}

// Best-effort cancer type extraction from condition strings
function extractCancerTypes(conditions: string[]): string[] {
  const joined = conditions.join(" ").toLowerCase();
  const types: string[] = [];
  const checks: [string, string][] = [
    ["lung", "lung_cancer"],
    ["breast", "breast_cancer"],
    ["colorect", "colorectal_cancer"],
    ["colon", "colorectal_cancer"],
    ["prostat", "prostate_cancer"],
    ["leuk", "leukemia"],
    ["lymphom", "lymphoma"],
    ["myelom", "myeloma"],
    ["melanom", "melanoma"],
    ["glioblast", "glioblastoma"],
    ["gliom", "glioma"],
    ["pancrea", "pancreatic_cancer"],
    ["ovar", "ovarian_cancer"],
    ["liver", "liver_cancer"],
    ["hepat", "liver_cancer"],
    ["bladder", "bladder_cancer"],
    ["kidney", "kidney_cancer"],
    ["renal", "kidney_cancer"],
    ["cervi", "cervical_cancer"],
    ["uteri", "uterine_cancer"],
    ["endometri", "uterine_cancer"],
    ["thyroid", "thyroid_cancer"],
    ["sarcoma", "sarcoma"],
    ["neuroblast", "neuroblastoma"],
    ["head and neck", "head_and_neck_cancer"],
    ["esophag", "esophageal_cancer"],
    ["gastric", "gastric_cancer"],
    ["stomach", "gastric_cancer"],
    ["mesotheliom", "mesothelioma"],
  ];
  for (const [keyword, type] of checks) {
    if (joined.includes(keyword) && !types.includes(type)) {
      types.push(type);
    }
  }
  return types.length > 0 ? types : ["other_cancer"];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStudy(study: any) {
  const proto = study.protocolSection ?? {};
  const id = proto.identificationModule?.nctId;
  if (!id) return null;

  const conditions: string[] =
    proto.conditionsModule?.conditions ?? [];

  const interventions = (
    proto.armsInterventionsModule?.interventions ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).map((i: any) => ({
    type: i.type ?? "Other",
    name: i.name ?? "",
    description: i.description,
  }));

  const locations = (
    proto.contactsLocationsModule?.locations ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).slice(0, 10).map((l: any) => ({
    facility: l.facility,
    city: l.city,
    state: l.state,
    country: l.country,
    status: l.status,
  }));

  const countries = [
    ...new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (proto.contactsLocationsModule?.locations ?? []).map((l: any) => l.country).filter(Boolean)
    ),
  ] as string[];

  const contacts = (proto.contactsLocationsModule?.centralContacts ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .slice(0, 3).map((c: any) => ({
      name: c.name,
      role: c.role,
      phone: c.phone,
      email: c.email,
    }));

  const status = proto.statusModule?.overallStatus;
  const phases: string[] = proto.designModule?.phases ?? [];

  return {
    id,
    source: "clinicaltrials_gov",
    sourceUrl: `https://clinicaltrials.gov/study/${id}`,
    crossReferenceIds: (proto.identificationModule?.secondaryIdInfos ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((s: any) => s.id).filter(Boolean),
    briefTitle: proto.identificationModule?.briefTitle ?? null,
    officialTitle: proto.identificationModule?.officialTitle ?? null,
    briefSummary: proto.descriptionModule?.briefSummary ?? null,
    detailedDescription: proto.descriptionModule?.detailedDescription ?? null,
    plainLanguageSummary: null,
    status: mapStatus(status),
    phase: phases.join("_") || null,
    studyType: proto.designModule?.studyType ?? null,
    conditions,
    cancerTypes: extractCancerTypes(conditions),
    interventions,
    modalities: [],
    eligibilityCriteria: proto.eligibilityModule?.eligibilityCriteria ?? null,
    minAgeYears: parseAge(proto.eligibilityModule?.minimumAge),
    maxAgeYears: parseAge(proto.eligibilityModule?.maximumAge),
    sex: proto.eligibilityModule?.sex ?? "ALL",
    healthyVolunteers: proto.eligibilityModule?.healthyVolunteers ?? false,
    enrollmentCount: proto.designModule?.enrollmentInfo?.count ?? null,
    startDate: proto.statusModule?.startDateStruct?.date ?? null,
    primaryCompletionDate: proto.statusModule?.primaryCompletionDateStruct?.date ?? null,
    completionDate: proto.statusModule?.completionDateStruct?.date ?? null,
    sponsorName: proto.sponsorCollaboratorsModule?.leadSponsor?.name ?? null,
    sponsorClass: proto.sponsorCollaboratorsModule?.leadSponsor?.class ?? null,
    collaborators: (proto.sponsorCollaboratorsModule?.collaborators ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => c.name).filter(Boolean),
    countries,
    locations,
    contacts,
    lastUpdated: proto.statusModule?.lastUpdatePostDateStruct?.date ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function main() {
  console.log(`Fetching up to ${LIMIT} recruiting cancer trials from ClinicalTrials.gov v2 API...`);
  console.log("Polite rate limiting: 300ms between pages\n");

  const results: ReturnType<typeof mapStudy>[] = [];
  let pageToken: string | undefined;
  let pageNum = 0;
  let totalFetched = 0;

  while (results.length < LIMIT) {
    pageNum++;
    const url = new URL(BASE_URL);
    url.searchParams.set("format", "json");
    url.searchParams.set("query.cond", CANCER_QUERY);
    url.searchParams.set("filter.overallStatus", RELEVANT_STATUSES.join(","));
    url.searchParams.set("pageSize", String(Math.min(PAGE_SIZE, LIMIT - results.length)));
    url.searchParams.set("countTotal", "true");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    process.stdout.write(`  Page ${pageNum} (${results.length}/${LIMIT} so far)...`);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "trial-finder-cache/0.1 (open-source patient tool; contact: admin@example.com)",
      },
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.log(" rate limited, waiting 5s...");
        await sleep(5000);
        pageNum--; // retry same page
        continue;
      }
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json() as any;
    const studies = data.studies ?? [];
    totalFetched += studies.length;

    let mapped = 0;
    for (const study of studies) {
      const trial = mapStudy(study);
      if (trial) {
        results.push(trial);
        mapped++;
      }
    }

    console.log(` ${mapped}/${studies.length} mapped`);

    pageToken = data.nextPageToken;
    if (!pageToken) {
      console.log("  No more pages from API.");
      break;
    }

    if (results.length >= LIMIT) break;

    // Polite rate limiting — be a good citizen
    await sleep(300);
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    source: "clinicaltrials.gov/api/v2",
    count: results.length,
    trials: results.filter(Boolean),
  };

  const outPath = join(process.cwd(), "src/lib/db/trials-cache.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\nDone! Saved ${results.length} trials to src/lib/db/trials-cache.json`);
  console.log(`Total API records scanned: ${totalFetched}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
