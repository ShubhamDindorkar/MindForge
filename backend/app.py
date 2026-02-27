"""
MindForge AI Backend — RAG-powered inventory optimization.

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
from datetime import datetime

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

# ── Helper: fetch all SKU stats from Firestore ──────────────────────────────


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
            temperature=0.3,
            max_tokens=2000,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        print(f"LLM error: {e}")
        return ""


# ── Helper: build context prompt from stats ──────────────────────────────────

SYSTEM_PROMPT = """You are MindForge AI, an expert inventory optimization assistant.
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
Unit Cost: ${sku_data.get('unit_cost', 0):.2f}
Sell Price: ${sku_data.get('sell_price', 0):.2f}
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


# ── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
