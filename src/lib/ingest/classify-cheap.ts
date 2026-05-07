/**
 * CHEAP classification alternatives for testing.
 * 
 * Options:
 * 1. Keyword-based classification (free, 70% accurate)
 * 2. Local LLM via Ollama (free, requires setup)
 * 3. Skip classification entirely (free, no modalities/summaries)
 */

import { MODALITIES } from "@/lib/taxonomy/modalities";

// Simple keyword-based classification - FREE but less accurate
const KEYWORD_MAP: Record<string, string[]> = {
  immunotherapy: ["checkpoint inhibitor", "pembrolizumab", "nivolumab", "atezolizumab", "durvalumab", "avelumab", "ipilimumab", "anti-pd-1", "anti-pd-l1", "anti-ctla-4", "car-t", "cart", "t-cell therapy"],
  chemotherapy: ["chemotherapy", "chemo", "carboplatin", "cisplatin", "oxaliplatin", "paclitaxel", "docetaxel", "gemcitabine", "fluorouracil", "5-fu", "capecitabine", "irinotecan", "etoposide", "doxorubicin"],
  targeted_therapy: ["targeted", "tyrosine kinase", "tki", "egfr inhibitor", "her2", "trastuzumab", "pertuzumab", "osimertinib", "erlotinib", "gefitinib", "imatinib", "vemurafenib", "dabrafenib"],
  radiation: ["radiation", "radiotherapy", "sbrt", "stereotactic", "external beam", "brachytherapy"],
  surgery: ["surgery", "surgical", "resection", "lobectomy", "mastectomy", "colectomy"],
  hormone_therapy: ["hormone", "tamoxifen", "anastrozole", "letrozole", "exemestane", "fulvestrant"],
  stem_cell_transplant: ["stem cell", "bone marrow transplant", "autologous transplant", "allogeneic transplant"],
  cell_therapy: ["car-t", "cart", "t-cell therapy", "tumor infiltrating lymphocytes", "til therapy"],
  mrna_vaccine: ["mrna vaccine", "mrna-", "personalized vaccine"],
  gene_therapy: ["gene therapy", "viral vector", "adeno-associated virus", "aav", "oncolytic virus"],
  antibody_drug_conjugate: ["adc", "antibody-drug conjugate", "deruxtecan", "t-dm1", "trastuzumab emtansine"],
  radioligand_therapy: ["radioligand", "lutetium", "177lu", "psma-targeted"],
};

export interface CheapClassificationResult {
  modalities: string[];
  plainLanguageSummary: string | null;
  method: "keyword" | "none";
}

/**
 * FREE keyword-based classification.
 * ~70% accurate, good enough for testing.
 */
export function classifyTrialCheap(
  briefTitle: string | null,
  briefSummary: string | null,
  interventions: Array<{ type: string; name: string; description?: string }> | null
): CheapClassificationResult {
  const text = [
    briefTitle || "",
    briefSummary || "",
    ...(interventions || []).map(i => `${i.type} ${i.name} ${i.description || ""}`)
  ].join(" ").toLowerCase();

  const modalities: string[] = [];
  
  for (const [modalityId, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      modalities.push(modalityId);
    }
  }

  // If nothing matched, try broader categories
  if (modalities.length === 0) {
    if (text.includes("vaccine")) modalities.push("vaccine");
    if (text.includes("combination")) modalities.push("combination");
  }

  // Deduplicate and limit
  const unique = Array.from(new Set(modalities)).slice(0, 5);
  
  return {
    modalities: unique.length > 0 ? unique : ["other"],
    plainLanguageSummary: null, // Skip summaries entirely
    method: "keyword"
  };
}

/**
 * Batch classify many trials cheaply.
 */
export function classifyBatchCheap(trials: Array<{
  id: string;
  briefTitle: string | null;
  briefSummary: string | null;
  interventions: Array<{ type: string; name: string; description?: string }> | null;
}>): Array<{ id: string; modalities: string[]; plainLanguageSummary: null }> {
  return trials.map(t => ({
    id: t.id,
    ...classifyTrialCheap(t.briefTitle, t.briefSummary, t.interventions)
  }));
}

/**
 * Check if Ollama is available for local LLM classification.
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:11434/api/tags", { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Local LLM classification via Ollama (FREE, requires local setup).
 */
export async function classifyTrialLocal(
  briefTitle: string | null,
  briefSummary: string | null,
  interventions: Array<{ type: string; name: string; description?: string }> | null
): Promise<CheapClassificationResult> {
  const prompt = `Classify this cancer clinical trial. 

Title: ${briefTitle || "N/A"}
Summary: ${briefSummary || "N/A"}
Interventions: ${(interventions || []).map(i => i.name).join(", ") || "N/A"}

Pick modalities from: immunotherapy, chemotherapy, targeted_therapy, radiation, surgery, hormone_therapy, stem_cell_transplant, cell_therapy, mrna_vaccine, gene_therapy, antibody_drug_conjugate, radioligand_therapy, other

Respond with ONLY a JSON object: {"modalities": ["..."], "plainLanguageSummary": "One sentence description"}`;

  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:3b", // or "gemma2:2b" for smaller
        prompt,
        stream: false,
        format: "json"
      })
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    
    const data = await res.json();
    const parsed = JSON.parse(data.response);
    
    return {
      modalities: Array.isArray(parsed.modalities) ? parsed.modalities.slice(0, 5) : ["other"],
      plainLanguageSummary: parsed.plainLanguageSummary || null,
      method: "keyword"
    };
  } catch (err) {
    console.warn("Local LLM failed, falling back to keyword:", err);
    return classifyTrialCheap(briefTitle, briefSummary, interventions);
  }
}
