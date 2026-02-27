"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/_components/ui/card";
import { Button } from "@/_components/ui/button";
import { Badge } from "@/_components/ui/badge";
import { Slider } from "@/_components/ui/slider";
import { runScenarioPlanning, type ScenarioPlanningResponse } from "@/_lib/ai-service";
import { Target, TrendingUp, TrendingDown, Zap, RefreshCw, ArrowRight } from "lucide-react";

export default function ScenarioPlanningPage() {
  const [demandModifier, setDemandModifier] = useState(1.0);
  const [leadTimeModifier, setLeadTimeModifier] = useState(1.0);
  const [safetyStockModifier, setSafetyStockModifier] = useState(1.0);

  const [data, setData] = useState<ScenarioPlanningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScenario = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runScenarioPlanning({
        demand_modifier: demandModifier,
        lead_time_modifier: leadTimeModifier,
        safety_stock_modifier: safetyStockModifier,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run scenario");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDemandModifier(1.0);
    setLeadTimeModifier(1.0);
    setSafetyStockModifier(1.0);
    setData(null);
    setError(null);
  };

  const formatPercent = (val: number) => {
    const pct = (val - 1) * 100;
    const pctStr = pct.toFixed(0);
    return pctStr === "0" ? "No change" : `${pct > 0 ? "+" : ""}${pctStr}%`;
  };

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="w-8 h-8" />
          Scenario Planning
        </h1>
        <p className="text-muted-foreground mt-1">
          Run "what-if" scenarios to test inventory strategies
        </p>
      </div>

      {/* Controls */}
      <Card className="border-border bg-gradient-to-br from-gray-50 to-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-foreground" />
            Scenario Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Demand Modifier */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-medium">Demand Change</label>
              <span className="font-semibold text-foreground">{formatPercent(demandModifier)}</span>
            </div>
            <Slider
              value={[demandModifier]}
              onValueChange={([val]) => setDemandModifier(val)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>-50% (decrease)</span>
              <span>Baseline</span>
              <span>+100% (double)</span>
            </div>
          </div>

          {/* Lead Time Modifier */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-medium">Lead Time Change</label>
              <span className="font-semibold text-foreground">{formatPercent(leadTimeModifier)}</span>
            </div>
            <Slider
              value={[leadTimeModifier]}
              onValueChange={([val]) => setLeadTimeModifier(val)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>-50% (faster)</span>
              <span>Baseline</span>
              <span>+100% (slower)</span>
            </div>
          </div>

          {/* Safety Stock Modifier */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-medium">Safety Stock Change</label>
              <span className="font-semibold text-green-700">{formatPercent(safetyStockModifier)}</span>
            </div>
            <Slider
              value={[safetyStockModifier]}
              onValueChange={([val]) => setSafetyStockModifier(val)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>-50% (reduce buffer)</span>
              <span>Baseline</span>
              <span>+100% (extra buffer)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={runScenario} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Scenario...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Scenario
                </>
              )}
            </Button>
            <Button onClick={reset} variant="outline">
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Overall Impact */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-700">Overall Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700">
                    {data.overall_impact.stockouts_prevented}
                  </div>
                  <p className="text-sm text-green-600 mt-1">Stockouts Prevented</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-700">
                    {data.overall_impact.new_stockout_risks}
                  </div>
                  <p className="text-sm text-orange-600 mt-1">New Stockout Risks</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    ₹{data.overall_impact.capital_change.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Capital Change</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SKU-Level Results */}
          <Card>
            <CardHeader>
              <CardTitle>SKU-Level Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.skus.length === 0 ? (
                  <p className="text-muted-foreground italic">No SKU projections available</p>
                ) : (
                  data.skus.map((sku) => (
                    <div
                      key={sku.sku}
                      className="p-4 rounded-lg border bg-gradient-to-r from-slate-50 to-slate-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{sku.name}</h3>
                          <p className="text-sm text-muted-foreground">{sku.sku}</p>
                        </div>
                        <Badge
                          variant={
                            sku.impact === "positive"
                              ? "default"
                              : sku.impact === "negative"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {sku.impact === "positive" ? (
                            <>
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Improved
                            </>
                          ) : sku.impact === "negative" ? (
                            <>
                              <TrendingDown className="w-3 h-3 mr-1" />
                              Declined
                            </>
                          ) : (
                            "Neutral"
                          )}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Daily Demand</p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sku.current.avg_daily_demand.toFixed(1)}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="font-bold text-foreground">
                              {sku.projected.avg_daily_demand.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Days Until Stockout</p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sku.current.days_until_stockout}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="font-bold text-foreground">
                              {sku.projected.days_until_stockout}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Reorder Point</p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sku.current.reorder_point}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="font-bold text-green-700">
                              {sku.projected.reorder_point}
                            </span>
                          </div>
                        </div>
                      </div>

                      {sku.action_needed && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <span className="font-medium text-yellow-800">📋 Action: </span>
                          <span className="text-yellow-700">{sku.action_needed}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
