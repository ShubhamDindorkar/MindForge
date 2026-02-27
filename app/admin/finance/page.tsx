"use client";

import { useState, useMemo, useEffect } from "react";
import { useInventory } from "@/_lib/inventory-context";
import { financialSummaries, categorySpending, forecastData } from "@/_lib/mock-data";
import { formatCurrency } from "@/_lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/_components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/_components/ui/card";
import { Badge } from "@/_components/ui/badge";
import { Slider } from "@/_components/ui/slider";
import { Separator } from "@/_components/ui/separator";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  PiggyBank,
  Calculator,
  Target,
  Sparkles,
} from "lucide-react";
import type { AiRecommendation, CostEntry, YearlyForecastSummary } from "@/_lib/types";
import { formatDate } from "@/_lib/utils";

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(340, 82%, 52%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 0%, 65%)",
];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(0, 0%, 100%)",
    border: "1px solid hsl(0, 0%, 90%)",
    borderRadius: "8px",
    color: "hsl(0, 0%, 20%)",
  },
  labelStyle: { color: "hsl(0, 0%, 45%)" },
};

export default function FinancePage() {
  const { items: inventoryItems } = useInventory();

  const [growthRate, setGrowthRate] = useState(10);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [recommendationHorizon, setRecommendationHorizon] = useState<30 | 60 | 90>(30);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [costsLoading, setCostsLoading] = useState(false);
  const [costsError, setCostsError] = useState<string | null>(null);

  const [yearlySummary, setYearlySummary] = useState<YearlyForecastSummary | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setRecLoading(true);
    setRecError(null);
    fetch(`/api/finance/recommendations?horizon=${recommendationHorizon}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load recommendations");
        const data = await res.json();
        setRecommendations(data.recommendations ?? []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setRecError("Could not load recommendations right now.");
        }
      })
      .finally(() => setRecLoading(false));

    return () => controller.abort();
  }, [recommendationHorizon]);

  useEffect(() => {
    const controller = new AbortController();
    setCostsLoading(true);
    setCostsError(null);
    fetch("/api/finance/costs", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load costs");
        const data = await res.json();
        setCostEntries(data.costs ?? []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setCostsError("Could not load cost entries right now.");
        }
      })
      .finally(() => setCostsLoading(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setForecastLoading(true);
    setForecastError(null);
    fetch("/api/finance/forecast", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load forecast");
        const data = await res.json();
        setYearlySummary(data.yearly ?? null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setForecastError("Could not load yearly P&L forecast right now.");
        }
      })
      .finally(() => setForecastLoading(false));

    return () => controller.abort();
  }, []);

  const topExpensiveItems = useMemo(
    () =>
      [...inventoryItems]
        .sort((a, b) => b.unitCost * b.quantity - a.unitCost * a.quantity)
        .slice(0, 5),
    [inventoryItems]
  );

  const plTotals = useMemo(() => {
    const revenue = financialSummaries.reduce((s, m) => s + m.revenue, 0);
    const costs = financialSummaries.reduce((s, m) => s + m.costs, 0);
    const profit = revenue - costs;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, costs, profit, margin };
  }, []);

  const revenueByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    inventoryItems.forEach((item) => {
      map[item.category] =
        (map[item.category] || 0) + item.sellPrice * item.quantity;
    });
    return Object.entries(map).map(([category, value]) => ({ category, value }));
  }, [inventoryItems]);

  const reorderAlerts = useMemo(
    () =>
      inventoryItems
        .filter((item) => item.quantity <= item.reorderPoint * 1.5)
        .map((item) => ({
          ...item,
          estimatedReorderCost: item.reorderPoint * item.unitCost * 2,
        })),
    [inventoryItems]
  );

  const adjustedForecast = useMemo(() => {
    const multiplier = 1 + growthRate / 100;
    return forecastData.map((d) => {
      if (!("forecast" in d) || !d.forecast) return d;
      const revenue = Math.round(d.revenue * multiplier);
      const costs = Math.round(d.costs * (1 + growthRate / 200));
      return { ...d, revenue, costs, profit: revenue - costs };
    });
  }, [growthRate]);

  const forecastChartData = useMemo(() => {
    const lastHistIdx = adjustedForecast.findIndex(
      (d) => "forecast" in d && d.forecast
    );
    return adjustedForecast.map((d, i) => {
      const isForecast = "forecast" in d && d.forecast;
      const isBridge = i === lastHistIdx - 1;
      return {
        month: d.month,
        historicalRevenue: !isForecast ? d.revenue : undefined,
        historicalCosts: !isForecast ? d.costs : undefined,
        forecastRevenue: isForecast || isBridge ? d.revenue : undefined,
        forecastCosts: isForecast || isBridge ? d.costs : undefined,
      };
    });
  }, [adjustedForecast]);

  const cashFlowProjections = useMemo(() => {
    return adjustedForecast
      .filter((d) => "forecast" in d && d.forecast)
      .map((d) => ({
        month: d.month,
        revenue: d.revenue,
        costs: d.costs,
        netCashFlow: d.profit,
      }));
  }, [adjustedForecast]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium tracking-tight sm:text-2xl">Financial Planner</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track costs, analyze profit &amp; loss, and forecast future performance
        </p>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-3xl">
          <TabsTrigger
            value="recommendations"
            className="gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">AI</span> Recs
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Cost</span> Tracking
          </TabsTrigger>
          <TabsTrigger value="pnl" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            P&amp;L
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Fore</span>cast
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: AI Recommendations ── */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Style Stock Recommendations
                </CardTitle>
                <CardDescription>
                  Suggested stock levels based on recent demand, seasonality, and horizon.
                </CardDescription>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Planning horizon (days)</p>
                <div className="inline-flex rounded-md border bg-background p-0.5 text-xs">
                  {[30, 60, 90].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setRecommendationHorizon(h as 30 | 60 | 90)}
                      className={`px-2 py-1 rounded-sm ${
                        recommendationHorizon === h
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {h}d
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recLoading && (
                <p className="text-sm text-muted-foreground">Loading recommendations…</p>
              )}
              {recError && (
                <p className="text-sm text-destructive">{recError}</p>
              )}
              {!recLoading && !recError && recommendations.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No recommendations are available yet. Try again in a moment.
                </p>
              )}
              {!recLoading && !recError && recommendations.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 pr-4 font-medium">Item</th>
                        <th className="text-left py-3 pr-4 font-medium">Horizon</th>
                        <th className="text-right py-3 pr-4 font-medium">Current</th>
                        <th className="text-right py-3 pr-4 font-medium">Recommended</th>
                        <th className="text-right py-3 pr-4 font-medium">% Change</th>
                        <th className="text-left py-3 pr-4 font-medium">Confidence</th>
                        <th className="text-left py-3 font-medium">Why</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendations.map((rec) => (
                        <tr key={rec.id} className="border-b last:border-0 align-top">
                          <td className="py-3 pr-4 font-medium">{rec.itemName}</td>
                          <td className="py-3 pr-4 text-xs text-muted-foreground">
                            {rec.timeHorizon}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {rec.currentStock}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {rec.recommendedStock}
                          </td>
                          <td
                            className={`py-3 pr-4 text-right tabular-nums ${
                              rec.changePercent >= 0 ? "text-primary" : "text-destructive"
                            }`}
                          >
                            {rec.changePercent > 0 ? "+" : ""}
                            {rec.changePercent}%
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant={
                                rec.confidence === "high"
                                  ? "success"
                                  : rec.confidence === "medium"
                                    ? "warning"
                                    : "outline"
                              }
                            >
                              {rec.confidence.charAt(0).toUpperCase() +
                                rec.confidence.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 text-xs text-muted-foreground max-w-md">
                            {rec.rationale}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Cost Tracking ── */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Spending</CardTitle>
                <CardDescription>
                  Total costs over the last {financialSummaries.length} months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialSummaries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number) => [formatCurrency(value), "Costs"]}
                    />
                    <Bar dataKey="costs" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spending by Category</CardTitle>
                <CardDescription>Breakdown of costs across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categorySpending} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                    <XAxis
                      type="number"
                      tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      dataKey="category"
                      type="category"
                      width={120}
                      tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number) => [formatCurrency(value), "Spent"]}
                    />
                    <Bar dataKey="amount" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget vs Actual</CardTitle>
              <CardDescription>
                Spending against budget by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {categorySpending.map((cat, i) => {
                  const pct = Math.round((cat.amount / cat.budget) * 100);
                  const over = cat.amount > cat.budget;
                  return (
                    <div
                      key={cat.category}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{cat.category}</span>
                        <Badge variant={over ? "destructive" : "success"}>
                          {over ? "Over" : "Under"} budget
                        </Badge>
                      </div>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(cat.amount)}{" "}
                          <span className="text-xs">
                            / {formatCurrency(cat.budget)}
                          </span>
                        </span>
                        <span
                          className={
                            over ? "text-destructive font-semibold" : "text-primary font-semibold"
                          }
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            over ? "bg-destructive" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      {over && (
                        <p className="text-xs text-destructive">
                          {formatCurrency(cat.amount - cat.budget)} over budget
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Cost Entries</CardTitle>
              <CardDescription>
                Detailed list of recent costs across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {costsLoading && (
                <p className="text-sm text-muted-foreground">Loading cost entries…</p>
              )}
              {costsError && (
                <p className="text-sm text-destructive">{costsError}</p>
              )}
              {!costsLoading && !costsError && costEntries.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No cost entries are available yet.
                </p>
              )}
              {!costsLoading && !costsError && costEntries.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 pr-4 font-medium">Date</th>
                        <th className="text-left py-3 pr-4 font-medium">Category</th>
                        <th className="text-left py-3 pr-4 font-medium">Description</th>
                        <th className="text-right py-3 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costEntries.map((c) => (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 text-xs text-muted-foreground">
                            {formatDate(c.date)}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline">{c.category}</Badge>
                          </td>
                          <td className="py-3 pr-4 max-w-md">
                            {c.description ?? "-"}
                          </td>
                          <td className="py-3 text-right tabular-nums font-medium">
                            {formatCurrency(c.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 5 Most Expensive Items</CardTitle>
              <CardDescription>
                Ranked by total inventory value (unit cost &times; quantity)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-3 pr-4 font-medium">#</th>
                      <th className="text-left py-3 pr-4 font-medium">Item</th>
                      <th className="text-left py-3 pr-4 font-medium">Category</th>
                      <th className="text-right py-3 pr-4 font-medium">Unit Cost</th>
                      <th className="text-right py-3 pr-4 font-medium">Qty</th>
                      <th className="text-right py-3 font-medium">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topExpensiveItems.map((item, idx) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-3 pr-4 font-medium">{item.name}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">{item.category}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right font-semibold tabular-nums">
                          {formatCurrency(item.unitCost * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Profit & Loss ── */}
        <TabsContent value="pnl" className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Gross Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(plTotals.revenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Over {financialSummaries.length} months
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">COGS</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(plTotals.costs)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cost of goods sold
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Gross Profit
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(plTotals.profit)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Revenue minus COGS
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Margin %</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {plTotals.margin.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gross profit margin
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Monthly P&amp;L Trend</CardTitle>
                <CardDescription>
                  Revenue, cost, and profit trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={financialSummaries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name.charAt(0).toUpperCase() + name.slice(1),
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS[0]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="costs"
                      stroke={CHART_COLORS[4]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke={CHART_COLORS[1]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue by Category</CardTitle>
                <CardDescription>
                  Distribution of potential revenue
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={3}
                      label={({ category, percent }) =>
                        `${category} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {revenueByCategory.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed P&amp;L by Month</CardTitle>
              <CardDescription>
                Monthly breakdown of revenue, costs, profit, and margin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-3 pr-4 font-medium">Month</th>
                      <th className="text-right py-3 pr-4 font-medium">Revenue</th>
                      <th className="text-right py-3 pr-4 font-medium">Costs</th>
                      <th className="text-right py-3 pr-4 font-medium">Profit</th>
                      <th className="text-right py-3 font-medium">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialSummaries.map((m) => {
                      const margin =
                        m.revenue > 0
                          ? ((m.profit / m.revenue) * 100).toFixed(1)
                          : "0.0";
                      return (
                        <tr key={m.month} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{m.month}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {formatCurrency(m.revenue)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-destructive">
                            {formatCurrency(m.costs)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-primary">
                            {formatCurrency(m.profit)}
                          </td>
                          <td className="py-3 text-right tabular-nums">
                            {margin}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="py-3 pr-4">Total</td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {formatCurrency(plTotals.revenue)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-destructive">
                        {formatCurrency(plTotals.costs)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-primary">
                        {formatCurrency(plTotals.profit)}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {plTotals.margin.toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Forecasting ── */}
        <TabsContent value="forecast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Projected Costs — Historical vs Forecast
              </CardTitle>
              <CardDescription>
                Solid lines show actuals, dashed lines show projected values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "hsl(0,0%,60%)", fontSize: 12 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "historicalCosts"
                        ? "Actual Costs"
                        : name === "forecastCosts"
                          ? "Forecast Costs"
                          : name === "historicalRevenue"
                            ? "Actual Revenue"
                            : "Forecast Revenue",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="historicalRevenue"
                    stroke={CHART_COLORS[0]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Actual Revenue"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastRevenue"
                    stroke={CHART_COLORS[0]}
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    dot={{ r: 4 }}
                    name="Forecast Revenue"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="historicalCosts"
                    stroke={CHART_COLORS[4]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Actual Costs"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastCosts"
                    stroke={CHART_COLORS[4]}
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    dot={{ r: 4 }}
                    name="Forecast Costs"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-primary" />
                  Reorder Cost Forecast
                </CardTitle>
                <CardDescription>
                  Items near reorder point (within 150% of threshold)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reorderAlerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No items are currently near their reorder point.
                    </p>
                  ) : (
                    reorderAlerts.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} / Reorder at: {item.reorderPoint}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-semibold text-sm">
                            {formatCurrency(item.estimatedReorderCost)}
                          </p>
                          <Badge
                            variant={
                              item.quantity <= item.reorderPoint
                                ? "destructive"
                                : "warning"
                            }
                          >
                            {item.quantity <= item.reorderPoint
                              ? "Below threshold"
                              : "Near threshold"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                  <Separator />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total Estimated Reorder Cost
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(
                        reorderAlerts.reduce(
                          (s, i) => s + i.estimatedReorderCost,
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Cash Flow Projection
                </CardTitle>
                <CardDescription>
                  Next 3 months projected cash flow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cashFlowProjections.map((m, i) => (
                    <div key={m.month} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{m.month}</span>
                        <Badge variant="secondary">Month {i + 1}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Revenue</p>
                          <p className="font-medium tabular-nums">
                            {formatCurrency(m.revenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Costs</p>
                          <p className="font-medium tabular-nums text-destructive">
                            {formatCurrency(m.costs)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Net Cash Flow
                          </p>
                          <p className="font-medium tabular-nums text-primary">
                            {formatCurrency(m.netCashFlow)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="grid grid-cols-3 gap-2 text-sm pt-1">
                    <div>
                      <p className="text-muted-foreground text-xs">Total Revenue</p>
                      <p className="font-bold tabular-nums">
                        {formatCurrency(
                          cashFlowProjections.reduce((s, m) => s + m.revenue, 0)
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Total Costs</p>
                      <p className="font-bold tabular-nums text-destructive">
                        {formatCurrency(
                          cashFlowProjections.reduce((s, m) => s + m.costs, 0)
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Net Total</p>
                      <p className="font-bold tabular-nums text-primary">
                        {formatCurrency(
                          cashFlowProjections.reduce(
                            (s, m) => s + m.netCashFlow,
                            0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                What-If Scenario
              </CardTitle>
              <CardDescription>
                Adjust the growth rate to see how it impacts projected revenue,
                costs, and profit for forecasted months
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Growth Rate</span>
                  <Badge variant="outline" className="text-base tabular-nums px-3">
                    {growthRate}%
                  </Badge>
                </div>
                <Slider
                  value={[growthRate]}
                  onValueChange={(v) => setGrowthRate(v[0])}
                  min={0}
                  max={30}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>15%</span>
                  <span>30%</span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                {adjustedForecast
                  .filter((d) => "forecast" in d && d.forecast)
                  .map((d) => (
                    <div key={d.month} className="rounded-lg border p-4 space-y-3">
                      <p className="font-semibold text-sm">{d.month}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency(d.revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Costs</span>
                          <span className="font-medium tabular-nums text-destructive">
                            {formatCurrency(d.costs)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Profit</span>
                          <span className="font-bold tabular-nums text-primary">
                            {formatCurrency(d.profit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Margin</span>
                          <span className="font-medium tabular-nums">
                            {d.revenue > 0
                              ? ((d.profit / d.revenue) * 100).toFixed(1)
                              : "0.0"}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
