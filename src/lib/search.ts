import { db } from "@/lib/db";
import { trials, type Trial } from "@/lib/db/schema";
import { and, sql, ilike, inArray, isNotNull, or } from "drizzle-orm";

export interface SearchParams {
  q?: string;
  cancerTypes?: string[];
  modalities?: string[];
  statuses?: string[];
  phases?: string[];
  countries?: string[];
  sponsorClass?: string[];
  page?: number;
  perPage?: number;
}

export interface SearchResult {
  trials: Trial[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 50;

// Mock trial for demo when DB is unavailable
const MOCK_TRIALS: Trial[] = [
  {
    id: "NCT05123456",
    source: "clinicaltrials_gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05123456",
    crossReferenceIds: [],
    briefTitle: "Immunotherapy for Advanced Lung Cancer",
    officialTitle: "A Phase 2 Study of Pembrolizumab Combined with Chemotherapy in Patients with Advanced Non-Small Cell Lung Cancer",
    briefSummary: "This study tests whether adding pembrolizumab to standard chemotherapy improves outcomes for patients with advanced lung cancer.",
    detailedDescription: null,
    plainLanguageSummary: "This trial is testing a combination of immunotherapy (pembrolizumab, which helps your immune system fight cancer) plus chemotherapy for people with advanced lung cancer. The goal is to see if the combination works better than chemotherapy alone.",
    status: "recruiting",
    phase: "PHASE2",
    studyType: "INTERVENTIONAL",
    conditions: ["Non-Small Cell Lung Cancer", "NSCLC"],
    cancerTypes: ["nsclc"],
    interventions: [{ type: "DRUG", name: "Pembrolizumab" }, { type: "DRUG", name: "Carboplatin" }, { type: "DRUG", name: "Paclitaxel" }],
    modalities: ["checkpoint_inhibitor", "chemotherapy", "combination"],
    eligibilityCriteria: "Inclusion Criteria:\n- Age 18+\n- Confirmed NSCLC\n- No prior systemic therapy\n\nExclusion Criteria:\n- Active autoimmune disease\n- Prior immunotherapy",
    minAgeYears: 18,
    maxAgeYears: null,
    sex: "ALL",
    healthyVolunteers: false,
    enrollmentCount: 120,
    startDate: "2024-01-15",
    primaryCompletionDate: "2026-06-01",
    completionDate: null,
    sponsorName: "National Cancer Institute",
    sponsorClass: "NIH",
    collaborators: ["Memorial Sloan Kettering"],
    countries: ["United States"],
    locations: [{ facility: "Memorial Sloan Kettering", city: "New York", state: "NY", country: "United States", zip: "10065" }],
    primaryOutcomes: [{ measure: "Progression-free survival", timeFrame: "2 years" }],
    secondaryOutcomes: [{ measure: "Overall survival", timeFrame: "3 years" }],
    centralContacts: [{ name: "Dr. Jane Smith", role: "Principal Investigator", email: "smithj@mskcc.org" }],
    sourceLastUpdated: new Date("2025-01-10"),
    ingestedAt: new Date(),
    lastClassifiedAt: new Date(),
    classificationVersion: 1,
    rawData: null,
  },
  {
    id: "NCT05234567",
    source: "clinicaltrials_gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05234567",
    crossReferenceIds: [],
    briefTitle: "CAR-T Cell Therapy for Pancreatic Cancer",
    officialTitle: "Phase 1 Study of Autologous CAR-T Cells Targeting Mesothelin in Pancreatic Adenocarcinoma",
    briefSummary: "Testing a new CAR-T cell therapy that targets mesothelin, a protein found on pancreatic cancer cells.",
    detailedDescription: null,
    plainLanguageSummary: "This experimental therapy uses your own immune cells (T cells), modifies them in the lab to recognize pancreatic cancer cells, and infuses them back into your body. This is an early-phase trial to test safety and find the right dose.",
    status: "recruiting",
    phase: "PHASE1",
    studyType: "INTERVENTIONAL",
    conditions: ["Pancreatic Cancer", "Pancreatic Adenocarcinoma"],
    cancerTypes: ["pancreatic"],
    interventions: [{ type: "BIOLOGICAL", name: "Anti-mesothelin CAR-T cells" }],
    modalities: ["car_t", "cell_gene"],
    eligibilityCriteria: "Inclusion Criteria:\n- Age 18-75\n- Metastatic pancreatic cancer\n- Failed at least one prior therapy\n\nExclusion Criteria:\n- Active infection\n- Prior CAR-T therapy",
    minAgeYears: 18,
    maxAgeYears: 75,
    sex: "ALL",
    healthyVolunteers: false,
    enrollmentCount: 36,
    startDate: "2024-03-01",
    primaryCompletionDate: "2025-12-01",
    completionDate: null,
    sponsorName: "BioTech Pharma Inc",
    sponsorClass: "INDUSTRY",
    collaborators: [],
    countries: ["United States", "Canada"],
    locations: [
      { facility: "MD Anderson", city: "Houston", state: "TX", country: "United States" },
      { facility: "Princess Margaret", city: "Toronto", state: "ON", country: "Canada" }
    ],
    primaryOutcomes: [{ measure: "Safety and tolerability", timeFrame: "1 year" }],
    secondaryOutcomes: [{ measure: "Objective response rate", timeFrame: "6 months" }],
    centralContacts: [{ name: "Dr. Michael Chen", role: "Study Director", email: "mchen@biotech.com" }],
    sourceLastUpdated: new Date("2025-01-05"),
    ingestedAt: new Date(),
    lastClassifiedAt: new Date(),
    classificationVersion: 1,
    rawData: null,
  },
  {
    id: "NCT05345678",
    source: "clinicaltrials_gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05345678",
    crossReferenceIds: [],
    briefTitle: "Radioligand Therapy for Prostate Cancer",
    officialTitle: "Phase 3 Trial of 177Lu-PSMA-617 in Metastatic Castration-Resistant Prostate Cancer",
    briefSummary: "Testing a targeted radiation therapy that delivers radiation directly to prostate cancer cells.",
    detailedDescription: null,
    plainLanguageSummary: "This trial tests a precision radiation treatment that targets PSMA, a protein on prostate cancer cells. The radiation is attached to a molecule that finds and kills cancer cells while sparing healthy tissue.",
    status: "recruiting",
    phase: "PHASE3",
    studyType: "INTERVENTIONAL",
    conditions: ["Prostate Cancer", "Metastatic Castration-Resistant Prostate Cancer"],
    cancerTypes: ["prostate"],
    interventions: [{ type: "DRUG", name: "177Lu-PSMA-617 (Pluvicto)" }, { type: "DRUG", name: "Standard of care" }],
    modalities: ["radioligand", "radiotherapy"],
    eligibilityCriteria: "Inclusion Criteria:\n- Age 18+\n- mCRPC with PSMA-positive disease\n- Prior taxane therapy allowed\n\nExclusion Criteria:\n- Prior PSMA-targeted radioligand therapy",
    minAgeYears: 18,
    maxAgeYears: null,
    sex: "MALE",
    healthyVolunteers: false,
    enrollmentCount: 750,
    startDate: "2023-06-01",
    primaryCompletionDate: "2026-12-01",
    completionDate: null,
    sponsorName: "Novartis Pharmaceuticals",
    sponsorClass: "INDUSTRY",
    collaborators: ["Stanford University", "Dana-Farber Cancer Institute"],
    countries: ["United States", "Canada", "Germany", "France", "United Kingdom"],
    locations: [
      { facility: "Stanford Cancer Center", city: "Palo Alto", state: "CA", country: "United States" },
      { facility: "Dana-Farber", city: "Boston", state: "MA", country: "United States" },
      { facility: "University Hospital Heidelberg", city: "Heidelberg", country: "Germany" }
    ],
    primaryOutcomes: [{ measure: "Overall survival", timeFrame: "3 years" }],
    secondaryOutcomes: [{ measure: "Radiographic progression-free survival", timeFrame: "2 years" }],
    centralContacts: [{ name: "Dr. Sarah Johnson", role: "Global PI", email: "sjohnson@novartis.com" }],
    sourceLastUpdated: new Date("2025-01-08"),
    ingestedAt: new Date(),
    lastClassifiedAt: new Date(),
    classificationVersion: 1,
    rawData: null,
  },
  {
    id: "NCT05456789",
    source: "clinicaltrials_gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05456789",
    crossReferenceIds: [],
    briefTitle: "mRNA Vaccine for Melanoma",
    officialTitle: "Personalized Neoantigen mRNA Vaccine Combined with Pembrolizumab in Resected High-Risk Melanoma",
    briefSummary: "Testing a personalized mRNA vaccine designed to prevent melanoma recurrence after surgery.",
    detailedDescription: null,
    plainLanguageSummary: "This trial tests a personalized vaccine made from your tumor's DNA. The vaccine teaches your immune system to recognize and attack any remaining cancer cells, combined with pembrolizumab to boost the immune response.",
    status: "not_yet_recruiting",
    phase: "PHASE2",
    studyType: "INTERVENTIONAL",
    conditions: ["Melanoma", "Stage III Melanoma"],
    cancerTypes: ["melanoma"],
    interventions: [{ type: "BIOLOGICAL", name: "Personalized mRNA vaccine" }, { type: "DRUG", name: "Pembrolizumab" }],
    modalities: ["mrna_vaccine", "checkpoint_inhibitor", "vaccines"],
    eligibilityCriteria: "Inclusion Criteria:\n- Age 18+\n- Resected stage III/IV melanoma\n- High risk of recurrence\n\nExclusion Criteria:\n- Active autoimmune disease\n- Prior immunotherapy within 6 months",
    minAgeYears: 18,
    maxAgeYears: null,
    sex: "ALL",
    healthyVolunteers: false,
    enrollmentCount: 150,
    startDate: "2025-03-01",
    primaryCompletionDate: "2028-03-01",
    completionDate: null,
    sponsorName: "Moderna, Inc",
    sponsorClass: "INDUSTRY",
    collaborators: ["Merck"],
    countries: ["United States", "Australia", "Spain"],
    locations: [
      { facility: "UCLA Medical Center", city: "Los Angeles", state: "CA", country: "United States" },
      { facility: "Melanoma Institute Australia", city: "Sydney", country: "Australia" }
    ],
    primaryOutcomes: [{ measure: "Recurrence-free survival", timeFrame: "2 years" }],
    secondaryOutcomes: [{ measure: "Distant metastasis-free survival", timeFrame: "3 years" }],
    centralContacts: [{ name: "Dr. Emily Rodriguez", role: "Medical Monitor", email: "erodriguez@moderna.com" }],
    sourceLastUpdated: new Date("2025-01-12"),
    ingestedAt: new Date(),
    lastClassifiedAt: new Date(),
    classificationVersion: 1,
    rawData: null,
  },
  {
    id: "NCT05567890",
    source: "clinicaltrials_gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05567890",
    crossReferenceIds: [],
    briefTitle: "TIL Therapy for Advanced Melanoma",
    officialTitle: "Expanded Access Protocol for Tumor-Infiltrating Lymphocyte Therapy in Metastatic Melanoma",
    briefSummary: "Providing access to TIL therapy for patients with metastatic melanoma who have exhausted standard treatments.",
    detailedDescription: null,
    plainLanguageSummary: "TIL therapy involves taking immune cells from your tumor, growing them in the lab to billions, and infusing them back to attack the cancer. This expanded access program offers this treatment when standard options have failed.",
    status: "enrolling_by_invitation",
    phase: "NA",
    studyType: "EXPANDED_ACCESS",
    conditions: ["Metastatic Melanoma"],
    cancerTypes: ["melanoma"],
    interventions: [{ type: "BIOLOGICAL", name: "Tumor-infiltrating lymphocytes (TIL)" }, { type: "DRUG", name: "IL-2" }],
    modalities: ["til", "cell_gene", "cytokine"],
    eligibilityCriteria: "Inclusion Criteria:\n- Age 18+\n- Metastatic melanoma\n- Progressed on anti-PD-1 and BRAF/MEK if applicable\n\nExclusion Criteria:\n- Brain metastases\n- ECOG > 1",
    minAgeYears: 18,
    maxAgeYears: null,
    sex: "ALL",
    healthyVolunteers: false,
    enrollmentCount: 50,
    startDate: "2024-09-01",
    primaryCompletionDate: "2026-09-01",
    completionDate: null,
    sponsorName: "Iovance Biotherapeutics",
    sponsorClass: "INDUSTRY",
    collaborators: [],
    countries: ["United States"],
    locations: [
      { facility: "Moffitt Cancer Center", city: "Tampa", state: "FL", country: "United States" },
      { facility: "City of Hope", city: "Duarte", state: "CA", country: "United States" }
    ],
    primaryOutcomes: [{ measure: "Overall response rate", timeFrame: "1 year" }],
    secondaryOutcomes: [{ measure: "Duration of response", timeFrame: "2 years" }],
    centralContacts: [{ name: "Dr. Robert Kim", role: "Medical Director", email: "rkim@iovance.com" }],
    sourceLastUpdated: new Date("2025-01-03"),
    ingestedAt: new Date(),
    lastClassifiedAt: new Date(),
    classificationVersion: 1,
    rawData: null,
  }
];

export async function searchTrials(
  params: SearchParams
): Promise<SearchResult> {
  // If DB fails, fallback to mock data for demo
  try {
    return await searchTrialsWithDB(params);
  } catch (e) {
    console.warn("DB search failed, using mock data:", e);
    return searchTrialsMock(params);
  }
}

async function searchTrialsWithDB(
  params: SearchParams
): Promise<SearchResult> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(5, params.perPage ?? DEFAULT_PER_PAGE));

