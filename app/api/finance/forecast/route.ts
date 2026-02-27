import { NextResponse } from "next/server";
import { getForecastSeries, getYearlyForecastSummary } from "@/_lib/finance-analytics";

export async function GET() {
  const series = getForecastSeries();
  const currentYear = new Date().getFullYear();
  const yearly = getYearlyForecastSummary(currentYear);

  return NextResponse.json({
    series,
    yearly,
  });
}

