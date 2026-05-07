/**
 * Cancer type taxonomy.
 *
 * The `id` is what we store in the database (cancer_types[] field).
 * The `label` is what patients see.
 * The `keywords` are used for matching against raw `conditions` from registries —
 * a trial whose condition list contains any of these (case-insensitive substring match)
 * is tagged with this cancer type.
 *
 * Order matters in the keyword matching — more specific terms should appear before
 * general ones (e.g. "small cell lung" before "lung").
 */

export interface CancerType {
  id: string;
  label: string;
  group: CancerGroup;
  keywords: string[];
  description?: string;
}

export type CancerGroup =
  | "thoracic"
  | "gastrointestinal"
  | "genitourinary"
  | "breast_gynecologic"
  | "head_neck"
  | "skin"
  | "neurologic"
  | "sarcoma"
  | "hematologic"
  | "endocrine"
  | "pediatric"
  | "rare_other";

export const CANCER_GROUPS: Record<CancerGroup, string> = {
  thoracic: "Thoracic",
  gastrointestinal: "Gastrointestinal",
  genitourinary: "Genitourinary",
  breast_gynecologic: "Breast & Gynecologic",
  head_neck: "Head & Neck",
  skin: "Skin",
  neurologic: "Brain & Nervous System",
  sarcoma: "Sarcoma",
  hematologic: "Blood Cancers",
  endocrine: "Endocrine",
  pediatric: "Pediatric",
  rare_other: "Rare & Other",
};