  const conditions = [];

  // Text search across title and conditions
  if (params.q && params.q.trim()) {
    const q = `%${params.q.trim().replace(/[%_]/g, (s) => `\\${s}`)}%`;
    conditions.push(
      or(
        ilike(trials.briefTitle, q),
        ilike(trials.officialTitle, q),
        ilike(trials.briefSummary, q),
        sql`EXISTS (SELECT 1 FROM unnest(${trials.conditions}) AS c WHERE c ILIKE ${q})`
      )
    );
  }

  if (params.cancerTypes && params.cancerTypes.length > 0) {
    conditions.push(sql`${trials.cancerTypes} && ${params.cancerTypes}`);
  }

  if (params.modalities && params.modalities.length > 0) {
    conditions.push(sql`${trials.modalities} && ${params.modalities}`);
  }

  if (params.statuses && params.statuses.length > 0) {
    conditions.push(inArray(trials.status, params.statuses as never));
  } else {
    // Default to recruiting / not yet recruiting / enrolling by invitation
    conditions.push(
      inArray(trials.status, [
        "recruiting",
        "not_yet_recruiting",
        "enrolling_by_invitation",
      ] as never)
    );
  }

  if (params.phases && params.phases.length > 0) {
    const phasePatterns = params.phases.map((p) => `%${p}%`);
    conditions.push(
      or(...phasePatterns.map((p) => ilike(trials.phase, p)))
    );
  }

