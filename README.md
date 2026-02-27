# MindForge (StockShiftAI)

**Intelligent inventory optimization** — demand forecasting, reorder recommendations, anomaly detection, and multi-warehouse planning, powered by AI and your data.

---

## Features (What We're Implementing)

### Core product

- **Landing & auth** — Marketing landing page; login with email/password or Google (Firebase Auth). Admin area is role-protected (`role === "admin"`).
- **Admin dashboard** — Overview of inventory health, key metrics, and quick links to inventory, finance, and AI tools.
- **Inventory management** — Full CRUD for items (name, SKU, category, location, cost, sell price, reorder point, quantity). Record **in/out transactions**; quantities update automatically. Data persists in **localStorage** (no backend required for basic use).
- **Finance** — Revenue, costs, P&L, category breakdown, and forecast series. Served by Next.js API routes from mock/finance data. **AI-style reorder recommendations** (30/60/90 day horizon) from in-app logic using transaction history and a simple seasonal heuristic.
- **Reports** — Reporting views over inventory and financial data.
- **Settings** — App/settings configuration.

### AI & optimization (backend + frontend)

- **Demand forecasting** — Per-SKU forecast for the next 14 days (predicted demand, bounds, reorder suggestion, safety stock). Uses **Flask backend + OpenRouter LLM** when backend is configured; can fall back to frontend item data for SKUs not in backend.
- **Smart reorder recommendations** — Top recommendations across all SKUs (reorder / anomaly / overstock) with urgency and confidence. From backend `/api/insights` (LLM + Firestore or local JSON).
- **Anomaly detection** — Flags demand spikes, drops, trend reversals, seasonal deviations. Backend `/api/anomalies` returns list + health score.
- **Natural language Q&A** — Ask questions about inventory in plain language. Backend `/api/chat` answers using current inventory context.
- **Cost optimization** — Capital locked, overstock/stockout risk cost, holding cost, potential savings, and prioritized recommendations. Backend `/api/cost-optimization`.
- **Scenario planning** — “What-if” on demand, lead time, and safety-stock modifiers. Backend `/api/scenario-planning` (POST) returns current vs projected metrics per SKU and overall impact.
- **Warehouse optimization** — Stock imbalance across locations; inter-warehouse **transfer recommendations** with cost/benefit. Backend `/api/warehouse-optimization`.

### Data & infra

- **Backend** — Flask app (Firebase Admin optional). Uses **OpenRouter** (e.g. Gemini) for all AI endpoints. **In-memory cache** (5 min TTL) for insights, anomalies, cost optimization, warehouse optimization, and per-SKU forecast; optional **cache warmup** on server start.
- **Historical data** — Scripts generate and seed data:
  - **`backend/generate_data.py`** — Builds `backend/data/inventory_history.json` (3 years, daily data) with seasonality, weekly cycles, trends, and anomaly spikes.
  - **`backend/seed_firestore.py`** — Seeds Firestore from that JSON (requires `serviceAccountKey.json`). Backend can run without Firestore using the same JSON as fallback.

---

## How It’s Automated

### Frontend (Next.js)

- **Inventory** — Add/update/delete items and add in/out transactions; state is kept in React context and **automatically persisted to localStorage** on every change. Quantity updates from transactions are applied immediately in memory and then saved.
- **Finance recommendations** — When you request recommendations (e.g. 30/60/90 day), the app **automatically** computes them from current inventory + transaction history using a seasonal heuristic (e.g. December/Q4 multipliers) and returns them via `/api/finance/recommendations`; no manual step.
- **Finance analytics** — Forecast, P&L, category revenue, and costs are served by Next.js API routes that **automatically** aggregate from the finance/mock data layer.

### Backend (Flask)

- **AI responses** — All AI endpoints (insights, forecast, anomalies, chat, cost optimization, scenario planning, warehouse optimization) are **automated**: the backend builds a context from Firestore or local JSON, sends it to the LLM, parses JSON from the response, and returns it. No manual analysis.
- **Caching** — Responses for insights, anomalies, cost optimization, warehouse optimization, and per-SKU forecast are **automatically cached** for 5 minutes. Repeat requests within that window are served from cache. Use `?refresh=1` to force a fresh LLM call, or `POST /api/cache/clear` to clear all cache.
- **Cache warmup** — On server start, a background thread **automatically** hits the main AI endpoints once so the first user load can be fast (optional, in-code).
- **Fallbacks** — If Firestore is not configured, the backend **automatically** uses `backend/data/inventory_history.json`. If a forecast is requested for a SKU not in backend, the frontend can send item details in the POST body and the backend **automatically** builds a synthetic context for the LLM.

### Data pipeline (manual one-time or as-needed)

- **Generate history** — Run `python backend/generate_data.py` to (re)create `inventory_history.json` with seasonal/weekly/trend/anomaly patterns. Not scheduled; run when you want to refresh or extend data.
- **Seed Firestore** — Run `python backend/seed_firestore.py` after generating data and after placing `serviceAccountKey.json` in `backend/`. Not scheduled; run when you want to sync generated data to Firestore.

There are **no cron jobs, no background workers, and no CI/CD pipelines** in the repo. Automation is “on request” (user or API call) plus in-memory caching and localStorage persistence.

---

## Tech stack

| Layer        | Tech |
|-------------|------|
| Frontend    | Next.js 14 (App Router), React 18, TypeScript, Tailwind, shadcn/ui, Motion, Lenis, Recharts |
| Auth        | Firebase Auth (Google + email/password); role in localStorage |
| Frontend data | localStorage (inventory + transactions); mock data + finance-analytics for finance |
| Backend     | Flask 3, Flask-CORS, Gunicorn |
| AI          | OpenRouter (e.g. `google/gemini-2.0-flash-001`) |
| Backend data| Firebase Firestore (optional) or `backend/data/inventory_history.json` |

---

## Quick start

1. **Frontend** — `npm install` then `npm run dev`. Open `/login` then go to `/admin/dashboard`.
2. **Backend** — `cd backend`, `pip install -r requirements.txt`, set `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`). Place `serviceAccountKey.json` in `backend/` for Firestore, or rely on `data/inventory_history.json` (run `generate_data.py` if missing). Run `python app.py` (default port 5000; frontend expects `NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:5001` for port 5001).
3. **Data** — Optional: `python backend/generate_data.py` then `python backend/seed_firestore.py` to populate Firestore.

---

## Summary

MindForge delivers **demand forecasting**, **smart reorder and anomaly alerts**, **cost and warehouse optimization**, and **scenario planning** by automating LLM-based analysis over your inventory data. The frontend automates persistence (localStorage) and in-app recommendations; the backend automates AI answers and response caching. Historical data is generated and seeded via two manual scripts; there is no scheduled batch or worker automation.
