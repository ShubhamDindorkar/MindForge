"""
StockShiftAI Backend — RAG-powered inventory optimization.

Endpoints:
  GET  /api/health              — Health check
  GET  /api/insights            — Top AI recommendations across all SKUs
  GET  /api/forecast/<sku>      — Demand forecast for a specific SKU
  GET  /api/anomalies           — All detected anomalies
  POST /api/chat                — Natural language inventory Q&A

Powered by: Firebase Firestore + OpenRouter LLM
"""

import json
import math
import os
import time
from datetime import datetime
from threading import Lock

import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# ── App setup ────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

# ── Firebase init ────────────────────────────────────────────────────────────

key_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
if os.path.exists(key_path):
    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
else:
    db = None
    print("⚠️  serviceAccountKey.json not found — running without Firestore")

# ── OpenRouter client ────────────────────────────────────────────────────────

openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
)

MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")

# ── In-memory response cache (TTL = 5 minutes) ───────────────────────────────

_cache: dict = {}
_cache_lock = Lock()
CACHE_TTL = 300  # 5 minutes in seconds


def cache_get(key: str):
    with _cache_lock:
        entry = _cache.get(key)
        if entry and (time.time() - entry["ts"]) < CACHE_TTL:
            return entry["data"]
    return None


def cache_set(key: str, data):
    with _cache_lock:
        _cache[key] = {"data": data, "ts": time.time()}


def cache_bust(key: str):
    with _cache_lock:
        _cache.pop(key, None)


