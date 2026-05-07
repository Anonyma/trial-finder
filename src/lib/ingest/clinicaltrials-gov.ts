/**
 * ClinicalTrials.gov API v2 ingestion.
 *
 * Docs: https://clinicaltrials.gov/data-api/api
 * Endpoint: https://clinicaltrials.gov/api/v2/studies
 *
 * Strategy:
 *  - Query for cancer-related trials with status RECRUITING / NOT_YET_RECRUITING /
 *    ENROLLING_BY_INVITATION / ACTIVE_NOT_RECRUITING (the latter is included because
 *    some sites within a multi-site trial may still be enrolling even if "active not
 *    recruiting" is the global status).
 *  - For incremental runs, filter by LastUpdatePostDate >= last successful run minus 2 days
 *    (overlap for safety).
 *  - For full backfill, paginate through everything.
 *  - Page size 1000 (max), JSON format.
 *  - Map to our normalized schema; `isOncologyTrial()` is the final gate.
 */

import { NewTrial } from "@/lib/db/schema";
import { classifyCancerTypes, isOncologyTrial } from "@/lib/taxonomy/cancer-types";

const BASE_URL = "https://clinicaltrials.gov/api/v2/studies";
const PAGE_SIZE = 1000;

// Conditions query — broad oncology terms. CT.gov interprets these as OR.
const CANCER_QUERY =
  "(cancer OR carcinoma OR neoplasm OR tumor OR lymphoma OR leukemia OR myeloma OR sarcoma OR melanoma OR glioblastoma OR glioma)";

const RELEVANT_STATUSES = [
  "RECRUITING",
  "NOT_YET_RECRUITING",
  "ENROLLING_BY_INVITATION",
  "ACTIVE_NOT_RECRUITING",
];

// CT.gov uses these status strings; we map to our enum.
const STATUS_MAP: Record<string, NewTrial["status"]> = {
  RECRUITING: "recruiting",
  NOT_YET_RECRUITING: "not_yet_recruiting",
  ENROLLING_BY_INVITATION: "enrolling_by_invitation",
  ACTIVE_NOT_RECRUITING: "active_not_recruiting",
  COMPLETED: "completed",
  SUSPENDED: "suspended",
  TERMINATED: "terminated",
  WITHDRAWN: "withdrawn",
  UNKNOWN: "unknown",
};

interface FetchOpts {
  /** ISO date string (YYYY-MM-DD). If provided, only fetch trials updated on or after this date. */
  updatedSince?: string;
  /** If true, ignore updatedSince and paginate everything. */
  full?: boolean;
  /** Optional callback per page so the caller can stream results to the DB. */
  onPage?: (trials: NewTrial[], pageNum: number) => Promise<void>;
}

export async function fetchClinicalTrialsGov(opts: FetchOpts = {}): Promise<{
  total: number;
  oncologyCount: number;
}> {
  const { updatedSince, full = false, onPage } = opts;

  // Build the advanced filter. CT.gov v2 uses "filter.advanced" with their query DSL.
  const advancedParts: string[] = [];
  if (!full && updatedSince) {
    advancedParts.push(
      `AREA[LastUpdatePostDate]RANGE[${updatedSince},MAX]`
    );
  }
  // Status filter
  advancedParts.push(
    `AREA[OverallStatus]COVERAGE[FullMatch] ${RELEVANT_STATUSES.map((s) => `OverallStatus EQ ${s}`).join(" OR ")}`
  );

  let pageToken: string | undefined;
  let pageNum = 0;
  let total = 0;
  let oncologyCount = 0;

  while (true) {
    pageNum++;
    const url = new URL(BASE_URL);
    url.searchParams.set("format", "json");
    url.searchParams.set("query.cond", CANCER_QUERY);
    url.searchParams.set(
      "filter.overallStatus",
      RELEVANT_STATUSES.join(",")
    );
    if (!full && updatedSince) {
      url.searchParams.set(
        "filter.advanced",
        `AREA[LastUpdatePostDate]RANGE[${updatedSince},MAX]`
      );
    }
    url.searchParams.set("pageSize", String(PAGE_SIZE));
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    url.searchParams.set("countTotal", "true");

    const res = await fetchWithRetry(url.toString());
    if (!res.ok) {
      throw new Error(
        `ClinicalTrials.gov API error: ${res.status} ${res.statusText}`
      );
    }
    const data = (await res.json()) as CTGovResponse;

    const studies = data.studies || [];
    total += studies.length;

    const parsed: NewTrial[] = [];
    for (const study of studies) {
      const trial = mapStudyToTrial(study);
      if (!trial) continue;
      // Final filter: must be oncology
      if (!isOncologyTrial(trial.conditions || [])) continue;
      parsed.push(trial);
      oncologyCount++;
    }

    if (onPage && parsed.length > 0) {
      await onPage(parsed, pageNum);
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;

    // Polite rate limiting — CT.gov is generous but we don't need to hammer it
    await sleep(150);
  }

  return { total, oncologyCount };
}

async function fetchWithRetry(
  url: string,
  attempts = 3
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "trial-finder-ingest/0.1 (open-source patient tool)",
        },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(1000 * Math.pow(2, i));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      await sleep(1000 * Math.pow(2, i));
    }
  }
  throw lastErr ?? new Error("fetch failed");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- mapping ---

