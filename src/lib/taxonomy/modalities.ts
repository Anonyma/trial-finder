/**
 * Treatment modality taxonomy.
 *
 * Modalities are used as a filter and surfaced on trial cards. Each modality has
 * a short patient-friendly description that we display on hover/in detail pages.
 *
 * Classification happens via Claude in scripts/ingest/classify.ts — we don't try
 * to auto-classify from interventions because the variation in how interventions
 * are written across registries is too high.
 */

export interface Modality {
  id: string;
  label: string;
  shortLabel: string; // for compact UI
  group: ModalityGroup;
  description: string; // shown to patients
  // Optional keywords for fast pre-filtering before Claude classification
  keywords?: string[];
}

export type ModalityGroup =
  | "immunotherapy"
  | "cell_gene"
  | "vaccines"
  | "targeted"
  | "radiotherapy"
  | "conventional"
  | "other";

export const MODALITY_GROUPS: Record<ModalityGroup, string> = {
  immunotherapy: "Immunotherapy",
  cell_gene: "Cell & Gene Therapy",
  vaccines: "Cancer Vaccines",
  targeted: "Targeted Therapy",
  radiotherapy: "Radiotherapy",
  conventional: "Conventional",
  other: "Other",
};

export const MODALITIES: Modality[] = [
  // Immunotherapy
  {
    id: "checkpoint_inhibitor",
    label: "Checkpoint Inhibitor",
    shortLabel: "Checkpoint",
    group: "immunotherapy",
    description:
      "Antibodies that release the brakes on the immune system, such as PD-1, PD-L1, or CTLA-4 inhibitors. Examples: pembrolizumab, nivolumab, atezolizumab.",
    keywords: ["pembrolizumab", "nivolumab", "atezolizumab", "pd-1", "pd-l1", "ctla-4", "ipilimumab", "durvalumab"],
  },
  {
    id: "bispecific_antibody",
    label: "Bispecific Antibody / T-Cell Engager",
    shortLabel: "Bispecific",
    group: "immunotherapy",
    description:
      "Engineered antibodies that grab both a cancer cell and an immune cell at once, forcing the immune system to attack. Includes BiTEs (bispecific T-cell engagers).",
    keywords: ["bispecific", "bite", "t-cell engager", "tce", "trispecific"],
  },
  {
    id: "monoclonal_antibody",
    label: "Monoclonal Antibody",
    shortLabel: "Antibody",
    group: "immunotherapy",
    description:
      "Lab-made antibodies that bind to a specific target on cancer cells, often to block growth signals or flag the cell for immune attack.",
    keywords: ["monoclonal antibody", "mab"],
  },
  {
    id: "adc",
    label: "Antibody-Drug Conjugate (ADC)",
    shortLabel: "ADC",
    group: "immunotherapy",
    description:
      "An antibody linked to a chemotherapy payload that delivers the drug specifically to cancer cells, sparing healthy tissue.",
    keywords: ["antibody-drug conjugate", "adc", "trastuzumab deruxtecan", "enhertu"],
  },
  {
    id: "cytokine",
    label: "Cytokine Therapy",
    shortLabel: "Cytokine",
    group: "immunotherapy",
    description:
      "Immune-signaling proteins (like IL-2, interferon, IL-15) used to boost immune response against the cancer.",
    keywords: ["interleukin", "interferon", "cytokine"],
  },

  // Cell & Gene
  {
    id: "car_t",
    label: "CAR-T Cell Therapy",
    shortLabel: "CAR-T",
    group: "cell_gene",
    description:
      "A patient's own T cells are engineered to recognize and kill cancer cells, then infused back. Established in blood cancers, expanding into solid tumors.",
    keywords: ["car-t", "car t", "chimeric antigen receptor"],
  },
  {
    id: "tcr_t",
    label: "TCR-T Cell Therapy",
    shortLabel: "TCR-T",
    group: "cell_gene",
    description:
      "Engineered T-cell receptor therapy that recognizes cancer-specific peptides displayed on tumor cells, including intracellular targets.",
    keywords: ["tcr-t", "t-cell receptor therapy", "afami-cel"],
  },
  {
    id: "til",
    label: "TIL Therapy",
    shortLabel: "TIL",
    group: "cell_gene",
    description:
      "Tumor-infiltrating lymphocytes — immune cells extracted from the patient's tumor, expanded in the lab, and reinfused.",
    keywords: ["tumor-infiltrating lymphocyte", "til ", "lifileucel"],
  },
  {
    id: "nk_cell",
    label: "NK Cell Therapy",
    shortLabel: "NK Cell",
    group: "cell_gene",
    description:
      "Natural killer cells, sometimes engineered with CARs, used to attack tumors. Often allogeneic (from a donor), so available off-the-shelf.",
    keywords: ["natural killer", "nk cell", "car-nk"],
  },
  {
    id: "gene_therapy",
    label: "Gene Therapy",
    shortLabel: "Gene Tx",
    group: "cell_gene",
    description:
      "Direct introduction of genetic material to alter cancer cells or modify the body's response to them.",
    keywords: ["gene therapy", "aav", "lentiviral"],
  },

  // Vaccines
  {
    id: "mrna_vaccine",
    label: "mRNA Cancer Vaccine",
    shortLabel: "mRNA Vaccine",
    group: "vaccines",
    description:
      "Vaccines using mRNA (often delivered in lipid nanoparticles) to teach the immune system to recognize tumor-specific proteins. Often personalized to the patient's mutations.",
    keywords: ["mrna", "mrna-lnp", "neoantigen vaccine", "personalized cancer vaccine", "intismeran"],
  },
  {
    id: "peptide_vaccine",
    label: "Peptide Vaccine",
    shortLabel: "Peptide Vax",
    group: "vaccines",
    description:
      "Tumor-derived peptide fragments injected (often with adjuvants) to prime the immune system against cancer-specific targets.",
    keywords: ["peptide vaccine"],
  },
  {
    id: "dc_vaccine",
    label: "Dendritic Cell Vaccine",
    shortLabel: "DC Vaccine",
    group: "vaccines",
    description:
      "The patient's dendritic cells are loaded with tumor antigens in the lab and reinfused to trigger an immune response.",
    keywords: ["dendritic cell vaccine", "sipuleucel"],
  },
  {
    id: "viral_vector_vaccine",
    label: "Viral Vector Vaccine",
    shortLabel: "Viral Vax",
    group: "vaccines",
    description:
      "Modified viruses used to deliver tumor-antigen genes to immune cells, prompting a strong immune response.",
    keywords: ["adenoviral vaccine", "vaccinia", "poxvirus vaccine"],
  },
  {
    id: "oncolytic_virus",
    label: "Oncolytic Virus",
    shortLabel: "Oncolytic",
    group: "vaccines",
    description:
      "Engineered viruses that selectively replicate in and kill cancer cells while sparking an immune response. Talimogene laherparepvec (T-VEC) was the first approved.",
    keywords: ["oncolytic virus", "talimogene", "t-vec", "herpes simplex virus"],
  },

  // Targeted
  {
    id: "small_molecule_targeted",
    label: "Targeted Small Molecule",
    shortLabel: "Targeted SM",
    group: "targeted",
    description:
      "Pills or infusions targeting specific molecular drivers of cancer (kinase inhibitors, PARP inhibitors, RAS/RAF/MEK inhibitors, etc.).",
    keywords: [
      "kinase inhibitor",
      "tyrosine kinase",
      "tki",
      "parp inhibitor",
      "kras",
      "egfr inhibitor",
      "alk inhibitor",
      "braf inhibitor",
      "mek inhibitor",
      "fgfr inhibitor",
    ],
  },
  {
    id: "protac",
    label: "PROTAC / Molecular Glue",
    shortLabel: "PROTAC",
    group: "targeted",
    description:
      "Drugs that recruit the cell's own protein-disposal machinery to destroy specific cancer-driving proteins.",
    keywords: ["protac", "molecular glue", "protein degrader"],
  },
  {
    id: "hormonal",
    label: "Hormonal Therapy",
    shortLabel: "Hormonal",
    group: "targeted",
    description:
      "Drugs that block hormones (estrogen, androgen) that fuel certain cancers, typically breast and prostate.",
    keywords: ["aromatase inhibitor", "tamoxifen", "androgen receptor", "anti-androgen", "fulvestrant", "abiraterone", "enzalutamide"],
  },

  // Radiotherapy
  {
    id: "radioligand",
    label: "Radioligand / Radiopharmaceutical",
    shortLabel: "Radioligand",
    group: "radiotherapy",
    description:
      "A targeting molecule attached to a radioactive isotope that delivers radiation directly to cancer cells. Examples: Pluvicto (177Lu-PSMA), Lutathera.",
    keywords: ["radioligand", "psma-617", "lutetium", "177lu", "actinium-225", "radiopharmaceutical", "theranostic"],
  },
  {
    id: "external_beam",
    label: "External Beam Radiation",
    shortLabel: "Radiation",
    group: "radiotherapy",
    description:
      "Targeted radiation from outside the body, including SBRT, IMRT, proton therapy.",
    keywords: ["sbrt", "imrt", "proton therapy", "radiotherapy", "radiation therapy"],
  },
  {
    id: "brachytherapy",
    label: "Brachytherapy",
    shortLabel: "Brachy",
    group: "radiotherapy",
    description:
      "Radiation delivered by small radioactive sources placed inside or next to the tumor.",
    keywords: ["brachytherapy"],
  },

  // Conventional
  {
    id: "chemotherapy",
    label: "Chemotherapy",
    shortLabel: "Chemo",
    group: "conventional",
    description:
      "Cytotoxic drugs that kill rapidly-dividing cells. Often used in combination with newer therapies in trials.",
    keywords: ["chemotherapy", "cytotoxic"],
  },
  {
    id: "surgery",
    label: "Surgery",
    shortLabel: "Surgery",
    group: "conventional",
    description: "Surgical procedures, often combined with other treatments in a trial protocol.",
    keywords: ["surgical resection", "surgery"],
  },
  {
    id: "stem_cell_transplant",
    label: "Stem Cell Transplant",
    shortLabel: "SCT",
    group: "conventional",
    description:
      "Replacing the patient's blood-forming cells, typically after high-dose chemotherapy. Common in blood cancers.",
    keywords: ["stem cell transplant", "bone marrow transplant", "hsct", "allogeneic transplant", "autologous transplant"],
  },

  // Other
  {
    id: "combination",
    label: "Combination Therapy",
    shortLabel: "Combo",
    group: "other",
    description: "Trials combining multiple modalities — often a new agent paired with an existing standard of care.",
    keywords: [],
  },
  {
    id: "device",
    label: "Medical Device",
    shortLabel: "Device",
    group: "other",
    description: "Trials evaluating devices such as TTFields (electric fields), focused ultrasound, or implantable systems.",
    keywords: ["ttfields", "tumor treating fields", "focused ultrasound", "device"],
  },
  {
    id: "diagnostic",
    label: "Diagnostic / Biomarker",
    shortLabel: "Diagnostic",
    group: "other",
    description: "Trials evaluating new ways to detect, monitor, or characterize cancer — including liquid biopsy and imaging.",
    keywords: ["circulating tumor dna", "ctdna", "liquid biopsy", "diagnostic", "biomarker"],
  },
  {
    id: "other",
    label: "Other / Unclassified",
    shortLabel: "Other",
    group: "other",
    description: "Approaches that don't fit cleanly into the above categories.",
    keywords: [],
  },
];

const MODALITY_BY_ID = new Map<string, Modality>(
  MODALITIES.map((m) => [m.id, m])
);

export function getModality(id: string): Modality | undefined {
  return MODALITY_BY_ID.get(id);
}

export const VALID_MODALITY_IDS = MODALITIES.map((m) => m.id);
