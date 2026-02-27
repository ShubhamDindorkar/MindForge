# MindForge — AI/ML Features Roadmap

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
