/**
 * MindForge AI Service — Frontend API layer for the Flask RAG backend.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL || "http://localhost:5001";

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface AIRecommendation {
  sku: string;
  item_name: string;
  type: "reorder" | "anomaly" | "overstock";
  urgency: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  suggested_action: string;
  quantity: number | null;
  confidence: number;
}

export interface InsightsResponse {
  recommendations: AIRecommendation[];
  summary: string;
}

export interface ForecastDay {
  date: string;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
}

export interface ActualDay {
  date: string;
  demand: number;
  stock_level: number;
}

export interface ForecastResponse {
  sku: string;
  item_name: string;
  forecast: ForecastDay[];
  actual_data: ActualDay[];
  reorder: {
    recommended: boolean;
    quantity: number;
    urgency: string;
    order_by_date: string | null;
    reason: string;
  };
  anomaly: {
    detected: boolean;
    type: string;
    severity: string;
    detail: string;
  };
  trend_summary: string;
  safety_stock: number;
}

export interface AnomalyItem {
  sku: string;
  item_name: string;
  type: string;
  severity: "high" | "medium" | "low";
  description: string;
  detected_date: string;
  recommendation: string;
}

export interface AnomaliesResponse {
  anomalies: AnomalyItem[];
  total_anomalies: number;
  health_score: number;
}

export interface ChatResponse {
  answer: string;
  relevant_skus: string[];
  suggested_actions: string[];
}

export interface CostOptimizationResponse {
  total_capital_locked: number;
  overstock_capital: number;
  stockout_risk_cost: number;
  holding_cost_monthly: number;
  potential_savings: number;
  skus_overstock: string[];
  skus_stockout_risk: string[];
  recommendations: Array<{
    action: string;
    impact: string;
    priority: "high" | "medium" | "low";
  }>;
}

export interface ScenarioSKU {
  sku: string;
  name: string;
  current: {
    avg_daily_demand: number;
    days_until_stockout: number;
    reorder_point: number;
  };
  projected: {
    avg_daily_demand: number;
    days_until_stockout: number;
    reorder_point: number;
  };
  impact: "positive" | "negative" | "neutral";
  action_needed: string;
}

export interface ScenarioPlanningResponse {
  scenario_summary: {
    demand_change_pct: number;
    lead_time_change_pct: number;
    safety_stock_change_pct: number;
  };
  skus: ScenarioSKU[];
  overall_impact: {
    stockouts_prevented: number;
    new_stockout_risks: number;
    capital_change: number;
  };
}

export interface WarehouseInfo {
  location: string;
  total_skus: number;
  total_value: number;
  overstock_items: number;
  stockout_risk_items: number;
}

export interface TransferRecommendation {
  sku: string;
  name: string;
  from_location: string;
  to_location: string;
  qty_to_transfer: number;
  reason: string;
  transfer_cost_estimate: number;
  stockout_cost_prevented: number;
  net_benefit: number;
  priority: "high" | "medium" | "low";
}

export interface WarehouseOptimizationResponse {
  warehouses: WarehouseInfo[];
  transfer_recommendations: TransferRecommendation[];
  network_health_score: number;
  total_transfer_savings: number;
}

/* ── API calls ────────────────────────────────────────────────────────────── */

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`AI API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Get top AI recommendations across all SKUs. */
export function getInsights(): Promise<InsightsResponse> {
  return apiFetch<InsightsResponse>("/api/insights");
}

/** Get demand forecast for a specific SKU. */
export function getForecast(sku: string): Promise<ForecastResponse> {
  return apiFetch<ForecastResponse>(`/api/forecast/${encodeURIComponent(sku)}`);
}

/** Get all detected anomalies. */
export function getAnomalies(): Promise<AnomaliesResponse> {
  return apiFetch<AnomaliesResponse>("/api/anomalies");
}

/** Ask a natural language question about inventory. */
export function askChat(question: string): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

/** Health check. */
export function healthCheck(): Promise<{ status: string; firestore: boolean }> {
  return apiFetch("/api/health");
}

/** Get cost optimization analysis. */
export function getCostOptimization(): Promise<CostOptimizationResponse> {
  return apiFetch<CostOptimizationResponse>("/api/cost-optimization");
}

/** Run scenario planning analysis. */
export function runScenarioPlanning(params: {
  demand_modifier: number;
  lead_time_modifier: number;
  safety_stock_modifier: number;
}): Promise<ScenarioPlanningResponse> {
  return apiFetch<ScenarioPlanningResponse>("/api/scenario-planning", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** Get warehouse optimization recommendations. */
export function getWarehouseOptimization(): Promise<WarehouseOptimizationResponse> {
  return apiFetch<WarehouseOptimizationResponse>("/api/warehouse-optimization");
}
