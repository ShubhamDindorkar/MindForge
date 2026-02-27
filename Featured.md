# StockShiftAI (MindForge) — AI/ML Architecture & Implementation

---

## LLM Provider

- **Model**: Google Gemini 2.0 Flash (`google/gemini-2.0-flash-001`) via **OpenRouter**
- **Client**: Python `openai` SDK with `base_url` set to `https://openrouter.ai/api/v1` — see `backend/app.py`
- **Config**: temperature `0.1`, max tokens `1000`, 25s timeout per call

---

## RAG Pattern (Structured Data RAG)

This project uses a **structured-data RAG** approach — **no embeddings, no vector database, no semantic search**.

| RAG Stage | How it works |
|---|---|
| **Retrieval** | Firestore queries fetch inventory/SKU data (falls back to local JSON `inventory_history.json`) |
| **Augmentation** | `build_sku_context()` / `build_all_skus_context()` serialize inventory stats (quantities, costs, demand, lead times) into plain-text strings injected into the prompt |
| **Generation** | `call_llm(system_prompt, user_prompt)` sends the data-augmented prompt to Gemini via OpenRouter, requesting structured JSON output |

Every LLM endpoint follows this exact 3-step flow.

---

## Backend AI Endpoints (`backend/app.py`)

| Endpoint | Method | What it does |
|---|---|---|
| `/api/insights` | GET | Top 5 AI recommendations across all SKUs |
| `/api/forecast/<sku>` | GET/POST | 14-day demand forecast for a single SKU (POST sends item data for unknown SKUs) |
| `/api/anomalies` | GET | Detect anomalies across all SKUs with severity + health score |
| `/api/chat` | POST | Natural language Q&A — all SKU context + user question → freeform answer |
| `/api/cost-optimization` | GET | Capital locked, overstock, stockout risk, holding cost analysis |
| `/api/scenario-planning` | POST | What-if analysis with demand/lead-time/safety-stock modifiers |
| `/api/warehouse-optimization` | GET | Inter-warehouse transfer recommendations with cost-benefit |

All responses are cached in-memory with a **5-minute TTL**. Cache warmup runs on startup for insights, anomalies, cost-optimization, and warehouse-optimization.

---

## Frontend Service Layer (`app/_lib/ai-service.ts`)

All calls go through `apiFetch()` which hits `NEXT_PUBLIC_AI_BACKEND_URL` (default `http://localhost:5001`):

| Function | Backend Endpoint | Called by |
|---|---|---|
| `getInsights()` | `GET /api/insights` | Dashboard, Inventory |
| `getForecast(sku, item?)` | `GET/POST /api/forecast/<sku>` | Reports |
| `getAnomalies()` | `GET /api/anomalies` | Reports |
| `askChat(question)` | `POST /api/chat` | Available (not wired to a page currently) |
| `getCostOptimization()` | `GET /api/cost-optimization` | Cost Optimization |
| `runScenarioPlanning(params)` | `POST /api/scenario-planning` | Scenario Planning |
| `getWarehouseOptimization()` | `GET /api/warehouse-optimization` | Warehouse Optimization |

---

## Which Pages Use Which AI

| Page | AI function(s) |
|---|---|
| `admin/dashboard/page.tsx` | `getInsights()` — AI recommendation cards |
| `admin/inventory/page.tsx` | `getInsights()` — per-item AI recommendations |
| `admin/reports/page.tsx` | `getForecast()` + `getAnomalies()` — demand charts & anomaly detection |
| `admin/cost-optimization/page.tsx` | `getCostOptimization()` — capital & cost analysis |
| `admin/scenario-planning/page.tsx` | `runScenarioPlanning()` — what-if simulator |
| `admin/warehouse-optimization/page.tsx` | `getWarehouseOptimization()` — transfer suggestions |

---

## Non-LLM "AI" Analytics