def _extract_json(raw: str) -> dict | None:
    """Try to parse JSON from LLM output that may contain markdown or extra text."""
    if not raw or not raw.strip():
        return None
    cleaned = raw.strip()
    # Remove markdown code fences
    if cleaned.startswith("```"):
        parts = cleaned.split("\n", 1)
        if len(parts) > 1:
            cleaned = parts[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()
    # Try direct parse first
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    # Try to extract first complete {...} object
    start = cleaned.find("{")
    if start == -1:
        return None
    depth = 0
    for i in range(start, len(cleaned)):
        if cleaned[i] == "{":
            depth += 1
        elif cleaned[i] == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(cleaned[start : i + 1])
                except json.JSONDecodeError:
                    return None
    return None


def get_all_sku_stats() -> list[dict]:
    """Fetch metadata + stats for every SKU from Firestore."""
    if not db:
        return _get_fallback_stats()

    docs = db.collection("inventory_history").stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        if data and "metadata" in data and "stats" in data:
            results.append({
                "sku": doc.id,
                **data["metadata"],
                **data["stats"],
            })
    return results


def get_sku_data(sku: str) -> dict | None:
    """Fetch full data for a single SKU."""
    if not db:
        return _get_fallback_sku(sku)

    doc = db.collection("inventory_history").document(sku).get()
    if not doc.exists:
        return None

    data = doc.to_dict()

    # Also fetch recent daily data (last 3 months)
    daily_docs = (
        db.collection("inventory_history")
        .document(sku)
        .collection("daily_data")
        .order_by("__name__", direction=firestore.Query.DESCENDING)
        .limit(3)
        .stream()
    )

    recent_daily = []
    for ddoc in daily_docs:
        records = ddoc.to_dict().get("records", [])
        recent_daily.extend(records)

    recent_daily.sort(key=lambda r: r["date"])

    return {
        "sku": sku,
        **data.get("metadata", {}),
        **data.get("stats", {}),
        "recent_daily": recent_daily[-90:],  # last 90 days
    }


# ── Fallback: use local JSON if Firestore is unavailable ────────────────────

_local_cache = None


def _load_local_data():
    global _local_cache
    if _local_cache is None:
        path = os.path.join(os.path.dirname(__file__), "data", "inventory_history.json")
        if os.path.exists(path):
            with open(path) as f:
                _local_cache = json.load(f)
        else:
            _local_cache = {}
    return _local_cache


def _get_fallback_stats() -> list[dict]:
    data = _load_local_data()
    results = []
    for sku, sku_data in data.items():
        results.append({
            "sku": sku,
            **sku_data.get("metadata", {}),
            **sku_data.get("stats", {}),
        })
    return results


def _get_fallback_sku(sku: str) -> dict | None:
    data = _load_local_data()
    if sku not in data:
        return None
    sku_data = data[sku]
    daily = sku_data.get("daily_data", [])
    return {
        "sku": sku,
        **sku_data.get("metadata", {}),
        **sku_data.get("stats", {}),
        "recent_daily": daily[-90:],
    }


# ── Helper: call LLM via OpenRouter ─────────────────────────────────────────


def call_llm(system_prompt: str, user_prompt: str) -> str:
    """Send a prompt to OpenRouter and return the response text."""
    try:
        response = openrouter_client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,  # Lower for faster, more deterministic responses
            max_tokens=1000,  # Reduced for speed
            timeout=25,  # 25 second timeout
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        print(f"LLM error: {e}")
        return ""


# ── Helper: build context prompt from stats ──────────────────────────────────

SYSTEM_PROMPT = """You are StockShiftAI, an expert inventory optimization assistant.
You analyze inventory data and provide actionable recommendations.

IMPORTANT RULES:
- Always respond in valid JSON format
- Be specific with numbers, dates, and quantities
- Consider lead times when making reorder recommendations
- Flag anomalies when demand deviates significantly from baseline
- Use seasonal patterns to improve forecast accuracy
- Calculate safety stock as: 1.65 × std_deviation × sqrt(lead_time_days)
- Urgency levels: "critical" (stockout in <3 days), "high" (<7 days), "medium" (<14 days), "low" (>14 days)
"""


def build_sku_context(sku_data: dict) -> str:
    """Build a text context string for a single SKU."""
    seasonal = sku_data.get("seasonal_factors", {})
    seasonal_str = ", ".join(
        f"Month {m}: {v:.2f}" for m, v in sorted(seasonal.items(), key=lambda x: int(x[0]))
    )

    return f"""
SKU: {sku_data.get('sku')}
Name: {sku_data.get('name')}
Category: {sku_data.get('category')}
Location: {sku_data.get('location')}
Unit Cost: ₹{sku_data.get('unit_cost', 0):.2f}
Sell Price: ₹{sku_data.get('sell_price', 0):.2f}
Lead Time: {sku_data.get('lead_time_days', 7)} days

Current Stock: {sku_data.get('current_stock', 0)} units
Days Until Stockout: {sku_data.get('days_until_stockout', 999)}

Avg Daily Demand (7d): {sku_data.get('avg_daily_demand_7d', 0):.1f}
Avg Daily Demand (30d): {sku_data.get('avg_daily_demand_30d', 0):.1f}
Avg Daily Demand (90d): {sku_data.get('avg_daily_demand_90d', 0):.1f}
Std Deviation (30d): {sku_data.get('std_deviation_30d', 0):.1f}
Trend Slope (90d): {sku_data.get('trend_slope_90d', 0):.4f} (positive = growing demand)
Year-over-Year Change: {sku_data.get('yoy_change_pct', 0):.1f}%

Seasonal Factors: {seasonal_str}
Recent Anomalies (30d): {sku_data.get('recent_anomaly_count', 0)}

Today's Date: {datetime.now().strftime('%Y-%m-%d')}
Current Month: {datetime.now().month}
""".strip()


def build_all_skus_context(all_stats: list[dict]) -> str:
    """Build a summary context for all SKUs."""
    lines = []
    for s in all_stats:
        urgency = "critical" if s.get("days_until_stockout", 999) < 3 else \
                  "high" if s.get("days_until_stockout", 999) < 7 else \
                  "medium" if s.get("days_until_stockout", 999) < 14 else "low"
        lines.append(
            f"- {s['sku']} ({s.get('name', '')}): "
            f"stock={s.get('current_stock', 0)}, "
            f"avg_demand_7d={s.get('avg_daily_demand_7d', 0):.1f}, "
            f"days_to_stockout={s.get('days_until_stockout', 999)}, "
            f"urgency={urgency}, "
            f"trend={s.get('trend_slope_90d', 0):.4f}, "
            f"yoy={s.get('yoy_change_pct', 0):.1f}%, "
            f"anomalies_30d={s.get('recent_anomaly_count', 0)}"
        )
    return "\n".join(lines)


# ── ROUTES ───────────────────────────────────────────────────────────────────


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "firestore": db is not None})


