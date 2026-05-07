import { NextRequest, NextResponse } from "next/server";
import { searchTrials, parseSearchParams } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp: Record<string, string> = {};
    req.nextUrl.searchParams.forEach((value, key) => {
      sp[key] = value;
    });
    const params = parseSearchParams(sp);
    const result = await searchTrials(params);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
