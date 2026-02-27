import { NextResponse } from "next/server";
import { getForecastSeries, getYearlyForecastSummary } from "@/_lib/finance-analytics";

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

export const dynamic = "force-dynamic";

export async function GET() {
  const series = getForecastSeries();
  const currentYear = new Date().getFullYear();
  const yearly = getYearlyForecastSummary(currentYear);

  return NextResponse.json(
    {
      series,
      yearly,
    },
    { headers: noCacheHeaders }
  );
}