@app.route("/api/insights", methods=["GET"])
def insights():
    """Get top AI recommendations across all SKUs."""
    if request.args.get("refresh") != "1":
        cached = cache_get("insights")
        if cached:
            return jsonify(cached)

    all_stats = get_all_sku_stats()
    if not all_stats:
        return jsonify({"error": "No inventory data available"}), 404

    context = build_all_skus_context(all_stats)

    prompt = f"""Analyze this inventory data and return a JSON object with exactly this structure:

{{
  "recommendations": [
    {{
      "sku": "string",
      "item_name": "string",
      "type": "reorder | anomaly | overstock",
      "urgency": "critical | high | medium | low",
      "title": "short action title (max 10 words)",
      "description": "1-2 sentence explanation with specific numbers",
      "suggested_action": "specific action to take",
      "quantity": number_or_null,
      "confidence": 0.0_to_1.0
    }}
  ],
  "summary": "1 sentence overall inventory health summary"
}}

Return the top 5 most important recommendations sorted by urgency.
Only return valid JSON, no markdown.

INVENTORY DATA:
{context}"""

    raw = call_llm(SYSTEM_PROMPT, prompt)

    try:
        # Strip markdown code fences if present
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        cache_set("insights", parsed)
        return jsonify(parsed)
    except json.JSONDecodeError:
        return jsonify({
            "recommendations": [],
            "summary": "Unable to parse AI response",
            "raw": raw,
        })


@app.route("/api/forecast/<sku>", methods=["GET"])
def forecast(sku: str):
    """Get demand forecast for a specific SKU."""
    cache_key = f"forecast_{sku}"
    if request.args.get("refresh") != "1":
        cached = cache_get(cache_key)
        if cached:
            return jsonify(cached)

    sku_data = get_sku_data(sku)
    if not sku_data:
        return jsonify({"error": f"SKU {sku} not found"}), 404

    context = build_sku_context(sku_data)

    # Also include last 30 days of actual data for the chart
    recent = sku_data.get("recent_daily", [])[-30:]

    prompt = f"""Based on this inventory data, forecast demand for the next 14 days.

Return a JSON object with exactly this structure:

{{
  "sku": "{sku}",
  "item_name": "string",
  "forecast": [
    {{"date": "YYYY-MM-DD", "predicted_demand": number, "lower_bound": number, "upper_bound": number}}
  ],
  "reorder": {{
    "recommended": true_or_false,
    "quantity": number,
    "urgency": "critical | high | medium | low",
    "order_by_date": "YYYY-MM-DD or null",
    "reason": "1-2 sentence explanation"
  }},
  "anomaly": {{
    "detected": true_or_false,
    "type": "demand_spike | demand_drop | trend_change | none",
    "severity": "high | medium | low | none",
    "detail": "explanation or empty string"
  }},
  "trend_summary": "1 sentence about the demand trend",
  "safety_stock": number
}}

Only return valid JSON, no markdown.

SKU DATA:
{context}

LAST 30 DAYS ACTUAL DATA:
{json.dumps(recent[-30:], indent=2)}"""

    raw = call_llm(SYSTEM_PROMPT, prompt)

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)

        # Attach actual recent data for charting
        parsed["actual_data"] = recent
        cache_set(f"forecast_{sku}", parsed)
        return jsonify(parsed)
    except json.JSONDecodeError:
        return jsonify({
            "sku": sku,
            "forecast": [],
            "error": "Unable to parse AI response",
            "raw": raw,
        })


