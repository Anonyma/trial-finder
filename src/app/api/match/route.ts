import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findMatches, type UserProfile } from "@/lib/ingest/matching";
import { findMatchesCheap, findMatchesDummy } from "@/lib/ingest/matching-cheap";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const profileSchema = z.object({
  cancerTypeIds: z.array(z.string()).min(1, "Pick at least one cancer type"),
  stage: z.enum([
    "early",
    "locally_advanced",
    "metastatic",
    "recurrent",
    "unknown",
  ]),
  priorTreatments: z.array(z.string()).default([]),
  biomarkers: z.string().default(""),
  ageYears: z.number().int().min(0).max(120),
  sex: z.enum(["MALE", "FEMALE", "OTHER"]),
  countries: z.array(z.string()).default([]),
  willingToTravelInternational: z.boolean().default(false),
  additionalContext: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const profile: UserProfile = parsed.data;

    // Determine which matching method to use
    const useCheap = process.env.USE_CHEAP_MATCHING === "true";
    const useDummy = process.env.USE_DUMMY_MATCHING === "true";

    let matches;
    let method = "llm";

    if (useDummy) {
      console.log("[match] Using DUMMY matching (UI testing only)");
      matches = await findMatchesDummy(profile);
      method = "dummy";
    } else if (useCheap) {
      console.log("[match] Using CHEAP rule-based matching (no LLM cost)");
      matches = await findMatchesCheap(profile);
      method = "rule-based";
    } else {
      // Default: LLM matching (Claude Sonnet ~$0.10/match)
      console.log("[match] Using LLM matching (Claude Sonnet)");
      matches = await findMatches(profile);
    }

    return NextResponse.json({ 
      matches,
      meta: {
        method,
        cost: method === "llm" ? "~$0.10" : "$0.00"
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/match] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
