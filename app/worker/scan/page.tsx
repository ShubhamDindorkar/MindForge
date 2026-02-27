"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import type { InventoryItem } from "@/_lib/types";

export default function ScanPage() {
  const { user } = useAuth();
  const { getItemBySku, addTransaction } = useInventory();

  const [manualSku, setManualSku] = useState("");
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const scannerRef = useRef<unknown>(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    let scanner: { clear: () => Promise<void> } | null = null;

    (async () => {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");

        const instance = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        instance.render(
          (decodedText: string) => {
            handleScanResult(decodedText);
          },
          () => {}
        );

        scanner = instance as unknown as { clear: () => Promise<void> };
        scannerRef.current = instance;
      } catch {
        setCameraError(true);
      }
    })();

    return () => {
      scanner?.clear().catch(() => {});
    };
  }, [handleScanResult]);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ScanLine className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-medium">QR Scanner</h1>
      </div>

      {/* Notification */}
      {notification && (
        <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          <Check className="h-4 w-4" />
          {notification}
        </div>
      )}

      {/* Scanner */}
      <Card>
        <CardContent className="p-3">
          {cameraError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <X className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Camera unavailable</p>
                <p className="text-xs text-muted-foreground">
                  Please allow camera access or use manual entry below
                </p>
              </div>
            </div>
          ) : (
            <div id="qr-reader" className="overflow-hidden rounded-md" />
          )}
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardContent className="p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Or enter SKU manually
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. ELEC-PCB-001"
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
            />
            <Button size="icon" onClick={handleManualSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Not Found */}
      {notFound && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 p-4">
            <X className="h-5 w-5 text-destructive" />
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
        <Card>
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
  );
}
