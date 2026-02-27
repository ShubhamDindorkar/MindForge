import { NextResponse } from "next/server";
import {
  getFinancialSummaries,
  getAggregatedPnL,
  getCategoryRevenueBreakdown,
} from "@/_lib/finance-analytics";

export async function GET() {
  const financialSummaries = getFinancialSummaries();
  const aggregates = getAggregatedPnL();
  const categoryRevenue = getCategoryRevenueBreakdown();

  return NextResponse.json({
    financialSummaries,
    aggregates,
    categoryRevenue,
  });
}

