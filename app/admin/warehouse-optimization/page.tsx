"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/_components/ui/card";
import { Button } from "@/_components/ui/button";
import { Badge } from "@/_components/ui/badge";
import { getWarehouseOptimization, type WarehouseOptimizationResponse } from "@/_lib/ai-service";
import { Warehouse, ArrowRight, TrendingUp, AlertTriangle, RefreshCw, Building2 } from "lucide-react";

export default function WarehouseOptimizationPage() {
  const [data, setData] = useState<WarehouseOptimizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWarehouseOptimization();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load warehouse optimization data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-lg">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Analyzing warehouse network...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error || "No data available"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (val: number) => `₹${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Warehouse className="w-8 h-8" />
            Multi-Warehouse Optimization
          </h1>
          <p className="text-muted-foreground mt-1">
            Balance stock across locations to minimize costs
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Network Health Score */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Network Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-bold text-purple-700">
              {data.network_health_score}
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${data.network_health_score}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {data.network_health_score >= 80
                  ? "Excellent balance across network"
                  : data.network_health_score >= 60
                  ? "Good, minor optimizations possible"
                  : data.network_health_score >= 40
                  ? "Fair, several improvements recommended"
                  : "Poor balance, significant optimization needed"}
              </p>
            </div>
          </div>
          {data.total_transfer_savings > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-700">
                💰 Potential savings from recommended transfers: {formatCurrency(data.total_transfer_savings)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warehouse Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Warehouse Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.warehouses.map((wh) => (
            <Card key={wh.location} className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{wh.location}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total SKUs:</span>
                  <span className="font-semibold">{wh.total_skus}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="font-semibold">{formatCurrency(wh.total_value)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overstock:</span>
                  <span className="font-semibold text-orange-700">{wh.overstock_items}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stockout Risk:</span>
                  <span className="font-semibold text-red-700">{wh.stockout_risk_items}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transfer Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            Transfer Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.transfer_recommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground italic">
                ✅ No transfers needed at this time. Your network is well-balanced!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.transfer_recommendations.map((transfer, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-cyan-50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        {transfer.name}
                        <span className="text-sm text-muted-foreground">({transfer.sku})</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span className="font-medium">{transfer.from_location}</span>
                        <ArrowRight className="w-4 h-4" />
                        <span className="font-medium">{transfer.to_location}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        transfer.priority === "high"
                          ? "destructive"
                          : transfer.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {transfer.priority.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Transfer Quantity</p>
                      <p className="font-semibold text-lg">{transfer.qty_to_transfer} units</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Net Benefit</p>
                      <p className="font-semibold text-lg text-green-700">
                        {formatCurrency(transfer.net_benefit)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex justify-between p-2 bg-orange-50 rounded">
                      <span className="text-muted-foreground">Transfer Cost:</span>
                      <span className="font-medium text-orange-700">
                        {formatCurrency(transfer.transfer_cost_estimate)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-50 rounded">
                      <span className="text-muted-foreground">Stockout Cost Prevented:</span>
                      <span className="font-medium text-green-700">
                        {formatCurrency(transfer.stockout_cost_prevented)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm">
                      <span className="font-medium text-blue-800">💡 Reason: </span>
                      <span className="text-blue-700">{transfer.reason}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
