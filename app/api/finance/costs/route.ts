import { NextResponse } from "next/server";
import { getCostEntries } from "@/_lib/finance-analytics";

export async function GET() {
  const costs = getCostEntries();
  return NextResponse.json({ costs });
}

