/**
 * Unified classification that works with any AI provider.
 * 
 * Providers supported:
 * - QuadMax (unlimited Claude - RECOMMENDED)
 * - OpenAI (GPT-4o-mini - cheap)
 * - Gemini (Flash - cheapest)
 * - Anthropic (original per-call)
 * - Ollama (local - free)
 */

import {
  MODALITIES,
  VALID_MODALITY_IDS,
} from "@/lib/taxonomy/modalities";
import {
  chatCompletion,
  isUnlimitedProvider,
  logUsage,
  type ChatMessage,
} from "@/lib/ai/providers";

const CURRENT_CLASSIFICATION_VERSION = 2;
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
  cost?: number;
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
  - Add "combination" only if the trial explicitly tests a combination as the novel approach.
  - If the trial is a vaccine for cancer, pick the specific vaccine type AND any other modality it's combined with.
  - If unsure, use "other".
  - Return at minimum 1, at most 5 modality IDs.

2. PLAIN_LANGUAGE_SUMMARY: One paragraph (3–5 sentences) for cancer patients and families. Explain:
  - What's being tested (drug name + mechanism in plain words)
  - Who it's for (cancer type, prior treatment context)
  - The trial's basic structure

Style: Plain English. Define acronyms once. Avoid jargon.

Return ONLY a valid JSON object: {"modalities": ["..."], "plainLanguageSummary": "..."}`;

export async function classifyTrialUnified(
  input: ClassificationInput
): Promise<ClassificationOutput> {
  const userContent = formatTrialForClassification(input);

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];

  const result = await chatCompletion({
    messages,
    temperature: 0.3,
    maxTokens: 600,
    responseFormat: "json",
  });

  logUsage(result, "classify");

  const cleaned = result.content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Classifier returned non-JSON: ${result.content.slice(0, 200)}`);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("modalities" in parsed) ||
    !("plainLanguageSummary" in parsed)
  ) {
    throw new Error(`Missing keys: ${JSON.stringify(parsed)}`);
  }

  const out = parsed as { modalities: unknown; plainLanguageSummary: unknown };
  if (!Array.isArray(out.modalities)) {
    throw new Error("modalities is not an array");
  }

  // Filter to known IDs only
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

/**
 * Get recommended model for classification based on provider.
 */
export function getClassificationModel(): string {
  if (isUnlimitedProvider()) {
    return "claude-haiku-4-5-20251001"; // Use Haiku for speed, unlimited anyway
  }
  
  const provider = process.env.AI_PROVIDER || "anthropic";
  
  const models: Record<string, string> = {
    quadmax: "claude-haiku-4-5-20251001",
    openai: "gpt-4o-mini",
    gemini: "gemini-1.5-flash",
    anthropic: "claude-haiku-4-5-20251001",
    ollama: "llama3.2:3b",
  };
  
  return models[provider] || "claude-haiku-4-5-20251001";
}