export const CANCER_TYPES: CancerType[] = [
  // Thoracic
  {
    id: "nsclc",
    label: "Non-Small Cell Lung Cancer (NSCLC)",
    group: "thoracic",
    keywords: [
      "non-small cell lung",
      "non small cell lung",
      "nsclc",
      "lung adenocarcinoma",
      "lung squamous",
    ],
  },
  {
    id: "sclc",
    label: "Small Cell Lung Cancer (SCLC)",
    group: "thoracic",
    keywords: ["small cell lung", "sclc"],
  },
  {
    id: "mesothelioma",
    label: "Mesothelioma",
    group: "thoracic",
    keywords: ["mesothelioma"],
  },
  {
    id: "thymoma",
    label: "Thymoma & Thymic Carcinoma",
    group: "thoracic",
    keywords: ["thymoma", "thymic carcinoma"],
  },

  // Gastrointestinal
  {
    id: "colorectal",
    label: "Colorectal Cancer",
    group: "gastrointestinal",
    keywords: ["colorectal", "colon cancer", "rectal cancer"],
  },
  {
    id: "pancreatic",
    label: "Pancreatic Cancer",
    group: "gastrointestinal",
    keywords: ["pancreatic", "pancreas cancer", "pdac"],
  },
  {
    id: "hcc",
    label: "Liver Cancer (HCC)",
    group: "gastrointestinal",
    keywords: [
      "hepatocellular",
      "hcc",
      "liver cancer",
      "intrahepatic cholangiocarcinoma",
    ],
  },
  {
    id: "biliary",
    label: "Biliary Tract & Gallbladder Cancer",
    group: "gastrointestinal",
    keywords: ["cholangiocarcinoma", "biliary", "gallbladder"],
  },
  {
    id: "gastric",
    label: "Gastric (Stomach) Cancer",
    group: "gastrointestinal",
    keywords: ["gastric", "stomach cancer", "gastroesophageal"],
  },
  {
    id: "esophageal",
    label: "Esophageal Cancer",
    group: "gastrointestinal",
    keywords: ["esophageal", "esophagus", "oesophageal", "oesophagus"],
  },
  {
    id: "anal",
    label: "Anal Cancer",
    group: "gastrointestinal",
    keywords: ["anal cancer", "anus carcinoma"],
  },
  {
    id: "neuroendocrine_gi",
    label: "GI Neuroendocrine Tumors",
    group: "gastrointestinal",
    keywords: ["neuroendocrine", "carcinoid", "net "],
  },

  // Genitourinary
  {
    id: "prostate",
    label: "Prostate Cancer",
    group: "genitourinary",
    keywords: ["prostate", "prostatic"],
  },
  {
    id: "bladder",
    label: "Bladder Cancer",
    group: "genitourinary",
    keywords: ["bladder", "urothelial"],
  },
  {
    id: "rcc",
    label: "Kidney Cancer (RCC)",
    group: "genitourinary",
    keywords: ["renal cell", "rcc", "kidney cancer"],
  },
  {
    id: "testicular",
    label: "Testicular Cancer",
    group: "genitourinary",
    keywords: ["testicular", "germ cell tumor"],
  },

  // Breast & Gynecologic
  {
    id: "breast",
    label: "Breast Cancer",
    group: "breast_gynecologic",
    keywords: ["breast cancer", "breast carcinoma", "her2", "tnbc"],
  },
  {
    id: "ovarian",
    label: "Ovarian Cancer",
    group: "breast_gynecologic",
    keywords: ["ovarian", "fallopian tube", "primary peritoneal"],
  },
  {
    id: "cervical",
    label: "Cervical Cancer",
    group: "breast_gynecologic",
    keywords: ["cervical cancer", "cervix"],
  },
  {
    id: "endometrial",
    label: "Endometrial / Uterine Cancer",
    group: "breast_gynecologic",
    keywords: ["endometrial", "uterine"],
  },
  {
    id: "vulvar_vaginal",
    label: "Vulvar & Vaginal Cancer",
    group: "breast_gynecologic",
    keywords: ["vulvar", "vaginal cancer"],
  },

  // Head & Neck
  {
    id: "head_neck_scc",
    label: "Head and Neck Squamous Cell Carcinoma",
    group: "head_neck",
    keywords: [
      "head and neck",
      "hnscc",
      "oral cavity",
      "oropharyngeal",
      "laryngeal",
      "hypopharyngeal",
      "nasopharyngeal",
    ],
  },
  {
    id: "salivary",
    label: "Salivary Gland Cancer",
    group: "head_neck",
    keywords: ["salivary gland", "adenoid cystic"],
  },

  // Skin
  {
    id: "melanoma",
    label: "Melanoma",
    group: "skin",
    keywords: ["melanoma"],
  },
  {
    id: "merkel",
    label: "Merkel Cell Carcinoma",
    group: "skin",
    keywords: ["merkel cell"],
  },
  {
    id: "skin_other",
    label: "Other Skin Cancers (BCC, SCC)",
    group: "skin",
    keywords: ["basal cell carcinoma", "cutaneous squamous"],
  },

  // Neurologic
  {
    id: "glioblastoma",
    label: "Glioblastoma (GBM)",
    group: "neurologic",
    keywords: ["glioblastoma", "gbm"],
  },
  {
    id: "glioma_other",
    label: "Other Gliomas",
    group: "neurologic",
    keywords: ["glioma", "astrocytoma", "oligodendroglioma"],
  },
  {
    id: "meningioma",
    label: "Meningioma",
    group: "neurologic",
    keywords: ["meningioma"],
  },
  {
    id: "brain_mets",
    label: "Brain Metastases",
    group: "neurologic",
    keywords: ["brain metasta", "leptomeningeal"],
  },

  // Sarcoma
  {
    id: "soft_tissue_sarcoma",
    label: "Soft Tissue Sarcoma",
    group: "sarcoma",
    keywords: [
      "soft tissue sarcoma",
      "leiomyosarcoma",
      "liposarcoma",
      "synovial sarcoma",
      "angiosarcoma",
    ],
  },
  {
    id: "bone_sarcoma",
    label: "Bone Sarcoma (Osteosarcoma, Ewing)",
    group: "sarcoma",
    keywords: ["osteosarcoma", "ewing sarcoma", "chondrosarcoma"],
  },
  {
    id: "gist",
    label: "Gastrointestinal Stromal Tumor (GIST)",
    group: "sarcoma",
    keywords: ["gist", "gastrointestinal stromal"],
  },

  // Hematologic
  {
    id: "aml",
    label: "Acute Myeloid Leukemia (AML)",
    group: "hematologic",
    keywords: ["acute myeloid", "aml"],
  },
  {
    id: "all",
    label: "Acute Lymphoblastic Leukemia (ALL)",
    group: "hematologic",
    keywords: ["acute lymphoblastic", "acute lymphocytic", "all "],
  },
  {
    id: "cml",
    label: "Chronic Myeloid Leukemia (CML)",
    group: "hematologic",
    keywords: ["chronic myeloid", "cml"],
  },
  {
    id: "cll",
    label: "Chronic Lymphocytic Leukemia (CLL)",
    group: "hematologic",
    keywords: ["chronic lymphocytic", "cll", "small lymphocytic"],
  },
  {
    id: "mds",
    label: "Myelodysplastic Syndromes (MDS)",
    group: "hematologic",
    keywords: ["myelodysplastic", "mds"],
  },
  {
    id: "myeloma",
    label: "Multiple Myeloma",
    group: "hematologic",
    keywords: ["multiple myeloma", "plasma cell myeloma"],
  },
  {
    id: "hodgkin",
    label: "Hodgkin Lymphoma",
    group: "hematologic",
    keywords: ["hodgkin"],
  },
  {
    id: "nhl",
    label: "Non-Hodgkin Lymphoma",
    group: "hematologic",
    keywords: [
      "non-hodgkin",
      "diffuse large b-cell",
      "dlbcl",
      "follicular lymphoma",
      "mantle cell",
      "burkitt",
      "marginal zone",
      "t-cell lymphoma",
    ],
  },

  // Endocrine
  {
    id: "thyroid",
    label: "Thyroid Cancer",
    group: "endocrine",
    keywords: [
      "thyroid cancer",
      "papillary thyroid",
      "follicular thyroid",
      "medullary thyroid",
      "anaplastic thyroid",
    ],
  },
  {
    id: "adrenal",
    label: "Adrenal Cancer",
    group: "endocrine",
    keywords: ["adrenocortical", "adrenal carcinoma", "pheochromocytoma"],
  },

  // Pediatric
  {
    id: "pediatric_solid",
    label: "Pediatric Solid Tumors",
    group: "pediatric",
    keywords: [
      "neuroblastoma",
      "wilms tumor",
      "rhabdomyosarcoma",
      "retinoblastoma",
      "hepatoblastoma",
    ],
  },
  {
    id: "pediatric_brain",
    label: "Pediatric Brain Tumors",
    group: "pediatric",
    keywords: ["medulloblastoma", "dipg", "ependymoma", "atrt"],
  },

  // Rare / Other
  {
    id: "solid_tumor_general",
    label: "Solid Tumors (General / Multiple Types)",
    group: "rare_other",
    keywords: [
      "advanced solid tumor",
      "advanced solid tumour",
      "metastatic solid tumor",
      "metastatic solid tumour",
      "solid malignancy",
    ],
  },
  {
    id: "unknown_primary",
    label: "Cancer of Unknown Primary",
    group: "rare_other",
    keywords: ["unknown primary", "cup "],
  },
  {
    id: "rare_other",
    label: "Other Rare Cancers",
    group: "rare_other",
    keywords: [],
  },
];

