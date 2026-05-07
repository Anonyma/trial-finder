import { NextRequest, NextResponse } from "next/server";
import { db, shouldUseMockDb } from "@/lib/db";
import { trials } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    
    // Use mock data if in mock mode
    if (shouldUseMockDb()) {
      const trial = (db as any).queryTrialById?.(decodedId);
      if (!trial) {
        return NextResponse.json({ error: "Trial not found" }, { status: 404 });
      }
      return NextResponse.json(trial);
    }
    
    const [trial] = await db
      .select()
      .from(trials)
      .where(eq(trials.id, decodedId))
      .limit(1);
    if (!trial) {
      return NextResponse.json({ error: "Trial not found" }, { status: 404 });
    }
    return NextResponse.json(trial);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
