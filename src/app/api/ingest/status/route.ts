import { NextResponse } from "next/server";
import { db, shouldUseMockDb } from "@/lib/db";
import { ingestionRuns, trials } from "@/lib/db/schema";
import { sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (shouldUseMockDb()) {
      const mockDb = db as any;
      const runs = mockDb.queryIngestionRuns?.() || [];
      const mockTrials = mockDb.queryTrials?.({}) || { trials: [], total: 0 };

      return NextResponse.json({
        totalTrials: mockTrials.total || 5,
        classifiedTrials: mockTrials.total || 5,
        pendingClassification: 0,
        recentRuns: runs,
        mockMode: true,
      });
    }

    const runs = await db
      .select()
      .from(ingestionRuns)
      .orderBy(desc(ingestionRuns.startedAt))
      .limit(20);

    const [{ totalTrials, classifiedTrials }] = await db
      .select({
        totalTrials: sql<number>`count(*)::int`,
        classifiedTrials: sql<number>`count(*) FILTER (WHERE ${trials.lastClassifiedAt} IS NOT NULL)::int`,
      })
      .from(trials);

    return NextResponse.json({
      totalTrials,
      classifiedTrials,
      pendingClassification: totalTrials - classifiedTrials,
      recentRuns: runs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
