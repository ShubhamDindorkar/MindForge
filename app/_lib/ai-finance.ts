import { InventoryItem, Transaction, AiRecommendation } from "./types";
import { formatCurrencyDetailed } from "./utils";

interface RecommendationInput {
  items: InventoryItem[];
  transactions: Transaction[];
  horizonDays: 30 | 60 | 90;
  today?: Date;
}

export function generateAiLikeRecommendations(
  input: RecommendationInput
): AiRecommendation[] {
  const { items, transactions, horizonDays } = input;
  const today = input.today ?? new Date();
  const currentMonth = today.getMonth(); // 0-based

  const horizonLabel: "30d" | "60d" | "90d" =
    horizonDays === 30 ? "30d" : horizonDays === 60 ? "60d" : "90d";

  const windowDays = 60;
  const windowStart = new Date(today.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const perItemDemand = new Map<string, number>();
  transactions.forEach((txn) => {
    if (txn.type !== "out") return;
    const date = new Date(txn.date);
    if (date < windowStart || date > today) return;
    perItemDemand.set(txn.itemId, (perItemDemand.get(txn.itemId) ?? 0) + txn.quantity);
  });

  return items.map<AiRecommendation>((item, index) => {
    const recentOut = perItemDemand.get(item.id) ?? 0;
    const avgDailyDemand = recentOut / windowDays || 0;
    const baseDemandForHorizon = avgDailyDemand * horizonDays;

    let seasonalMultiplier = 1;
    const isDecember = currentMonth === 11;
    const isQ4 = currentMonth >= 9;

    if (isDecember) {
      if (["Electronics", "Packaging", "Safety Gear"].includes(item.category)) {
        seasonalMultiplier = 1.6;
      } else {
        seasonalMultiplier = 1.3;
      }
    } else if (isQ4) {
      seasonalMultiplier = 1.2;
    }

    const projectedDemand = baseDemandForHorizon * seasonalMultiplier;

    let recommendedStock = Math.ceil(projectedDemand * 1.2);
    if (!Number.isFinite(recommendedStock) || recommendedStock < item.reorderPoint) {
      recommendedStock = item.reorderPoint * 2;
    }

    const currentStock = item.quantity;
    const diff = recommendedStock - currentStock;
    const changePercent =
      currentStock > 0 ? Math.round((diff / currentStock) * 100) : 100;

    let rationaleParts: string[] = [];
    if (recentOut > 0) {
      rationaleParts.push(
        `Recent demand of ${recentOut} units in the last ${windowDays} days`
      );
    } else {
      rationaleParts.push("No recent movement, using safety-stock heuristic");
    }

    if (isDecember) {
      rationaleParts.push(
        "December is a peak month; similar items typically see higher demand"
      );
    } else if (isQ4) {
      rationaleParts.push("Q4 generally shows stronger demand than earlier quarters");
    }

    rationaleParts.push(
      `Target stock covers roughly ${horizonDays} days of projected demand`
    );

    const confidence: AiRecommendation["confidence"] =
      recentOut >= 20 ? "high" : recentOut >= 5 ? "medium" : "low";

    const valueHint = formatCurrencyDetailed(item.unitCost * Math.max(diff, 0));

    const rationale = `${rationaleParts.join(
      ". "
    )}. Approximate additional investment: ${valueHint}.`;

    return {
      id: `rec-${index + 1}`,
      itemId: item.id,
      itemName: item.name,
      currentStock,
      recommendedStock,
      changePercent,
      rationale,
      timeHorizon: horizonLabel,
      confidence,
      createdAt: today.toISOString(),
    };
  });
}

