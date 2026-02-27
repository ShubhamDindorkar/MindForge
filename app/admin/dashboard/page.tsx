"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Activity,
  Brain,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  PackageCheck,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  inventoryItems,
  transactions,
  financialSummaries,
} from "@/_lib/mock-data";
import { formatCurrency, formatRelativeTime, cn } from "@/_lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/_components/ui/card";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { getInsights, type AIRecommendation, type InsightsResponse } from "@/_lib/ai-service";

const PIE_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(38, 92%, 50%)",
  "hsl(340, 82%, 52%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 0%, 65%)",
];

const URGENCY_CONFIG = {
  critical: { color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  high: { color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  medium: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  low: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

const TYPE_ICON = {
  reorder: PackageCheck,
  anomaly: ShieldAlert,
  overstock: Package,
};

export default function AdminDashboardPage() {
  /* AI Insights state */
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const data = await getInsights();
      setInsights(data);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Failed to load AI insights");
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const totalItems = useMemo(
    () => inventoryItems.reduce((sum, item) => sum + item.quantity, 0),
    []
  );

  const totalValue = useMemo(
    () =>
      inventoryItems.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0
      ),
    []
  );

  const latestMonth = financialSummaries[financialSummaries.length - 1];
  const prevMonth = financialSummaries[financialSummaries.length - 2];

  const revenueTrend = prevMonth
    ? ((latestMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
    : 0;

  const profitTrend = prevMonth
    ? ((latestMonth.profit - prevMonth.profit) / prevMonth.profit) * 100
    : 0;

  const lowStockItems = useMemo(
    () => inventoryItems.filter((item) => item.quantity <= item.reorderPoint),
    []
  );

  const recentTransactions = useMemo(
    () => [...transactions].slice(0, 10),
    []
  );

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    inventoryItems.forEach((item) => {
      const val = item.quantity * item.unitCost;
      map.set(item.category, (map.get(item.category) ?? 0) + val);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, []);

  const kpis = [
    {
      label: "Total Items",
      value: totalItems.toLocaleString(),
      icon: Package,
      trend: 4.2,
      up: true,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Value",
      value: formatCurrency(totalValue),
      icon: DollarSign,
      trend: 2.8,
      up: true,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(latestMonth.revenue),
      icon: TrendingUp,
      trend: Math.abs(revenueTrend),
      up: revenueTrend >= 0,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Monthly Profit",
      value: formatCurrency(latestMonth.profit),
      icon: latestMonth.profit >= (prevMonth?.profit ?? 0) ? TrendingUp : TrendingDown,
      trend: Math.abs(profitTrend),
      up: profitTrend >= 0,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border border-border/60 shadow-none">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className={cn("rounded-xl p-2 sm:p-2.5", kpi.color)}>
                  <kpi.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-0 text-xs",
                    kpi.up
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  )}
                >
                  {kpi.up ? (
                    <ArrowUpRight className="mr-0.5 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-0.5 h-3 w-3" />
                  )}
                  {kpi.trend.toFixed(1)}%
                </Badge>
              </div>
              <p className="mt-3 text-xl font-medium text-foreground sm:mt-4 sm:text-2xl">
                {kpi.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights Section */}
      <Card className="border border-border/60 shadow-none overflow-hidden">
        <CardHeader className="flex-row items-center gap-2 space-y-0 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-border/40">
          <div className="rounded-xl bg-violet-100 p-2">
            <Brain className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
              MindForge AI Insights
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            </CardTitle>
            {insights?.summary && (
              <p className="text-xs text-muted-foreground mt-0.5">{insights.summary}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchInsights}
            disabled={aiLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", aiLoading && "animate-spin")} />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {aiLoading && !insights ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Analyzing inventory data...</span>
            </div>
          ) : aiError && !insights ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-muted-foreground">{aiError}</p>
              <Button variant="outline" size="sm" onClick={fetchInsights}>
                Retry
              </Button>
            </div>
          ) : insights?.recommendations && insights.recommendations.length > 0 ? (
            <div className="space-y-3">
              {insights.recommendations.map((rec, idx) => {
                const urgency = URGENCY_CONFIG[rec.urgency] || URGENCY_CONFIG.low;
                const TypeIcon = TYPE_ICON[rec.type] || Sparkles;
                return (
                  <div
                    key={`${rec.sku}-${idx}`}
                    className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className={cn("rounded-lg p-2 mt-0.5", rec.type === "reorder" ? "bg-blue-50 text-blue-600" : rec.type === "anomaly" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{rec.title}</p>
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 border", urgency.color)}>
                          {rec.urgency}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {rec.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] font-mono text-muted-foreground">{rec.sku}</span>
                        {rec.quantity && (
                          <span className="text-[11px] text-foreground">
                            Qty: <strong>{rec.quantity}</strong>
                          </span>
                        )}
                        {rec.confidence > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            {(rec.confidence * 100).toFixed(0)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-center py-8 text-muted-foreground">
              No AI insights available yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue vs Cost Area Chart */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">
              Revenue vs Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialSummaries}>
                  <defs>
                    <linearGradient
                      id="revenueGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(217, 91%, 60%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(217, 91%, 60%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="costsGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(142, 71%, 45%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(142, 71%, 45%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(0, 0%, 90%)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(0, 0%, 90%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(0, 0%, 90%)" }}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(0, 0%, 90%)",
                      borderRadius: "8px",
                      color: "hsl(0, 0%, 20%)",
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="costs"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={2}
                    fill="url(#costsGrad)"
                    name="Costs"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Inventory by Category Pie Chart */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">
              Inventory Value by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {categoryData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(0, 0%, 90%)",
                      borderRadius: "8px",
                      color: "hsl(0, 0%, 20%)",
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {categoryData.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <AlertTriangle className="h-4 w-4 text-foreground" />
            <CardTitle className="text-sm font-medium text-foreground">
              Low Stock Alerts
            </CardTitle>
            <Badge
              variant="secondary"
              className="ml-auto border-0 bg-muted text-foreground"
            >
              {lowStockItems.length}
            </Badge>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All items are sufficiently stocked.
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-right">
                      <div>
                        <p className="text-sm font-normal text-destructive">
                          {item.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">in stock</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm text-muted-foreground">
                          {item.reorderPoint}
                        </p>
                        <p className="text-xs text-muted-foreground">reorder</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="border-0 bg-muted text-foreground"
                      >
                        {item.quantity === 0 ? "Out" : "Low"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Activity className="h-4 w-4 text-foreground" />
            <CardTitle className="text-sm font-medium text-foreground">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {txn.itemName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {txn.performedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge
                      variant="secondary"
                      className={
                        txn.type === "in"
                          ? "border-0 bg-muted text-foreground"
                          : "border-0 bg-muted text-muted-foreground"
                      }
                    >
                      {txn.type === "in" ? "+" : "-"}
                      {txn.quantity}
                    </Badge>
                    <span className="hidden w-16 text-right text-xs text-muted-foreground sm:inline-block">
                      {formatRelativeTime(txn.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