@app.route("/api/anomalies", methods=["GET"])
def anomalies():
    """Get all detected anomalies across SKUs."""
    if request.args.get("refresh") != "1":
        cached = cache_get("anomalies")
        if cached:
            return jsonify(cached)

    all_stats = get_all_sku_stats()
    if not all_stats:
        return jsonify({"error": "No inventory data available"}), 404

    context = build_all_skus_context(all_stats)

    prompt = f"""Analyze this inventory data for anomalies and unusual patterns.

Return a JSON object with exactly this structure:

{{
  "anomalies": [
    {{
      "sku": "string",
      "item_name": "string",
      "type": "demand_spike | demand_drop | trend_reversal | seasonal_deviation",
      "severity": "high | medium | low",
      "description": "specific explanation with numbers",
      "detected_date": "approximate YYYY-MM-DD",
      "recommendation": "what to do about it"
    }}
  ],
  "total_anomalies": number,
  "health_score": 0_to_100
}}

Only flag genuine anomalies — items where recent behavior significantly deviates from expected patterns.
Only return valid JSON, no markdown.

INVENTORY DATA:
{context}"""

    raw = call_llm(SYSTEM_PROMPT, prompt)

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        cache_set("anomalies", parsed)
        return jsonify(parsed)
    except json.JSONDecodeError:
        return jsonify({
            "anomalies": [],
            "total_anomalies": 0,
            "health_score": 50,
            "raw": raw,
        })


@app.route("/api/chat", methods=["POST"])
def chat():
    """Natural language Q&A about inventory."""
    body = request.get_json()
    question = body.get("question", "")
    if not question:
        return jsonify({"error": "No question provided"}), 400

    all_stats = get_all_sku_stats()
    context = build_all_skus_context(all_stats)

    prompt = f"""A user is asking about their inventory. Answer their question based on the data below.
Be specific, use actual numbers from the data, and provide actionable advice.

Respond in JSON format:
{{
  "answer": "your detailed answer here",
  "relevant_skus": ["list", "of", "mentioned", "skus"],
  "suggested_actions": ["action 1", "action 2"]
}}

Only return valid JSON, no markdown.

INVENTORY DATA:
{context}

USER QUESTION: {question}"""

    raw = call_llm(SYSTEM_PROMPT, prompt)

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        return jsonify(parsed)
    except json.JSONDecodeError:
        return jsonify({
            "answer": raw or "Unable to process your question.",
            "relevant_skus": [],
            "suggested_actions": [],
        })


@app.route("/api/cost-optimization", methods=["GET"])
def cost_optimization():
    """Calculate financial impact of current inventory state and AI recommendations."""
    if request.args.get("refresh") != "1":
        cached = cache_get("cost_optimization")
        if cached:
            return jsonify(cached)

    all_stats = get_all_sku_stats()
    
    context = build_all_skus_context(all_stats)
    
    prompt = f"""Analyze the inventory data and calculate the financial impact.

Calculate and return in JSON format ONLY (no markdown):
{{
  "total_capital_locked": <total value of current stock at unit_cost>,
  "overstock_capital": <value locked in overstock items (where current_stock > 90 days of avg_daily_demand_30d)>,
  "stockout_risk_cost": <estimated lost sales from items with days_until_stockout < 14 (qty_needed × sell_price)>,
  "holding_cost_monthly": <estimated monthly holding cost (2% of total inventory value as industry standard)>,
  "potential_savings": <sum of overstock_capital × 0.02 (monthly holding cost)>,
  "skus_overstock": [list of SKU codes that are overstocked],
  "skus_stockout_risk": [list of SKU codes at stockout risk],
  "recommendations": [
    {{
      "action": "description",
      "impact": "cost savings or revenue protection amount",
      "priority": "high|medium|low"
    }}
  ]
}}

INVENTORY DATA:
{context}"""

    raw = call_llm(SYSTEM_PROMPT, prompt)
    
    parsed = _extract_json(raw)
    if parsed:
        # Normalize keys for frontend (snake_case) and ensure lists exist
        total_capital = parsed.get("total_capital_locked")
        if total_capital is None:
            total_capital = sum(s.get("current_stock", 0) * s.get("unit_cost", 0) for s in all_stats)
        overstock = parsed.get("overstock_capital")
        if overstock is None:
            overstock = sum(
                s.get("current_stock", 0) * s.get("unit_cost", 0)
                for s in all_stats
                if s.get("current_stock", 0) > (s.get("avg_daily_demand_30d") or 1) * 90
            )
        result = {
            "total_capital_locked": round(float(total_capital or 0), 2),
            "overstock_capital": round(float(overstock or 0), 2),
            "stockout_risk_cost": round(float(parsed.get("stockout_risk_cost", 0) or 0), 2),
            "holding_cost_monthly": round(float(parsed.get("holding_cost_monthly") or (float(total_capital or 0) * 0.02)), 2),
            "potential_savings": round(float(parsed.get("potential_savings", 0) or 0), 2),
            "skus_overstock": list(parsed.get("skus_overstock") or []),
            "skus_stockout_risk": list(parsed.get("skus_stockout_risk") or []),
            "recommendations": list(parsed.get("recommendations") or []),
        }
        # Ensure each recommendation has action, impact, priority
        for rec in result["recommendations"]:
            if not isinstance(rec, dict):
                continue
            rec.setdefault("action", "")
            rec.setdefault("impact", "")
            rec.setdefault("priority", "medium")
        cache_set("cost_optimization", result)
        return jsonify(result)
    
    # Fallback when LLM response could not be parsed
    total_capital = sum(s.get("current_stock", 0) * s.get("unit_cost", 0) for s in all_stats)
    overstock = sum(
        s.get("current_stock", 0) * s.get("unit_cost", 0)
        for s in all_stats
        if s.get("current_stock", 0) > (s.get("avg_daily_demand_30d") or 1) * 90
    )
    return jsonify({
        "total_capital_locked": round(total_capital, 2),
        "overstock_capital": round(overstock, 2),
        "stockout_risk_cost": 0,
        "holding_cost_monthly": round(total_capital * 0.02, 2),
        "potential_savings": round(overstock * 0.02, 2),
        "skus_overstock": [],
        "skus_stockout_risk": [],
        "recommendations": []
    })