`app/_lib/ai-finance.ts` contains `generateAiLikeRecommendations()` — a **purely algorithmic** function (no LLM) that calculates demand projections, seasonal multipliers, and stock recommendations. It's served by the Next.js route `app/api/finance/recommendations/route.ts`.

The other Next.js API routes under `app/api/finance/` (analysis, costs, forecast) are also purely data-serving with no LLM involvement.

---

## What's NOT in the system

- **No embeddings or vector DB** (no Pinecone, ChromaDB, FAISS)
- **No document chunking or semantic retrieval** — all data is structured Firestore records
- **No fine-tuning** — uses Gemini Flash off-the-shelf
- **No streaming** — all LLM calls are synchronous
- **No multi-turn memory** — each call re-injects full context (stateless)

---

## Problem Statement

**Inefficient Inventory Planning and Stock Imbalance Across Supply Chains**

Retailers, warehouses, manufacturers, and small-to-medium enterprises frequently face challenges in maintaining optimal inventory levels. Overstocking leads to increased holding costs, spoilage, and capital lock-in, while understocking results in lost sales, customer dissatisfaction, and supply disruptions.

Inventory decisions are often based on static forecasting models, manual estimation, or historical averages that fail to adapt to:

- Seasonal demand variability
- Sudden demand spikes or supply disruptions
- Regional consumption patterns
- Perishable inventory constraints
- Multi-warehouse distribution complexities

**Challenge:** Design a scalable and intelligent inventory optimization framework that dynamically balances supply and demand, minimizes stockouts and overstocking, and improves overall supply chain efficiency under real-world uncertainty.

---

## AI/ML Features

### 1. Demand Forecasting Model (Highest Impact)

- Time-series forecasting (Prophet / LSTM / XGBoost) that predicts demand per SKU for the next 7/14/30 days
- Factors in: **seasonality**, **day-of-week patterns**, **trend**, and **historical sales velocity**
- Show a forecast chart on the admin dashboard: "Predicted demand vs current stock"
- **Directly solves:** *"static forecasting models that fail to adapt to seasonal demand variability"*

### 2. Smart Reorder Recommendations

- Instead of a fixed reorder point, the AI calculates **dynamic reorder points** based on predicted demand + lead time + safety stock formula
- Admin sees: "AI recommends reordering 50 units of PCB-001 within 3 days" with a confidence score
- Flags items at risk of **stockout** (demand > supply trajectory) or **overstock** (supply far exceeds predicted demand)
- **Directly solves:** *"minimizes stockouts and overstocking"*

### 3. Anomaly Detection for Demand Spikes

- Flag unusual consumption patterns in real-time (e.g., a SKU moving 3x faster than normal)
- Alert: "Unusual demand spike detected for Item X — 240% above baseline"
- **Directly solves:** *"sudden demand spikes or supply disruptions"*

---

## Priority Matrix

| Feature                | Effort                  | Wow Factor | Problem Fit |
| ---------------------- | ----------------------- | ---------- | ----------- |
| Demand Forecasting     | Medium                  | Very High  | Direct hit  |
| Smart Reorder Alerts   | Low (builds on forecast)| High       | Direct hit  |
| Anomaly Detection      | Low                     | Medium     | Direct hit  |

---

## Implementation Plan

### Backend (Python — `backend/app.py`)

- `/api/forecast/{sku}` — Forecasting endpoint using Prophet or scikit-learn (even simple linear regression on mock historical data works for demo)
- `/api/recommendations` — Returns dynamic reorder suggestions per SKU
- `/api/anomalies` — Flags items with unusual movement patterns

### Frontend (Admin Dashboard — Next.js)

- **Forecast tab/card** — Predicted demand curves using Recharts line chart
- **Smart Alerts panel** — AI-generated reorder recommendations with confidence scores
- **Anomaly badge** — Visual flag on items with unusual movement

---

## Key Selling Point

> "Our system doesn't just *record* inventory — it *predicts* what you'll need and *tells* you when to act, dynamically adapting to demand patterns."