  if (params.countries && params.countries.length > 0) {
    conditions.push(sql`${trials.countries} && ${params.countries}`);
  }

  if (params.sponsorClass && params.sponsorClass.length > 0) {
    conditions.push(inArray(trials.sponsorClass, params.sponsorClass));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Run count + page in parallel
  const [countResult, rows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(trials)
      .where(whereClause),
    db
      .select()
      .from(trials)
      .where(whereClause)
      .orderBy(
        // Recruiting first, then by recency
        sql`CASE ${trials.status}
          WHEN 'recruiting' THEN 0
          WHEN 'not_yet_recruiting' THEN 1
          WHEN 'enrolling_by_invitation' THEN 2
          ELSE 3
        END`,
        sql`${trials.sourceLastUpdated} DESC NULLS LAST`
      )
      .limit(perPage)
      .offset((page - 1) * perPage),
  ]);

  const total = countResult[0]?.total ?? 0;
  return {
    trials: rows,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): SearchParams {
  const arrayParam = (key: string): string[] | undefined => {
    const v = searchParams[key];
    if (!v) return undefined;
    const arr = Array.isArray(v) ? v : v.split(",");
    return arr.filter(Boolean);
  };
  const stringParam = (key: string): string | undefined => {
    const v = searchParams[key];
    if (!v) return undefined;
    return Array.isArray(v) ? v[0] : v;
  };

  return {
    q: stringParam("q"),
    cancerTypes: arrayParam("cancer"),
    modalities: arrayParam("modality"),
    statuses: arrayParam("status"),
    phases: arrayParam("phase"),
    countries: arrayParam("country"),
    sponsorClass: arrayParam("sponsor"),
    page: stringParam("page") ? parseInt(stringParam("page")!, 10) : 1,
  };
}

// Mock search function when DB is unavailable
function searchTrialsMock(params: SearchParams): SearchResult {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(5, params.perPage ?? DEFAULT_PER_PAGE));

