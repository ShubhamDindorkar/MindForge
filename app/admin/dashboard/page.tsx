"use client";

import { useMemo } from "react";
import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Activity,
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
import { formatCurrency, formatRelativeTime } from "@/_lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/_components/ui/card";
import { Badge } from "@/_components/ui/badge";

const PIE_COLORS = [
  "hsl(160, 60%, 45%)",
  "hsl(200, 65%, 50%)",
  "hsl(270, 50%, 55%)",
  "hsl(35, 70%, 50%)",
  "hsl(340, 55%, 50%)",
  "hsl(180, 50%, 45%)",
];

export default function AdminDashboardPage() {
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
    },
    {
      label: "Total Value",
      value: formatCurrency(totalValue),
      icon: DollarSign,
      trend: 2.8,
      up: true,
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(latestMonth.revenue),
      icon: TrendingUp,
      trend: Math.abs(revenueTrend),
      up: revenueTrend >= 0,
    },
    {
      label: "Monthly Profit",
      value: formatCurrency(latestMonth.profit),
      icon: latestMonth.profit >= (prevMonth?.profit ?? 0) ? TrendingUp : TrendingDown,
      trend: Math.abs(profitTrend),
      up: profitTrend >= 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="border-slate-800 bg-slate-900"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-md bg-slate-800 p-2">
                  <kpi.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <Badge
                  variant="secondary"
                  className={
                    kpi.up
                      ? "border-0 bg-emerald-500/10 text-emerald-400"
                      : "border-0 bg-red-500/10 text-red-400"
                  }
                >
                  {kpi.up ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  {kpi.trend.toFixed(1)}%
                </Badge>
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-100">
                {kpi.value}
              </p>
              <p className="text-sm text-slate-400">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue vs Cost Area Chart */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">
              Revenue vs Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
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
                        stopColor="hsl(160, 60%, 45%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(160, 60%, 45%)"
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
                        stopColor="hsl(200, 65%, 50%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(200, 65%, 50%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(215, 20%, 20%)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(215, 20%, 25%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(215, 20%, 25%)" }}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(215, 28%, 12%)",
                      border: "1px solid hsl(215, 20%, 25%)",
                      borderRadius: "8px",
                      color: "hsl(215, 15%, 75%)",
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(160, 60%, 45%)"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="costs"
                    stroke="hsl(200, 65%, 50%)"
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
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">
              Inventory Value by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
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
                      backgroundColor: "hsl(215, 28%, 12%)",
                      border: "1px solid hsl(215, 20%, 25%)",
                      borderRadius: "8px",
                      color: "hsl(215, 15%, 75%)",
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
                  <span className="text-xs text-slate-400">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-sm font-medium text-slate-300">
              Low Stock Alerts
            </CardTitle>
            <Badge
              variant="secondary"
              className="ml-auto border-0 bg-amber-500/10 text-amber-400"
            >
              {lowStockItems.length}
            </Badge>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-slate-500">
                All items are sufficiently stocked.
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border border-slate-800 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-sm font-semibold text-red-400">
                          {item.quantity}
                        </p>
                        <p className="text-xs text-slate-500">in stock</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">
                          {item.reorderPoint}
                        </p>
                        <p className="text-xs text-slate-500">reorder</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="border-0 bg-amber-500/10 text-amber-400"
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
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Activity className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm font-medium text-slate-300">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between rounded-md border border-slate-800 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {txn.itemName}
                    </p>
                    <p className="text-xs text-slate-500">
                      by {txn.performedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={
                        txn.type === "in"
                          ? "border-0 bg-emerald-500/10 text-emerald-400"
                          : "border-0 bg-blue-500/10 text-blue-400"
                      }
                    >
                      {txn.type === "in" ? "+" : "-"}
                      {txn.quantity}
                    </Badge>
                    <span className="w-16 text-right text-xs text-slate-500">
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