interface CTGovResponse {
  studies: CTGovStudy[];
  nextPageToken?: string;
  totalCount?: number;
}

interface CTGovStudy {
  protocolSection?: {
    identificationModule?: {
      nctId: string;
      briefTitle?: string;
      officialTitle?: string;
      secondaryIdInfos?: Array<{ id: string; type?: string; domain?: string }>;
    };
    statusModule?: {
      overallStatus?: string;
      lastUpdatePostDateStruct?: { date?: string };
      startDateStruct?: { date?: string };
      primaryCompletionDateStruct?: { date?: string };
      completionDateStruct?: { date?: string };
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: { name?: string; class?: string };
      collaborators?: Array<{ name?: string; class?: string }>;
    };
    descriptionModule?: {
      briefSummary?: string;
      detailedDescription?: string;
    };
    conditionsModule?: { conditions?: string[]; keywords?: string[] };
    designModule?: {
      studyType?: string;
      phases?: string[];
      enrollmentInfo?: { count?: number };
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        type?: string;
        name?: string;
        description?: string;
      }>;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      minimumAge?: string;
      maximumAge?: string;
      sex?: string;
      healthyVolunteers?: boolean;
    };
    contactsLocationsModule?: {
      centralContacts?: Array<{
        name?: string;
        role?: string;
        phone?: string;
        email?: string;
      }>;
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
        status?: string;
        geoPoint?: { lat?: number; lon?: number };
        contacts?: Array<{
          name?: string;
          role?: string;
          phone?: string;
          email?: string;
        }>;
      }>;
    };
    outcomesModule?: {
      primaryOutcomes?: Array<{
        measure?: string;
        description?: string;
        timeFrame?: string;
      }>;
      secondaryOutcomes?: Array<{
        measure?: string;
        description?: string;
        timeFrame?: string;
      }>;
    };
  };
}

