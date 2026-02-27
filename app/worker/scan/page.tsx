"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/_lib/auth-context";
import { useInventory } from "@/_lib/inventory-context";
import { formatCurrency } from "@/_lib/utils";
import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Badge } from "@/_components/ui/badge";
import { Separator } from "@/_components/ui/separator";
import {
  ScanLine,
  Plus,
  Minus,
  Search,
  MapPin,
  Package,
  Check,
  X,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import type { InventoryItem } from "@/_lib/types";

export default function ScanPage() {
  const { user } = useAuth();
  const { getItemBySku, addTransaction } = useInventory();

  const [manualSku, setManualSku] = useState("");
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleScanResult = useCallback(
    (sku: string) => {
      const trimmed = sku.trim();
      if (!trimmed) return;

      const item = getItemBySku(trimmed);
      if (item) {
        setFoundItem(item);
        setNotFound(false);
      } else {
        setFoundItem(null);
        setNotFound(true);
      }
    },
    [getItemBySku]
  );

  function handleManualSearch() {
    handleScanResult(manualSku);
  }

  function handleStockAction(type: "in" | "out") {
    if (!foundItem || !user) return;

    addTransaction({
      itemId: foundItem.id,
      itemName: foundItem.name,
      type,
      quantity: 1,
      date: new Date().toISOString(),
      performedBy: user.name,
      notes: "Quick scan action",
    });

    showNotification(
      `${type === "in" ? "Added" : "Removed"} 1× ${foundItem.name}`
    );
  }

  function handleOpenScanner() {
    window.open("https://backend-eaf7.onrender.com/", "_blank");
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
          Scan &amp; Lookup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan QR codes using your camera or search items by SKU.
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check className="h-4 w-4" />
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column — Camera Scanner */}
        <div className="space-y-6">
          <Card className="border border-border/60 shadow-none">
            <CardContent className="flex flex-col items-center px-6 py-10 sm:py-14">
              {/* Large phone/camera icon */}
              <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-sky-50 sm:h-36 sm:w-36">
                <Smartphone className="h-14 w-14 text-emerald-600 sm:h-20 sm:w-20" />
              </div>

              <h2 className="mb-2 text-lg font-medium text-foreground sm:text-xl">
                Scan using Camera
              </h2>
              <p className="mb-6 max-w-xs text-center text-sm text-muted-foreground">
                Open the scanner to scan QR codes or barcodes on inventory items using your device camera.
              </p>

              <Button
                size="lg"
                className="gap-2 text-base"
                onClick={handleOpenScanner}
              >
                <ScanLine className="h-5 w-5" />
                Open Scanner
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Manual SKU + Results */}
        <div className="space-y-4">
          {/* Manual SKU Entry */}
          <Card className="border border-border/60 shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Manual SKU Lookup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Enter an item SKU to look up its details and manage stock.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. ELEC-PCB-001"
                  value={manualSku}
                  onChange={(e) => setManualSku(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                />
                <Button onClick={handleManualSearch} className="gap-1.5">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Not Found */}
          {notFound && (
            <Card className="border-destructive/50 shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <X className="h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Item not found</p>
                  <p className="text-xs text-muted-foreground">
                    No item matches this SKU. Check the code and try again.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Found Item Panel */}
          {foundItem && (
            <Card className="border border-border/60 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{foundItem.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setFoundItem(null);
                      setManualSku("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    SKU
                  </div>
                  <span className="text-right font-mono text-xs">
                    {foundItem.sku}
                  </span>

                  <span className="text-muted-foreground">Quantity</span>
                  <span className="text-right font-medium">
                    {foundItem.quantity}
                  </span>

                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Location
                  </div>
                  <span className="text-right">{foundItem.location}</span>

                  <span className="text-muted-foreground">Unit Cost</span>
                  <span className="text-right">
                    {formatCurrency(foundItem.unitCost)}
                  </span>
                </div>

                {foundItem.quantity <= foundItem.reorderPoint && (
                  <Badge variant="warning" className="text-xs">
                    Low stock — reorder point: {foundItem.reorderPoint}
                  </Badge>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={() => handleStockAction("in")}
                  >
                    <Plus className="h-4 w-4" />
                    Stock In +1
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => handleStockAction("out")}
                    disabled={foundItem.quantity <= 0}
                  >
                    <Minus className="h-4 w-4" />
                    Stock Out -1
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