  let filtered = [...MOCK_TRIALS];

  // Text search
  if (params.q && params.q.trim()) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(t =>
      (t.briefTitle?.toLowerCase().includes(q) ?? false) ||
      (t.officialTitle?.toLowerCase().includes(q) ?? false) ||
      (t.briefSummary?.toLowerCase().includes(q) ?? false) ||
      t.conditions?.some(c => c.toLowerCase().includes(q))
    );
  }

  // Cancer type filter
  if (params.cancerTypes && params.cancerTypes.length > 0) {
    filtered = filtered.filter(t =>
      t.cancerTypes?.some(ct => params.cancerTypes!.includes(ct))
    );
  }

  // Modality filter
  if (params.modalities && params.modalities.length > 0) {
    filtered = filtered.filter(t =>
      t.modalities?.some(m => params.modalities!.includes(m))
    );
  }

  // Status filter (default to recruiting-like)
  if (params.statuses && params.statuses.length > 0) {
    filtered = filtered.filter(t => params.statuses!.includes(t.status));
  } else {
    filtered = filtered.filter(t =>
      ["recruiting", "not_yet_recruiting", "enrolling_by_invitation"].includes(t.status)
    );
  }

  // Phase filter
  if (params.phases && params.phases.length > 0) {
    filtered = filtered.filter(t =>
      params.phases!.some(p => t.phase?.toLowerCase().includes(p.toLowerCase()))
    );
  }

  // Country filter
  if (params.countries && params.countries.length > 0) {
    filtered = filtered.filter(t =>
      t.countries?.some(c => params.countries!.includes(c))
    );
  }

  // Sort: recruiting first, then by recency
  filtered.sort((a, b) => {
    const statusOrder: Record<string, number> = {
      recruiting: 0,
      not_yet_recruiting: 1,
      enrolling_by_invitation: 2,
    };
    const aOrder = statusOrder[a.status] ?? 3;
    const bOrder = statusOrder[b.status] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (b.sourceLastUpdated?.getTime() ?? 0) - (a.sourceLastUpdated?.getTime() ?? 0);
  });

  const total = filtered.length;
  const start = (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  return {
    trials: paginated,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}
