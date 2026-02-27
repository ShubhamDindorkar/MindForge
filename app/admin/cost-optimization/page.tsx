"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/_components/ui/card";
import { Button } from "@/_components/ui/button";
import { Badge } from "@/_components/ui/badge";
import { getCostOptimization, type CostOptimizationResponse } from "@/_lib/ai-service";
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";

export default function CostOptimizationPage() {
  const [data, setData] = useState<CostOptimizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCostOptimization();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cost optimization data");
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
          <span>Analyzing financial impact...</span>
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
            <DollarSign className="w-8 h-8" />
            Cost Optimization Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Financial impact analysis powered by AI
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Capital Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(data.total_capital_locked)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current inventory value</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Overstock Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(data.overstock_capital)}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {data.skus_overstock.length} items overstocked
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Stockout Risk Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(data.stockout_risk_cost)}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {data.skus_stockout_risk.length} items at risk
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Potential Monthly Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(data.potential_savings)}
            </div>
            <p className="text-xs text-green-600 mt-1">By optimizing stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Holding Cost */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-foreground" />
            Monthly Holding Cost Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Monthly Holding Cost (2% of inventory)</span>
              <span className="font-semibold">{formatCurrency(data.holding_cost_monthly)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Annualized Holding Cost</span>
              <span className="font-semibold text-orange-700">{formatCurrency(data.holding_cost_monthly * 12)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Potential Annual Savings</span>
              <span className="font-bold text-green-700 text-lg">{formatCurrency(data.potential_savings * 12)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-foreground" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recommendations.length === 0 &&
          data.skus_overstock.length === 0 &&
          data.skus_stockout_risk.length === 0 ? (
            <p className="text-muted-foreground italic">
              No specific recommendations right now. Your inventory levels look within normal range.
              Try &quot;Refresh&quot; for a fresh AI analysis or check back after inventory changes.
            </p>
          ) : data.recommendations.length === 0 ? (
            <p className="text-muted-foreground italic">No recommendations at this time.</p>
          ) : (
            <div className="space-y-3">
              {data.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-slate-50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            rec.priority === "high"
                              ? "destructive"
                              : rec.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {rec.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{rec.action}</p>
                      <p className="text-sm text-green-700 font-semibold">💰 Impact: {rec.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overstock & Stockout Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-700">Overstocked Items</CardTitle>
          </CardHeader>
          <CardContent>
            {data.skus_overstock.length === 0 ? (
              <p className="text-muted-foreground italic">No overstocked items</p>
            ) : (
              <ul className="space-y-2">
                {data.skus_overstock.map((sku) => (
                  <li key={sku} className="text-sm bg-orange-50 px-3 py-2 rounded border border-orange-200">
                    {sku}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Stockout Risk Items</CardTitle>
          </CardHeader>
          <CardContent>
            {data.skus_stockout_risk.length === 0 ? (
              <p className="text-muted-foreground italic">No stockout risks</p>
            ) : (
              <ul className="space-y-2">
                {data.skus_stockout_risk.map((sku) => (
                  <li key={sku} className="text-sm bg-red-50 px-3 py-2 rounded border border-red-200">
                    {sku}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