@app.route("/api/scenario-planning", methods=["POST"])
def scenario_planning():
    """Run 'what-if' scenarios on inventory parameters."""
    body = request.get_json()
    
    demand_modifier = body.get("demand_modifier", 1.0)  # e.g., 1.3 = 30% increase
    lead_time_modifier = body.get("lead_time_modifier", 1.0)
    safety_stock_modifier = body.get("safety_stock_modifier", 1.0)
    
    all_stats = get_all_sku_stats()
    context = build_all_skus_context(all_stats)
    
    prompt = f"""Run a scenario analysis with these parameters:
- Demand modifier: {demand_modifier}x (1.0 = no change, 1.3 = 30% increase)
- Lead time modifier: {lead_time_modifier}x
- Safety stock modifier: {safety_stock_modifier}x

For each SKU, calculate:
1. New projected demand
2. New days_until_stockout
3. New reorder point
4. Comparison vs current state

Return ONLY valid JSON (no markdown):
{{
  "scenario_summary": {{
    "demand_change_pct": <percentage>,
    "lead_time_change_pct": <percentage>,
    "safety_stock_change_pct": <percentage>
  }},
  "skus": [
    {{
      "sku": "SKU-CODE",
      "name": "Item name",
      "current": {{
        "avg_daily_demand": <number>,
        "days_until_stockout": <number>,
        "reorder_point": <number>
      }},
      "projected": {{
        "avg_daily_demand": <number>,
        "days_until_stockout": <number>,
        "reorder_point": <number>
      }},
      "impact": "positive|negative|neutral",
      "action_needed": "description"
    }}
  ],
  "overall_impact": {{
    "stockouts_prevented": <count>,
    "new_stockout_risks": <count>,
    "capital_change": <dollar amount>
  }}
}}

CURRENT INVENTORY DATA:
{context}"""

    raw = call_llm(SYSTEM_PROMPT, prompt)
    
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        return jsonify(parsed)
    except json.JSONDecodeError:
        return jsonify({
            "scenario_summary": {
                "demand_change_pct": (demand_modifier - 1) * 100,
                "lead_time_change_pct": (lead_time_modifier - 1) * 100,
                "safety_stock_change_pct": (safety_stock_modifier - 1) * 100
            },
            "skus": [],
            "overall_impact": {
                "stockouts_prevented": 0,
                "new_stockout_risks": 0,
                "capital_change": 0
            }
        })


