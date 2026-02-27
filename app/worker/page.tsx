"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/_lib/auth-context";
import { useInventory } from "@/_lib/inventory-context";
import { formatRelativeTime } from "@/_lib/utils";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
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
  Clock,
  Package,
} from "lucide-react";

type DialogMode = "in" | "out" | null;

export default function WorkerHomePage() {
  const { user } = useAuth();
  const { items, transactions, addTransaction } = useInventory();
  const router = useRouter();

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const recentTransactions = transactions.slice(0, 5);

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

  const quickActions = [
    {
      label: "Scan QR Code",
      icon: ScanLine,
      color: "text-primary",
      bg: "bg-primary/10",
      action: () => router.push("/worker/scan"),
    },
    {
      label: "Stock In",
      icon: ArrowDownToLine,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      action: () => setDialogMode("in"),
    },
    {
      label: "Stock Out",
      icon: ArrowUpFromLine,
      color: "text-red-400",
      bg: "bg-red-400/10",
      action: () => setDialogMode("out"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold">Hello, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((qa) => (
          <Card
            key={qa.label}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={qa.action}
          >
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${qa.bg}`}
              >
                <qa.icon className={`h-5 w-5 ${qa.color}`} />
              </div>
              <span className="text-center text-xs font-medium">
                {qa.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent Activity</h2>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            No recent transactions
          </p>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {tx.itemName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(tx.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        tx.type === "in"
                          ? "text-emerald-500"
                          : "text-red-400"
                      }`}
                    >
                      {tx.type === "in" ? "+" : "-"}
                      {tx.quantity}
                    </span>
                    <Badge
                      variant={tx.type === "in" ? "success" : "destructive"}
                      className="text-[10px]"
                    >
                      {tx.type === "in" ? "IN" : "OUT"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
