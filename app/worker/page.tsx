"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/_lib/auth-context";
import { useInventory } from "@/_lib/inventory-context";
import { formatRelativeTime, cn } from "@/_lib/utils";
import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { Badge } from "@/_components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/_components/ui/dialog";
import { Label } from "@/_components/ui/label";
import { Input } from "@/_components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/_components/ui/select";
import {
  ScanLine,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Activity,
  AlertTriangle,
  Boxes,
} from "lucide-react";

type DialogMode = "in" | "out" | null;

export default function WorkerHomePage() {
  const { user } = useAuth();
  const { items, transactions, addTransaction } = useInventory();
  const router = useRouter();

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const recentTransactions = useMemo(() => transactions.slice(0, 10), [transactions]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const stockInCount = useMemo(
    () => transactions.filter((t) => t.type === "in").reduce((s, t) => s + t.quantity, 0),
    [transactions]
  );

  const stockOutCount = useMemo(
    () => transactions.filter((t) => t.type === "out").reduce((s, t) => s + t.quantity, 0),
    [transactions]
  );

  const lowStockItems = useMemo(
    () => items.filter((item) => item.quantity <= item.reorderPoint),
    [items]
  );

  function handleSubmit() {
    if (!dialogMode || !selectedItemId || quantity < 1) return;

    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;

    addTransaction({
      itemId: item.id,
      itemName: item.name,
      type: dialogMode,
      quantity,
      date: new Date().toISOString(),
      performedBy: user?.name ?? "Worker",
    });

    setDialogMode(null);
    setSelectedItemId("");
    setQuantity(1);
  }

  const kpis = [
    {
      label: "Total Stock",
      value: totalItems.toLocaleString(),
      icon: Package,
      trend: 4.2,
      up: true,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Items In",
      value: stockInCount.toLocaleString(),
      icon: ArrowDownToLine,
      trend: 8.1,
      up: true,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Items Out",
      value: stockOutCount.toLocaleString(),
      icon: ArrowUpFromLine,
      trend: 3.5,
      up: false,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Low Stock Alerts",
      value: lowStockItems.length.toString(),
      icon: AlertTriangle,
      trend: lowStockItems.length > 0 ? lowStockItems.length : 0,
      up: lowStockItems.length === 0,
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 border border-border/60 shadow-none"
          onClick={() => router.push("/worker/scan")}
        >
          <CardContent className="flex items-center gap-4 p-4 sm:flex-col sm:items-center sm:gap-2 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ScanLine className="h-5 w-5 text-primary" />
            </div>
            <div className="sm:text-center">
              <span className="text-sm font-medium">Scan QR Code</span>
              <p className="text-xs text-muted-foreground sm:mt-1">
                Scan items to check or update stock
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 border border-border/60 shadow-none"
          onClick={() => setDialogMode("in")}
        >
          <CardContent className="flex items-center gap-4 p-4 sm:flex-col sm:items-center sm:gap-2 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <ArrowDownToLine className="h-5 w-5 text-foreground" />
            </div>
            <div className="sm:text-center">
              <span className="text-sm font-medium">Stock In</span>
              <p className="text-xs text-muted-foreground sm:mt-1">
                Record incoming inventory
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 border border-border/60 shadow-none"
          onClick={() => setDialogMode("out")}
        >
          <CardContent className="flex items-center gap-4 p-4 sm:flex-col sm:items-center sm:gap-2 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <ArrowUpFromLine className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="sm:text-center">
              <span className="text-sm font-medium">Stock Out</span>
              <p className="text-xs text-muted-foreground sm:mt-1">
                Record outgoing inventory
              </p>
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
                    <div className="flex items-center gap-3 text-right">
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
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No recent transactions
              </p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock In/Out Dialog */}
      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
            setSelectedItemId("");
            setQuantity(1);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "in" ? "Stock In" : "Stock Out"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Item</Label>
              <Select
                value={selectedItemId}
                onValueChange={setSelectedItemId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogMode(null);
                setSelectedItemId("");
                setQuantity(1);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedItemId}
            >
              {dialogMode === "in" ? "Add Stock" : "Remove Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
