import { NextResponse } from "next/server";
import { getInventoryItems, getTransactions } from "@/_lib/finance-analytics";
import { generateAiLikeRecommendations } from "@/_lib/ai-finance";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const horizonParam = url.searchParams.get("horizon");
  const horizonDays =
    horizonParam === "60" ? 60 : horizonParam === "90" ? 90 : 30;

  const items = getInventoryItems();
  const txns = getTransactions();
  const recommendations = generateAiLikeRecommendations({
    items,
    transactions: txns,
    horizonDays: horizonDays as 30 | 60 | 90,
  });

  return NextResponse.json({
    horizonDays,
    recommendations,
  });
}

