/**
 * Mock data for local development without database.
 * This allows running the UI and testing features without Supabase.
 */

import type { Trial } from "./schema";

export const mockTrials: Trial[] = [
  {
    id: "NCT05123456",
    source: "clinicaltrials_gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05123456",
    crossReferenceIds: [],
    briefTitle: "Immunotherapy for Advanced Melanoma",
    officialTitle: "A Phase 2 Study of Pembrolizumab Combined with Novel Cancer Vaccine in Metastatic Melanoma",
    briefSummary: "This study evaluates the safety and effectiveness of combining pembrolizumab (Keytruda) with a personalized cancer vaccine for patients with advanced melanoma that has spread to other parts of the body.",
    detailedDescription: "Patients with confirmed metastatic melanoma will receive pembrolizumab 200mg IV every 3 weeks combined with a neoantigen-based personalized cancer vaccine administered subcutaneously. The primary endpoint is objective response rate. Secondary endpoints include progression-free survival, overall survival, and safety profile.",
    plainLanguageSummary: "Testing whether a personalized cancer vaccine plus Keytruda works better than Keytruda alone for advanced skin cancer.",
    status: "recruiting",
    phase: "PHASE2",
    studyType: "Interventional",
    conditions: ["Melanoma", "Metastatic Melanoma", "Skin Cancer"],
    cancerTypes: ["melanoma"],
    interventions: [
      { type: "Biological", name: "Pembrolizumab", description: "Anti-PD-1 checkpoint inhibitor" },
      { type: "Biological", name: "Personalized Cancer Vaccine", description: "Neoantigen-based vaccine" }
    ],
    modalities: ["immunotherapy", "vaccine"],
    eligibilityCriteria: `Inclusion Criteria:
- Age 18-75 years
- Histologically confirmed metastatic melanoma
- Measurable disease per RECIST 1.1
- ECOG performance status 0-1
- Adequate organ function

Exclusion Criteria:
- Prior anti-PD-1 therapy
- Active autoimmune disease requiring systemic therapy
- Brain metastases unless stable for 3 months`,
    minAgeYears: 18,
    maxAgeYears: 75,
    sex: "ALL",
    healthyVolunteers: false,
    enrollmentCount: 120,
    startDate: "2024-01-15",
    primaryCompletionDate: "2026-06-30",
    completionDate: "2027-12-31",
    sponsorName: "University Cancer Institute",
    sponsorClass: "OTHER",
    collaborators: ["National Cancer Institute"],
    countries: ["United States", "Canada"],
    locations: [
      { facility: "Memorial Cancer Center", city: "New York", state: "NY", country: "United States", zip: "10021", latitude: 40.764, longitude: -73.957 },
      { facility: "West Coast Oncology", city: "Los Angeles", state: "CA", country: "United States", zip: "90048", latitude: 34.073, longitude: -118.376 },
      { facility: "Toronto General Hospital", city: "Toronto", state: "Ontario", country: "Canada", zip: "M5G 2C4", latitude: 43.659, longitude: -79.387 }
    ],
    primaryOutcomes: [{ measure: "Objective Response Rate", description: "Percentage of patients with complete or partial response", timeFrame: "Up to 2 years" }],
    secondaryOutcomes: [
      { measure: "Progression-Free Survival", description: "Time from randomization to disease progression or death", timeFrame: "Up to 3 years" },
      { measure: "Overall Survival", description: "Time from randomization to death from any cause", timeFrame: "Up to 5 years" }
    ],
    centralContacts: [
      { name: "Dr. Sarah Chen", role: "Principal Investigator", phone: "212-555-0100", email: "s.chen@cancer-center.org" }
    ],
    sourceLastUpdated: new Date("2025-04-15"),
    ingestedAt: new Date("2025-04-16"),
    lastClassifiedAt: new Date("2025-04-16"),
    classificationVersion: 1,
    rawData: null
  },
  {
    id: "NCT05234567",
    source: "clinicaltrials_gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05234567",
    crossReferenceIds: [],
    briefTitle: "CAR-T Cell Therapy for Relapsed B-Cell Lymphoma",
    officialTitle: "Phase 1/2 Study of CD19-Targeted CAR-T Cells in Patients with Relapsed or Refractory B-Cell Non-Hodgkin Lymphoma",
    briefSummary: "This trial tests a new type of immunotherapy using patient's own immune cells that have been modified in the lab to attack lymphoma cells.",
    detailedDescription: "Autologous T cells are collected, transduced with a CD19-targeting CAR construct, expanded, and infused after lymphodepletion. Dose escalation in Phase 1, expansion in Phase 2.",
    plainLanguageSummary: "Using genetically modified immune cells to fight lymphoma that has come back after standard treatment.",
    status: "recruiting",
    phase: "PHASE1/PHASE2",
    studyType: "Interventional",
    conditions: ["Non-Hodgkin Lymphoma", "B-Cell Lymphoma", "Diffuse Large B-Cell Lymphoma"],
    cancerTypes: ["non-hodgkin-lymphoma", "b-cell-lymphoma"],
    interventions: [
      { type: "Biological", name: "CD19-CAR-T Cells", description: "Autologous anti-CD19 CAR-T cells" },
      { type: "Drug", name: "Fludarabine", description: "Lymphodepletion chemotherapy" },
      { type: "Drug", name: "Cyclophosphamide", description: "Lymphodepletion chemotherapy" }
    ],
    modalities: ["cell_therapy", "gene_therapy"],
    eligibilityCriteria: `Inclusion Criteria:
- Age 18-70 years
- CD19+ relapsed/refractory B-NHL
- Failed at least 2 prior lines of therapy
- ECOG 0-2
- Adequate organ function

Exclusion Criteria:
- Active CNS lymphoma
- Prior allogeneic stem cell transplant
- Active infection requiring IV antibiotics`,
    minAgeYears: 18,
    maxAgeYears: 70,
    sex: "ALL",
    healthyVolunteers: false,
    enrollmentCount: 60,
    startDate: "2024-03-01",
    primaryCompletionDate: "2026-12-31",
    completionDate: "2028-06-30",
    sponsorName: "BioCell Therapeutics",
    sponsorClass: "INDUSTRY",
    collaborators: ["Stanford University"],
    countries: ["United States"],
    locations: [
      { facility: "Stanford Cancer Institute", city: "Stanford", state: "CA", country: "United States", zip: "94305", latitude: 37.441, longitude: -122.143 },
      { facility: "MD Anderson Cancer Center", city: "Houston", state: "TX", country: "United States", zip: "77030", latitude: 29.707, longitude: -95.401 }
    ],
    primaryOutcomes: [{ measure: "Safety and Tolerability", description: "Incidence of dose-limiting toxicities", timeFrame: "28 days post-infusion" }],
    secondaryOutcomes: [
      { measure: "Complete Response Rate", description: "Percentage achieving complete metabolic response", timeFrame: "3 months" },
      { measure: "Duration of Response", description: "Time from response to progression or death", timeFrame: "2 years" }
    ],
    centralContacts: [
      { name: "Dr. Michael Rodriguez", role: "Study Director", phone: "650-555-0200", email: "m.rodriguez@biocell.com" }
    ],
    sourceLastUpdated: new Date("2025-04-10"),
    ingestedAt: new Date("2025-04-16"),
    lastClassifiedAt: new Date("2025-04-16"),
    classificationVersion: 1,
    rawData: null
  },
  {
    id: "NCT05345678",
    source: "clinicaltrials_gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05345678",
    crossReferenceIds: ["ChiCTR2400012345"],
    briefTitle: "Radiation + Immunotherapy for Lung Cancer",
    officialTitle: "Stereotactic Body Radiation Therapy Combined with Durvalumab for Stage III Non-Small Cell Lung Cancer",
    briefSummary: "Combining precise high-dose radiation with immunotherapy to improve outcomes for locally advanced lung cancer.",
    detailedDescription: "Patients with unresectable Stage III NSCLC receive SBRT (30 Gy in 5 fractions) followed by durvalumab 1500mg IV q4w for up to 12 months. Primary endpoint: PFS. Secondary: OS, safety.",
    plainLanguageSummary: "Testing if targeted radiation plus an immunotherapy drug works better than standard chemo-radiation for lung cancer.",
    status: "not_yet_recruiting",
    phase: "PHASE2",
    studyType: "Interventional",
    conditions: ["Non-Small Cell Lung Cancer", "Stage III Lung Cancer", "NSCLC"],
    cancerTypes: ["lung", "nsclc"],
    interventions: [
      { type: "Radiation", name: "Stereotactic Body Radiation Therapy", description: "30 Gy in 5 fractions" },
      { type: "Biological", name: "Durvalumab", description: "Anti-PD-L1 checkpoint inhibitor" }
    ],
    modalities: ["radiation", "immunotherapy"],
    eligibilityCriteria: `Inclusion Criteria:
- Stage III NSCLC, unresectable
- ECOG 0-1
- No prior radiation to thorax
- Adequate organ function

Exclusion Criteria:
- EGFR mutation or ALK rearrangement
- Prior immunotherapy
- Active autoimmune disease`,
    minAgeYears: 18,
    maxAgeYears: null,
    sex: "ALL",
    healthyVolunteers: false,
    enrollmentCount: 180,
    startDate: "2025-06-01",
    primaryCompletionDate: "2028-12-31",
    completionDate: "2030-06-30",
    sponsorName: "AstraZeneca",
    sponsorClass: "INDUSTRY",
    collaborators: ["NRG Oncology"],
    countries: ["United States", "United Kingdom", "Germany", "Japan"],
    locations: [
      { facility: "Royal Marsden Hospital", city: "London", country: "United Kingdom", latitude: 51.489, longitude: -0.206 },
      { facility: "University Hospital Heidelberg", city: "Heidelberg", country: "Germany", latitude: 49.412, longitude: 8.672 }
    ],
    primaryOutcomes: [{ measure: "Progression-Free Survival", description: "Time from randomization to progression or death", timeFrame: "3 years" }],
    secondaryOutcomes: [
      { measure: "Overall Survival", description: "Time from randomization to death", timeFrame: "5 years" },
      { measure: "Local Control Rate", description: "Percentage without local recurrence", timeFrame: "2 years" }
    ],
    centralContacts: [
      { name: "Dr. Emily Watson", role: "Global Lead", phone: "+44-20-5555-0300", email: "e.watson@astrazeneca.com" }
    ],
    sourceLastUpdated: new Date("2025-03-20"),
    ingestedAt: new Date("2025-04-16"),
    lastClassifiedAt: new Date("2025-04-16"),
    classificationVersion: 1,
    rawData: null
  },
  {
    id: "NCT05456789",
    source: "clinicaltrials_gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05456789",
    crossReferenceIds: [],
    briefTitle: "Targeted Therapy for HER2+ Breast Cancer",
    officialTitle: "Trastuzumab Deruxtecan vs Physician's Choice in HER2-Low Metastatic Breast Cancer",
    briefSummary: "Comparing a new antibody-drug conjugate to standard chemotherapy for breast cancer with low levels of HER2 protein.",
    detailedDescription: "Open-label randomized Phase 3 trial. Arm A: T-DXd 5.4 mg/kg IV q3w. Arm B: Physician's choice of chemotherapy (capecitabine, eribulin, vinorelbine, or gemcitabine). Stratified by prior lines of therapy and HR status.",
    plainLanguageSummary: "Comparing a targeted drug that delivers chemotherapy directly to cancer cells versus standard chemo for advanced breast cancer.",
    status: "recruiting",
    phase: "PHASE3",
    studyType: "Interventional",
    conditions: ["Breast Cancer", "HER2-Low Breast Cancer", "Metastatic Breast Cancer"],
    cancerTypes: ["breast"],
    interventions: [
      { type: "Drug", name: "Trastuzumab Deruxtecan", description: "HER2-directed antibody-drug conjugate" },
      { type: "Drug", name: "Capecitabine", description: "Oral chemotherapy" },
      { type: "Drug", name: "Eribulin", description: "IV chemotherapy" }
    ],
    modalities: ["targeted_therapy", "chemotherapy"],
    eligibilityCriteria: `Inclusion Criteria:
- HER2-low (IHC 1+ or 2+/ISH-) MBC
- Prior systemic therapy for metastatic disease
- ECOG 0-1
- Measurable disease or bone-only disease

Exclusion Criteria:
- Prior T-DXd or HER2-targeted ADC
- ILD/pneumonitis history
- Active brain metastases`,
    minAgeYears: 18,
    maxAgeYears: null,
    sex: "FEMALE",
    healthyVolunteers: false,
    enrollmentCount: 480,
    startDate: "2023-09-15",
    primaryCompletionDate: "2026-09-30",
    completionDate: "2028-03-31",
    sponsorName: "Daiichi Sankyo",
    sponsorClass: "INDUSTRY",
    collaborators: ["AstraZeneca"],
    countries: ["United States", "Japan", "France", "Italy", "Spain", "Australia"],
    locations: [
      { facility: "Dana-Farber Cancer Institute", city: "Boston", state: "MA", country: "United States", zip: "02215", latitude: 42.337, longitude: -71.108 },
      { facility: "National Cancer Center Hospital", city: "Tokyo", country: "Japan", latitude: 35.708, longitude: 139.753 },
      { facility: "Institut Gustave Roussy", city: "Villejuif", country: "France", latitude: 48.794, longitude: 2.351 }
    ],
    primaryOutcomes: [{ measure: "Overall Survival", description: "Time from randomization to death", timeFrame: "Until 385 OS events" }],
    secondaryOutcomes: [
      { measure: "Progression-Free Survival", description: "Time from randomization to progression or death", timeFrame: "Until 600 PFS events" },
      { measure: "Objective Response Rate", description: "Complete or partial response per RECIST 1.1", timeFrame: "Every 6 weeks" }
    ],
    centralContacts: [
      { name: "Dr. Patricia Sullivan", role: "Medical Monitor", phone: "617-555-0400", email: "p.sullivan@daiichi.com" }
    ],
    sourceLastUpdated: new Date("2025-04-01"),
    ingestedAt: new Date("2025-04-16"),
    lastClassifiedAt: new Date("2025-04-16"),
    classificationVersion: 1,
    rawData: null
  },
  {
    id: "NCT05567890",
    source: "clinicaltrials_gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05567890",
    crossReferenceIds: [],
    briefTitle: "Oral Targeted Therapy for Colorectal Cancer",
    officialTitle: "Adagrasib Plus Cetuximab in KRAS G12C Mutated Colorectal Cancer",
    briefSummary: "Testing a new pill that targets a specific cancer mutation combined with an antibody for advanced colon or rectal cancer.",
    detailedDescription: "Phase 2 study of adagrasib (oral KRAS G12C inhibitor) combined with cetuximab (anti-EGFR antibody) in patients with KRAS G12C mutated metastatic CRC who have progressed on prior chemotherapy.",
    plainLanguageSummary: "Testing a new targeted pill plus an antibody drug for advanced colorectal cancer with a specific mutation.",
    status: "recruiting",
    phase: "PHASE2",
    studyType: "Interventional",
    conditions: ["Colorectal Cancer", "Colon Cancer", "Rectal Cancer", "KRAS G12C Mutation"],
    cancerTypes: ["colorectal", "colon", "rectal"],
    interventions: [
      { type: "Drug", name: "Adagrasib", description: "KRAS G12C inhibitor" },
      { type: "Biological", name: "Cetuximab", description: "Anti-EGFR monoclonal antibody" }
    ],
    modalities: ["targeted_therapy"],
    eligibilityCriteria: `Inclusion Criteria:
- KRAS G12C mutated mCRC
- Prior progression on fluoropyrimidine, oxaliplatin, irinotecan
- ECOG 0-1
- Measurable disease

Exclusion Criteria:
- Prior KRAS G12C inhibitor
- MSI-H/dMMR (eligible for immunotherapy)
- Uncontrolled hypertension`,
    minAgeYears: 18,
    maxAgeYears: null,
    sex: "ALL",
    healthyVolunteers: false,
    enrollmentCount: 90,
    startDate: "2024-06-01",
    primaryCompletionDate: "2026-12-31",
    completionDate: "2027-12-31",
    sponsorName: "Mirati Therapeutics",
    sponsorClass: "INDUSTRY",
    collaborators: [],
    countries: ["United States", "Canada", "Spain", "Netherlands"],
    locations: [
      { facility: "Memorial Sloan Kettering", city: "New York", state: "NY", country: "United States", zip: "10065", latitude: 40.764, longitude: -73.957 },
      { facility: "MD Anderson Cancer Center", city: "Houston", state: "TX", country: "United States", zip: "77030", latitude: 29.707, longitude: -95.401 }
    ],
    primaryOutcomes: [{ measure: "Objective Response Rate", description: "Confirmed complete or partial response", timeFrame: "Every 8 weeks" }],
    secondaryOutcomes: [
      { measure: "Duration of Response", description: "Time from response to progression", timeFrame: "Until progression" },
      { measure: "Progression-Free Survival", description: "Time from enrollment to progression or death", timeFrame: "Until 75 PFS events" }
    ],
    centralContacts: [
      { name: "Dr. James Nakamura", role: "Medical Director", phone: "858-555-0500", email: "j.nakamura@mirati.com" }
    ],
    sourceLastUpdated: new Date("2025-03-15"),
    ingestedAt: new Date("2025-04-16"),
    lastClassifiedAt: new Date("2025-04-16"),
    classificationVersion: 1,
    rawData: null
  }
];

