import { NextResponse } from "next/server";
import { getCostEntries } from "@/_lib/finance-analytics";

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

export const dynamic = "force-dynamic";

export async function GET() {
  const costs = getCostEntries();
  return NextResponse.json({ costs }, { headers: noCacheHeaders });
}