@app.route("/api/warehouse-optimization", methods=["GET"])
def warehouse_optimization():
    """Detect stock imbalances across warehouses and recommend transfers."""
    if request.args.get("refresh") != "1":
        cached = cache_get("warehouse_optimization")
        if cached:
            return jsonify(cached)

    all_stats = get_all_sku_stats()
    
    # Group by location
    by_location = {}
    for s in all_stats:
        loc = s.get("location", "Unknown")
        if loc not in by_location:
            by_location[loc] = []
        by_location[loc].append(s)
    
    context = build_all_skus_context(all_stats)
    location_summary = "\n".join([
        f"{loc}: {len(items)} SKUs, total stock value: ₹{sum(i.get('current_stock', 0) * i.get('unit_cost', 0) for i in items):.2f}"
        for loc, items in by_location.items()
    ])
    
    prompt = f"""Analyze inventory distribution across warehouses and recommend transfers.

WAREHOUSE SUMMARY:
{location_summary}

DETAILED INVENTORY DATA:
{context}

Identify:
1. SKUs with stock imbalance (overstock in one location, stockout risk in another)
2. Recommended inter-warehouse transfers
3. Cost-benefit analysis of transfers vs stockouts

Return ONLY valid JSON (no markdown):
{{
  "warehouses": [
    {{
      "location": "Warehouse Name",
      "total_skus": <count>,
      "total_value": <dollar amount>,
      "overstock_items": <count>,
      "stockout_risk_items": <count>
    }}
  ],
  "transfer_recommendations": [
    {{
      "sku": "SKU-CODE",
      "name": "Item name",
      "from_location": "source warehouse",
      "to_location": "destination warehouse",
      "qty_to_transfer": <number>,
      "reason": "explanation",
      "transfer_cost_estimate": <dollar amount>,
      "stockout_cost_prevented": <dollar amount>,
      "net_benefit": <dollar amount>,
      "priority": "high|medium|low"
    }}
  ],
  "network_health_score": <0-100, where 100=perfect balance>,
  "total_transfer_savings": <total net benefit of all transfers>
}}"""

    raw = call_llm(SYSTEM_PROMPT, prompt)
    
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        cache_set("warehouse_optimization", parsed)
        return jsonify(parsed)
    except json.JSONDecodeError:
        return jsonify({
            "warehouses": [
                {
                    "location": loc,
                    "total_skus": len(items),
                    "total_value": sum(i.get("current_stock", 0) * i.get("unit_cost", 0) for i in items),
                    "overstock_items": 0,
                    "stockout_risk_items": 0
                }
                for loc, items in by_location.items()
            ],
            "transfer_recommendations": [],
            "network_health_score": 50,
            "total_transfer_savings": 0
        })


@app.route("/api/cache/clear", methods=["POST"])
def clear_cache():
    """Bust all cached responses so next request fetches fresh AI data."""
    with _cache_lock:
        _cache.clear()
    return jsonify({"status": "cleared"})


# ── Cache warmup on startup ───────────────────────────────────────────────────

def _warmup_cache():
    """Pre-fetch AI data into cache on server start so first page load is fast."""
    import threading
    import urllib.request

    def _run():
        import time as _t
        _t.sleep(4)  # Wait for Flask to finish binding
        port = int(os.getenv("PORT", 5001))
        base = f"http://127.0.0.1:{port}"
        endpoints = ["/api/insights", "/api/anomalies", "/api/cost-optimization", "/api/warehouse-optimization"]
        for ep in endpoints:
            try:
                urllib.request.urlopen(f"{base}{ep}?refresh=0", timeout=30)
                print(f"✅ Warmed cache: {ep}")
            except Exception as e:
                print(f"⚠️  Cache warmup failed for {ep}: {e}")

    t = threading.Thread(target=_run, daemon=True)
    t.start()


# ── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    _warmup_cache()
    app.run(host="0.0.0.0", port=port, debug=True)
