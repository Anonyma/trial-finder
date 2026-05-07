/**
 * LLM-based modality classification and plain-language summarization.
 *
 * Why LLM and not regex: trial intervention descriptions vary wildly across registries.
 * "AdV-tk + valacyclovir + radiation" needs to be classified as "Gene Therapy" + "Radiation"
 * + "Combination" — no keyword set captures this reliably. We use Haiku (cheap, fast) with
 * a tightly constrained output format.
 *
 * Cost target: ~$0.0002 per trial on Haiku 4.5. At 80k oncology trials, ~$15 for full backfill.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  MODALITIES,
  VALID_MODALITY_IDS,
} from "@/lib/taxonomy/modalities";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL =
  process.env.CLASSIFICATION_MODEL || "claude-haiku-4-5-20251001";

const CURRENT_CLASSIFICATION_VERSION = 1;
export { CURRENT_CLASSIFICATION_VERSION };

interface ClassificationInput {
  briefTitle: string | null;
  briefSummary: string | null;
  interventions: Array<{ type: string; name: string; description?: string }> | null;
  conditions: string[];
}

export interface ClassificationOutput {
  modalities: string[];
  plainLanguageSummary: string;
}

const MODALITY_LIST = MODALITIES.map(
  (m) => `  - ${m.id}: ${m.label} — ${m.description}`
).join("\n");

const SYSTEM_PROMPT = `You are classifying clinical trial interventions for a patient-facing oncology trial finder.

Two tasks per trial:

1. MODALITIES: Pick all that apply from this exact list of IDs (use the IDs exactly):
${MODALITY_LIST}

Rules for modalities:
  - Pick every modality the trial uses. A trial combining checkpoint inhibitor + chemo + radiation gets all three.
  - Add "combination" only if the trial explicitly tests a combination as the novel approach (not just a backbone).
  - If the trial is a vaccine for cancer, pick the specific vaccine type (mrna_vaccine, peptide_vaccine, etc.) AND any other modality it's combined with.
  - If you're unsure or the trial is observational/diagnostic only, use "diagnostic" or "other".
  - Return at minimum 1, at most 5 modality IDs.

2. PLAIN_LANGUAGE_SUMMARY: One paragraph (3–5 sentences) for cancer patients and their families. Explain:
  - What's being tested (drug name + mechanism in plain words, not jargon)
  - Who it's for (cancer type, prior treatment context if relevant)
  - The trial's basic structure if non-obvious

Style for the summary:
  - Plain English. Define every acronym once. Avoid words like "modality", "agent", "subject" (use "drug", "person", "patient").
  - Don't invent claims. Only summarize what's in the input.
  - Don't editorialize about effectiveness or safety.
  - Don't include a disclaimer — the UI handles that.

Return ONLY a valid JSON object with exactly two keys: "modalities" (array of strings) and "plainLanguageSummary" (string). No prose, no markdown, no code fences.`;

export async function classifyTrial(
  input: ClassificationInput
): Promise<ClassificationOutput> {
  const userContent = formatTrialForClassification(input);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Strip any accidental code fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Classifier returned non-JSON output: ${text.slice(0, 200)}`);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("modalities" in parsed) ||
    !("plainLanguageSummary" in parsed)
  ) {
    throw new Error(`Classifier output missing required keys: ${JSON.stringify(parsed)}`);
  }

  const out = parsed as { modalities: unknown; plainLanguageSummary: unknown };
  if (!Array.isArray(out.modalities)) {
    throw new Error("modalities is not an array");
  }
  // Filter to known IDs only — model occasionally hallucinates. Default to "other" if empty.
  const validModalities = out.modalities.filter(
    (m): m is string => typeof m === "string" && VALID_MODALITY_IDS.includes(m)
  );
  if (validModalities.length === 0) validModalities.push("other");

  return {
    modalities: Array.from(new Set(validModalities)),
    plainLanguageSummary:
      typeof out.plainLanguageSummary === "string"
        ? out.plainLanguageSummary.trim()
        : "",
  };
}

function formatTrialForClassification(input: ClassificationInput): string {
  const lines: string[] = [];
  lines.push(`Title: ${input.briefTitle ?? "(none)"}`);
  lines.push(`Conditions: ${(input.conditions ?? []).join(", ") || "(none)"}`);

  if (input.interventions && input.interventions.length > 0) {
    lines.push("Interventions:");
    for (const iv of input.interventions) {
      lines.push(
        `  - [${iv.type}] ${iv.name}${
          iv.description ? `: ${truncate(iv.description, 400)}` : ""
        }`
      );
    }
  } else {
    lines.push("Interventions: (none listed)");
  }

  if (input.briefSummary) {
    lines.push(`Summary: ${truncate(input.briefSummary, 1500)}`);
  }
  return lines.join("\n");
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