// Ingestion runs mock data
export const mockIngestionRuns = [
  { id: 1, source: "clinicaltrials_gov", startedAt: new Date("2025-04-16T06:00:00Z"), completedAt: new Date("2025-04-16T06:45:00Z"), status: "succeeded", trialsSeen: 1247, trialsInserted: 23, trialsUpdated: 89, errorMessage: null, metadata: { totalFromSource: 1247, oncologyCount: 1247 } },
  { id: 2, source: "clinicaltrials_gov", startedAt: new Date("2025-04-15T06:00:00Z"), completedAt: new Date("2025-04-15T06:42:00Z"), status: "succeeded", trialsSeen: 1224, trialsInserted: 18, trialsUpdated: 76, errorMessage: null, metadata: { totalFromSource: 1224, oncologyCount: 1224 } }
];

// Helper to simulate query filtering
export function filterMockTrials(filters: {
  status?: string[];
  cancerTypes?: string[];
  modalities?: string[];
  countries?: string[];
  phases?: string[];
  query?: string;
  page?: number;
  pageSize?: number;
}): { trials: Trial[]; total: number } {
  let result = [...mockTrials];
  
  if (filters.status?.length) {
    result = result.filter(t => filters.status?.includes(t.status));
  }
  
  if (filters.cancerTypes?.length) {
    result = result.filter(t => t.cancerTypes?.some(ct => filters.cancerTypes?.includes(ct)));
  }
  
  if (filters.modalities?.length) {
    result = result.filter(t => t.modalities?.some(m => filters.modalities?.includes(m)));
  }
  
  if (filters.countries?.length) {
    result = result.filter(t => t.countries?.some(c => filters.countries?.includes(c)));
  }
  
  if (filters.phases?.length) {
    result = result.filter(t => t.phase && filters.phases?.some(p => t.phase?.toLowerCase().includes(p.toLowerCase())));
  }
  
  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(t => 
      t.briefTitle?.toLowerCase().includes(q) ||
      t.officialTitle?.toLowerCase().includes(q) ||
      t.conditions?.some(c => c.toLowerCase().includes(q)) ||
      t.briefSummary?.toLowerCase().includes(q)
    );
  }
  
  const total = result.length;
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return { trials: result.slice(start, end), total };
}
