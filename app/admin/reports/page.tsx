"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  inventoryItems,
  transactions,
  financialSummaries,
} from "@/_lib/mock-data";
import { formatCurrency, cn } from "@/_lib/utils";
import { Button } from "@/_components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/_components/ui/card";
import { Badge } from "@/_components/ui/badge";
import { Separator } from "@/_components/ui/separator";
import { Input } from "@/_components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/_components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/_components/ui/tabs";
import {
  FileText,
  Download,
  Package,
  ArrowLeftRight,
  DollarSign,
  Calendar,
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getForecast,
  getAnomalies,
  type ForecastResponse,
  type AnomaliesResponse,
} from "@/_lib/ai-service";

type Preset = "week" | "month" | "quarter" | "custom";

function getPresetDates(preset: Preset): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];

  if (preset === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return { start: d.toISOString().split("T")[0], end };
  }
  if (preset === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: d.toISOString().split("T")[0], end };
  }
  const d = new Date(now);
  d.setMonth(d.getMonth() - 3);
  return { start: d.toISOString().split("T")[0], end };
}

export default function ReportsPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [startDate, setStartDate] = useState(
    () => getPresetDates("month").start
  );
  const [endDate, setEndDate] = useState(() => getPresetDates("month").end);

  function selectPreset(p: Preset) {
    setPreset(p);
    if (p !== "custom") {
      const { start, end } = getPresetDates(p);
      setStartDate(start);
      setEndDate(end);
    }
  }

  const totalItems = inventoryItems.length;
  const totalValue = useMemo(
    () => inventoryItems.reduce((s, i) => s + i.quantity * i.unitCost, 0),
    []
  );
  const avgItemValue = totalItems > 0 ? totalValue / totalItems : 0;

  const totalTransactions = transactions.length;
  const itemsIn = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "in")
        .reduce((s, t) => s + t.quantity, 0),
    []
  );
  const itemsOut = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "out")
        .reduce((s, t) => s + t.quantity, 0),
    []
  );

  const totalRevenue = useMemo(
    () => financialSummaries.reduce((s, f) => s + f.revenue, 0),
    []
  );
  const totalCosts = useMemo(
    () => financialSummaries.reduce((s, f) => s + f.costs, 0),
    []
  );
  const netProfit = totalRevenue - totalCosts;

  function handleExport() {
    alert("Report exported!");
  }

  const presets: { key: Preset; label: string }[] = [
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "quarter", label: "This Quarter" },
    { key: "custom", label: "Custom" },
  ];

  /* ── AI Forecast State ──────────────────────────────────────────── */

  const [selectedSku, setSelectedSku] = useState(inventoryItems[0]?.sku || "");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [anomaliesLoading, setAnomaliesLoading] = useState(false);

  const fetchForecast = useCallback(async (sku: string) => {
    setForecastLoading(true);
    setForecastError(null);
    try {
      const data = await getForecast(sku);
      setForecast(data);
    } catch (err: unknown) {
      setForecastError(err instanceof Error ? err.message : "Failed to load forecast");
    } finally {
      setForecastLoading(false);
    }
  }, []);

  const fetchAnomalies = useCallback(async () => {
    setAnomaliesLoading(true);
    try {
      const data = await getAnomalies();
      setAnomalies(data);
    } catch {
      // silently fail
    } finally {
      setAnomaliesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSku) fetchForecast(selectedSku);
  }, [selectedSku, fetchForecast]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  /* Build chart data: combine actual + predicted */
  const chartData = useMemo(() => {
    if (!forecast) return [];

    const actual = (forecast.actual_data || []).slice(-30).map((d) => ({
      date: d.date.slice(5),
      actual: d.demand,
      stock: d.stock_level,
    }));

    const predicted = (forecast.forecast || []).map((d) => ({
      date: d.date.slice(5),
      predicted: d.predicted_demand,
      upper: d.upper_bound,
      lower: d.lower_bound,
    }));

    return [...actual, ...predicted];
  }, [forecast]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight sm:text-2xl">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate reports and view AI-powered forecasts
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {startDate} — {endDate}
        </Badge>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            AI Forecast
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Anomalies
          </TabsTrigger>
        </TabsList>

        {/* ── Reports Tab ──────────────────────────────────────────── */}

        <TabsContent value="reports" className="space-y-6">
          <Card className="border border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Date Range</CardTitle>
              <CardDescription>
                Select a preset or pick custom dates
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button
                    key={p.key}
                    size="sm"
                    variant={preset === p.key ? "default" : "outline"}
                    onClick={() => selectPreset(p.key)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>

              {preset === "custom" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-auto"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Inventory Valuation Report */}
            <Card className="flex flex-col border border-border/60 shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                    <Package className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Inventory Valuation
                    </CardTitle>
                    <CardDescription>Current stock value overview</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <Separator />
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Total Items</span>
                  <span className="text-right font-medium">{totalItems}</span>
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="text-right font-medium">
                    {formatCurrency(totalValue)}
                  </span>
                  <span className="text-muted-foreground">Avg. Item Value</span>
                  <span className="text-right font-medium">
                    {formatCurrency(avgItemValue)}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardFooter>
            </Card>

            {/* Stock Movement Report */}
            <Card className="flex flex-col border border-border/60 shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50">
                    <ArrowLeftRight className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Stock Movement</CardTitle>
                    <CardDescription>
                      Transaction history summary
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <Separator />
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="text-right font-medium">
                    {totalTransactions}
                  </span>
                  <span className="text-muted-foreground">Items In</span>
                  <span className="text-right font-medium text-foreground">
                    +{itemsIn}
                  </span>
                  <span className="text-muted-foreground">Items Out</span>
                  <span className="text-right font-medium text-muted-foreground">
                    -{itemsOut}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardFooter>
            </Card>

            {/* Financial Summary Report */}
            <Card className="flex flex-col border border-border/60 shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Financial Summary</CardTitle>
                    <CardDescription>Revenue, costs & profit</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <Separator />
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="text-right font-medium">
                    {formatCurrency(totalRevenue)}
                  </span>
                  <span className="text-muted-foreground">Total Costs</span>
                  <span className="text-right font-medium">
                    {formatCurrency(totalCosts)}
                  </span>
                  <span className="text-muted-foreground">Net Profit</span>
                  <span className="text-right font-medium text-foreground">
                    {formatCurrency(netProfit)}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Reports based on data from {startDate} to {endDate}
          </div>
        </TabsContent>

        {/* ── AI Forecast Tab ──────────────────────────────────────── */}

        <TabsContent value="forecast" className="space-y-6">
          {/* SKU Selector */}
          <Card className="border border-border/60 shadow-none">
            <CardHeader className="pb-3 flex-row items-center gap-2 space-y-0">
              <div className="rounded-xl bg-gray-100 p-2">
                <Brain className="h-4 w-4 text-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-1.5">
                  Demand Forecast
                  <Sparkles className="h-3.5 w-3.5 text-foreground" />
                </CardTitle>
                <CardDescription>
                  14-day AI-powered demand prediction with reorder recommendations
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={forecastLoading}
                onClick={() => fetchForecast(selectedSku)}
                className="h-8 w-8"
              >
                <RefreshCw className={cn("h-4 w-4", forecastLoading && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={selectedSku} onValueChange={setSelectedSku}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.sku} value={item.sku}>
                        {item.name} ({item.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Forecast Chart & Details */}
          {forecastLoading ? (
            <Card className="border border-border/60 shadow-none">
              <CardContent className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Generating forecast with AI...</span>
              </CardContent>
            </Card>
          ) : forecastError ? (
            <Card className="border border-border/60 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-muted-foreground">{forecastError}</p>
                <Button variant="outline" size="sm" onClick={() => fetchForecast(selectedSku)}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : forecast ? (
            <div className="space-y-4">
              {/* Chart */}
              <Card className="border border-border/60 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {forecast.item_name || selectedSku} — Actual vs Predicted Demand
                  </CardTitle>
                  {forecast.trend_summary && (
                    <CardDescription>{forecast.trend_summary}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(0, 0%, 15%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(0, 0%, 15%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(0, 0%, 30%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(0, 0%, 30%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 11 }}
                          axisLine={{ stroke: "hsl(0, 0%, 90%)" }}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 11 }}
                          axisLine={{ stroke: "hsl(0, 0%, 90%)" }}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(0, 0%, 100%)",
                            border: "1px solid hsl(0, 0%, 90%)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="actual"
                          stroke="hsl(0, 0%, 15%)"
                          strokeWidth={2}
                          fill="url(#actualGrad)"
                          name="Actual"
                          connectNulls={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="predicted"
                          stroke="hsl(0, 0%, 30%)"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          fill="url(#predictedGrad)"
                          name="Predicted"
                          connectNulls={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="upper"
                          stroke="hsl(0, 0%, 80%)"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                          name="Upper Bound"
                          connectNulls={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="lower"
                          stroke="hsl(0, 0%, 80%)"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                          name="Lower Bound"
                          connectNulls={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-5 rounded bg-gray-800" />
                      <span className="text-xs text-muted-foreground">Actual Demand</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-5 rounded bg-gray-500 opacity-60" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, white 3px, white 5px)" }} />
                      <span className="text-xs text-muted-foreground">Predicted Demand</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-px w-5 border-t border-dashed border-gray-400" />
                      <span className="text-xs text-muted-foreground">Confidence Bounds</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Info cards row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Reorder Recommendation */}
                <Card className={cn(
                  "border shadow-none",
                  forecast.reorder?.recommended
                    ? "border-border bg-gray-50/30"
                    : "border-border/60"
                )}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-foreground" />
                      Reorder Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {forecast.reorder?.recommended ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn(
                            "text-xs border",
                            forecast.reorder.urgency === "critical" ? "bg-red-100 text-red-700 border-red-200" :
                            forecast.reorder.urgency === "high" ? "bg-orange-100 text-orange-700 border-orange-200" :
                            "bg-yellow-100 text-yellow-700 border-yellow-200"
                          )}>
                            {forecast.reorder.urgency}
                          </Badge>
                          <span className="text-sm font-medium">
                            Order {forecast.reorder.quantity} units
                          </span>
                        </div>
                        {forecast.reorder.order_by_date && (
                          <p className="text-xs text-muted-foreground">
                            Order by: <strong>{forecast.reorder.order_by_date}</strong>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{forecast.reorder.reason}</p>
                      </>
                    ) : (
                      <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                        ✓ Stock levels adequate — no reorder needed
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Anomaly Detection */}
                <Card className={cn(
                  "border shadow-none",
                  forecast.anomaly?.detected
                    ? "border-red-200 bg-red-50/30"
                    : "border-border/60"
                )}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      Anomaly Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {forecast.anomaly?.detected ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn(
                            "text-xs border",
                            forecast.anomaly.severity === "high" ? "bg-red-100 text-red-700 border-red-200" :
                            forecast.anomaly.severity === "medium" ? "bg-orange-100 text-orange-700 border-orange-200" :
                            "bg-yellow-100 text-yellow-700 border-yellow-200"
                          )}>
                            {forecast.anomaly.severity}
                          </Badge>
                          <span className="text-sm font-medium capitalize">
                            {forecast.anomaly.type?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{forecast.anomaly.detail}</p>
                      </>
                    ) : (
                      <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                        ✓ No anomalies detected
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Safety Stock */}
                <Card className="border border-border/60 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Key Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Safety Stock</span>
                      <span className="text-right font-medium">
                        {forecast.safety_stock != null ? Math.round(forecast.safety_stock) : "—"} units
                      </span>
                      <span className="text-muted-foreground">Forecast Days</span>
                      <span className="text-right font-medium">{forecast.forecast?.length || 0}</span>
                      <span className="text-muted-foreground">Data Points</span>
                      <span className="text-right font-medium">{forecast.actual_data?.length || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* ── Anomalies Tab ────────────────────────────────────────── */}

        <TabsContent value="anomalies" className="space-y-6">
          <Card className="border border-border/60 shadow-none">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <div className="rounded-xl bg-red-100 p-2">
                <ShieldAlert className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Anomaly Detection</CardTitle>
                <CardDescription>
                  AI-detected unusual patterns in your inventory data
                </CardDescription>
              </div>
              {anomalies && (
                <Badge variant="outline" className="gap-1">
                  Health Score:
                  <span className={cn(
                    "font-semibold",
                    anomalies.health_score >= 80 ? "text-emerald-600" :
                    anomalies.health_score >= 60 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {anomalies.health_score}/100
                  </span>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                disabled={anomaliesLoading}
                onClick={fetchAnomalies}
                className="h-8 w-8"
              >
                <RefreshCw className={cn("h-4 w-4", anomaliesLoading && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent>
              {anomaliesLoading && !anomalies ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Scanning for anomalies...</span>
                </div>
              ) : anomalies?.anomalies && anomalies.anomalies.length > 0 ? (
                <div className="space-y-3">
                  {anomalies.anomalies.map((a, idx) => {
                    const sevColors: Record<string, string> = {
                      high: "bg-red-100 text-red-700 border-red-200",
                      medium: "bg-orange-100 text-orange-700 border-orange-200",
                      low: "bg-yellow-100 text-yellow-700 border-yellow-200",
                    };
                    return (
                      <div
                        key={`${a.sku}-${idx}`}
                        className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className={cn(
                          "rounded-lg p-2 mt-0.5",
                          a.severity === "high" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                        )}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground">
                              {a.item_name}
                            </p>
                            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 border", sevColors[a.severity] || sevColors.low)}>
                              {a.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                              {a.type?.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[11px] font-mono text-muted-foreground">{a.sku}</span>
                            {a.detected_date && (
                              <span className="text-[11px] text-muted-foreground">
                                Detected: {a.detected_date}
                              </span>
                            )}
                          </div>
                          {a.recommendation && (
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              {a.recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-center py-12 text-muted-foreground">
                  No anomalies detected — inventory patterns look healthy.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