const ID_BY_KEY = new Map<string, CancerType>(
  CANCER_TYPES.map((ct) => [ct.id, ct])
);

export function getCancerType(id: string): CancerType | undefined {
  return ID_BY_KEY.get(id);
}

/**
 * Tag a trial with cancer types based on its raw `conditions` array.
 * Returns a sorted, deduplicated list of cancer type IDs.
 */
export function classifyCancerTypes(conditions: string[]): string[] {
  if (!conditions || conditions.length === 0) return [];
  const haystack = conditions.join(" | ").toLowerCase();
  const matched = new Set<string>();
  for (const ct of CANCER_TYPES) {
    for (const kw of ct.keywords) {
      if (haystack.includes(kw.toLowerCase())) {
        matched.add(ct.id);
        break;
      }
    }
  }
  return Array.from(matched).sort();
}

/**
 * Test whether a trial's conditions look cancer-related at all.
 * Used during ingestion to filter out non-oncology trials we don't care about.
 */
const ONCOLOGY_BROAD_TERMS = [
  "cancer",
  "carcinoma",
  "tumor",
  "tumour",
  "neoplasm",
  "malignan",
  "leukemia",
  "leukaemia",
  "lymphoma",
  "myeloma",
  "sarcoma",
  "melanoma",
  "glioma",
  "glioblastoma",
  "metastatic",
  "metastas",
  "oncol",
  "adenocarcinoma",
];

export function isOncologyTrial(conditions: string[]): boolean {
  if (!conditions || conditions.length === 0) return false;
  const haystack = conditions.join(" | ").toLowerCase();
  return ONCOLOGY_BROAD_TERMS.some((t) => haystack.includes(t));
}