function parseAge(input?: string): number | null {
  if (!input) return null;
  // CT.gov gives strings like "18 Years", "6 Months", "N/A"
  const m = input.match(/(\d+(?:\.\d+)?)\s*(year|month|week|day)/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  switch (unit) {
    case "year":
      return Math.round(value);
    case "month":
      return Math.round(value / 12);
    case "week":
      return Math.round(value / 52);
    case "day":
      return Math.round(value / 365);
    default:
      return null;
  }
}

function mapStudyToTrial(study: CTGovStudy): NewTrial | null {
  const ps = study.protocolSection;
  if (!ps) return null;
  const id = ps.identificationModule?.nctId;
  if (!id) return null;

  const conditions = ps.conditionsModule?.conditions ?? [];
  const cancerTypes = classifyCancerTypes(conditions);

  const overallStatus = ps.statusModule?.overallStatus;
  const status: NewTrial["status"] =
    (overallStatus && STATUS_MAP[overallStatus]) || "unknown";

  const phases = ps.designModule?.phases ?? [];
  const phase = phases.length ? phases.join("/") : null;

  const interventions = (ps.armsInterventionsModule?.interventions ?? []).map(
    (iv) => ({
      type: iv.type ?? "OTHER",
      name: iv.name ?? "Unnamed",
      description: iv.description,
    })
  );

  const locations = (ps.contactsLocationsModule?.locations ?? []).map((loc) => ({
    facility: loc.facility,
    city: loc.city,
    state: loc.state,
    country: loc.country ?? "Unknown",
    zip: loc.zip,
    status: loc.status,
    latitude: loc.geoPoint?.lat,
    longitude: loc.geoPoint?.lon,
    contacts: loc.contacts ?? undefined,
  }));

  const countries = Array.from(
    new Set(locations.map((l) => l.country).filter(Boolean) as string[])
  );

  // Cross-reference IDs from secondary IDs (we strip the trial registry IDs that we
  // care about — useful for cross-registry deduplication later)
  const crossRefs: string[] = [];
  for (const sec of ps.identificationModule?.secondaryIdInfos ?? []) {
    if (sec.id) crossRefs.push(sec.id);
  }

  const sponsorName = ps.sponsorCollaboratorsModule?.leadSponsor?.name;
  const sponsorClass = ps.sponsorCollaboratorsModule?.leadSponsor?.class;
  const collaborators = (
    ps.sponsorCollaboratorsModule?.collaborators ?? []
  ).map((c) => c.name ?? "Unknown");

  return {
    id,
    source: "clinicaltrials_gov",
    sourceUrl: `https://clinicaltrials.gov/study/${id}`,
    crossReferenceIds: crossRefs,
    briefTitle: ps.identificationModule?.briefTitle ?? null,
    officialTitle: ps.identificationModule?.officialTitle ?? null,
    briefSummary: ps.descriptionModule?.briefSummary ?? null,
    detailedDescription: ps.descriptionModule?.detailedDescription ?? null,
    plainLanguageSummary: null, // generated later by classifier
    status,
    phase,
    studyType: ps.designModule?.studyType ?? null,
    conditions,
    cancerTypes,
    interventions,
    modalities: [], // populated by classifier
    eligibilityCriteria: ps.eligibilityModule?.eligibilityCriteria ?? null,
    minAgeYears: parseAge(ps.eligibilityModule?.minimumAge),
    maxAgeYears: parseAge(ps.eligibilityModule?.maximumAge),
    sex: ps.eligibilityModule?.sex ?? null,
    healthyVolunteers: ps.eligibilityModule?.healthyVolunteers ?? null,
    enrollmentCount: ps.designModule?.enrollmentInfo?.count ?? null,
    startDate: ps.statusModule?.startDateStruct?.date ?? null,
    primaryCompletionDate:
      ps.statusModule?.primaryCompletionDateStruct?.date ?? null,
    completionDate: ps.statusModule?.completionDateStruct?.date ?? null,
    sponsorName: sponsorName ?? null,
    sponsorClass: sponsorClass ?? null,
    collaborators,
    countries,
    locations,
    primaryOutcomes:
      ps.outcomesModule?.primaryOutcomes?.map((o) => ({
        measure: o.measure ?? "",
        description: o.description,
        timeFrame: o.timeFrame,
      })) ?? null,
    secondaryOutcomes:
      ps.outcomesModule?.secondaryOutcomes?.map((o) => ({
        measure: o.measure ?? "",
        description: o.description,
        timeFrame: o.timeFrame,
      })) ?? null,
    centralContacts:
      ps.contactsLocationsModule?.centralContacts?.map((c) => ({
        name: c.name,
        role: c.role,
        phone: c.phone,
        email: c.email,
      })) ?? null,
    sourceLastUpdated: ps.statusModule?.lastUpdatePostDateStruct?.date
      ? new Date(ps.statusModule.lastUpdatePostDateStruct.date)
      : null,
    rawData: null, // we don't store raw data in the DB to save space; can refetch from API on demand
  };
}
