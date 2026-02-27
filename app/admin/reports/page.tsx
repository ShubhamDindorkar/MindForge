"use client";

import { useState, useMemo } from "react";
import {
  inventoryItems,
  transactions,
  financialSummaries,
} from "@/_lib/mock-data";
import { formatCurrency } from "@/_lib/utils";
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
  FileText,
  Download,
  Package,
  ArrowLeftRight,
  DollarSign,
  Calendar,
} from "lucide-react";

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and export inventory reports
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {startDate} — {endDate}
        </Badge>
      </div>

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
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
    </div>
  );
}
