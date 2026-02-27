import {
  InventoryItem,
  Transaction,
  FinancialSummary,
  CostEntry,
  YearlyForecastSummary,
} from "./types";
import {
  inventoryItems,
  transactions,
  financialSummaries,
  costEntries,
  forecastData,
} from "./mock-data";

export function getInventoryItems(): InventoryItem[] {
  return inventoryItems;
}

export function getTransactions(): Transaction[] {
  return transactions;
}

export function getCostEntries(): CostEntry[] {
  return costEntries;
}

export function getFinancialSummaries(): FinancialSummary[] {
  return financialSummaries;
}

export function getForecastSeries() {
  return forecastData;
}

export function getAggregatedPnL() {
  const revenue = financialSummaries.reduce((sum, m) => sum + m.revenue, 0);
  const costs = financialSummaries.reduce((sum, m) => sum + m.costs, 0);
  const profit = revenue - costs;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { revenue, costs, profit, margin };
}

export function getCategoryRevenueBreakdown() {
  const map: Record<string, number> = {};
  inventoryItems.forEach((item) => {
    map[item.category] =
      (map[item.category] || 0) + item.sellPrice * item.quantity;
  });

  return Object.entries(map).map(([category, value]) => ({ category, value }));
}

export function getYearlyForecastSummary(year: number): YearlyForecastSummary {
  const points = forecastData.filter((d) => {
    const parts = d.month.split(" ");
    const y = Number(parts[1]);
    return !Number.isNaN(y) && y === year;
  });

  const totalRevenue = points.reduce((sum, p) => sum + p.revenue, 0);
  const totalCosts = points.reduce((sum, p) => sum + p.costs, 0);
  const totalProfit = totalRevenue - totalCosts;

  return {
    year,
    totalRevenue,
    totalCosts,
    totalProfit,
  };
}

