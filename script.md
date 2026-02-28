# StockShiftAI — Demo Video Script

**Total Duration**: 3:00–3:30  
**Format**: Screen recording with voiceover  
**Resolution**: 1920×1080  

---

## Pre-Recording Checklist

- [ ] Start backend: `cd backend && source venv/bin/activate && python app.py`
- [ ] Start frontend: `npm run dev`
- [ ] Clear localStorage (DevTools → Application → Clear) for fresh seed data
- [ ] Open `http://localhost:3000` in Chrome (zoom 90–100%)
- [ ] Close all other tabs, enable Focus Mode (notifications off)
- [ ] Open QuickTime → File → New Screen Recording → select microphone
- [ ] Do one silent dry run to rehearse the flow

---

## Scene 1 — Landing Page (0:00–0:30)

**On screen**: Landing page with liquid ether animation. Slowly scroll down with trackpad.

**Voiceover**:

> "This is StockShiftAI — an AI-powered inventory optimization platform that doesn't just record your inventory, it predicts what you'll need and tells you when to act.
>
> The problem we're solving is inefficient inventory planning. Businesses lose money from overstocking, understocking, and static forecasting models that can't adapt to real-world demand patterns.
>
> Let's dive into the platform."

**Action**: Click "Get Started" or navigate to Login.

---

## Scene 2 — Login (0:30–0:45)

**On screen**: Login page with glass card. Click "Sign in with Google".

**Voiceover**:

> "Authentication is handled through Firebase with Google Sign-In. Once logged in, you're taken directly to the admin dashboard."

**Action**: Complete Google sign-in → land on Dashboard.

---

## Scene 3 — Dashboard (0:45–1:15)

**On screen**: Dashboard KPI cards at the top. Scroll down to AI recommendations section. Hover over recommendation cards.

**Voiceover**:

> "The dashboard gives you an instant overview — total items, inventory value, low-stock alerts, and recent activity.
>
> Below that, you'll see AI-generated recommendations. These are produced by our Gemini 2.0 Flash model using a structured-data RAG pipeline. The system retrieves live inventory data from Firestore, augments it into the prompt context, and generates actionable insights like reorder urgency and overstock warnings."

**Action**: Pause on AI recommendations for 2–3 seconds, then navigate to Inventory.

---

## Scene 4 — Inventory Management (1:15–1:45)

**On screen**: Inventory list. Click "Add Item" → fill in name, SKU, category, quantity, cost, sell price, location, reorder point → save. Show the new item in the list. Show per-item AI recommendations.

**Voiceover**:

> "The inventory page lets you manage all your SKUs. You can add, edit, and remove items. Data persists across sessions using local storage.
>
> Each item shows AI-powered recommendations — the system flags items at risk of stockout or overstock, with dynamic reorder points calculated from predicted demand, lead time, and safety stock formulas."

**Action**: Navigate to Reports.

---

## Scene 5 — Reports & Forecasting (1:45–2:15)

**On screen**: Reports page showing forecast chart for a SKU. Switch between 2–3 different items to show varied chart patterns. Click to Anomalies tab.

**Voiceover**:

> "The reports page is where our demand forecasting model lives. For each SKU, the AI generates a 14-day demand forecast, factoring in seasonality, sales velocity, and trend data.
>
> The chart shows predicted demand versus current stock levels. You can switch between items to see different forecast patterns — growth, seasonal cycles, spikes, and declining trends.
>
> The anomalies tab uses AI to detect unusual consumption patterns — for example, a SKU moving 240% above baseline gets flagged immediately."

**Action**: Navigate to Finance.

---

## Scene 6 — Finance (2:15–2:30)

**On screen**: Finance page with revenue breakdown by category, top expensive items, reorder alerts.

**Voiceover**:

> "The finance page provides revenue analytics by category, highlights your most expensive inventory items, and surfaces reorder cost alerts — all computed from live inventory data."

**Action**: Navigate to Cost Optimization.

---

## Scene 7 — AI Tools (2:30–3:15)

### Cost Optimization (2:30–2:45)

**On screen**: Cost Optimization page showing capital analysis cards.

**Voiceover**:

> "Now for the advanced AI tools. Cost Optimization analyzes your capital allocation — how much is locked in overstock, what's at risk of stockout, and projected holding costs."

### Scenario Planning (2:45–3:00)

**On screen**: Scenario Planning page. Adjust a slider (e.g., demand +20%). Click "Run Analysis". Show the results.

**Voiceover**:

> "Scenario Planning lets you run what-if simulations. For example, what happens if demand increases by 20%? The AI recalculates reorder points, safety stock, and projected impact for every SKU."

### Warehouse Optimization (3:00–3:15)

**On screen**: Warehouse Optimization page showing transfer recommendations.

**Voiceover**:

> "Warehouse Optimization recommends inter-warehouse transfers — moving excess stock from one location to fill shortages at another, with cost-benefit analysis for each recommendation.
>
> All of these features are powered by our structured-data RAG pipeline hitting Google's Gemini 2.0 Flash through OpenRouter, with a 5-minute response cache for performance."

---

## Scene 8 — Closing (3:15–3:30)

**On screen**: Scroll back to Dashboard or return to Landing page.

**Voiceover**:

> "StockShiftAI transforms inventory management from reactive record-keeping into proactive, AI-driven decision-making. It predicts demand, detects anomalies, and tells you exactly when and how much to reorder — adapting dynamically to real-world patterns.
>
> Thank you."

---

## Recording Tips

1. **Speak slowly** — slightly slower than conversational pace
2. **Move the mouse deliberately** — no frantic clicking, let the viewer follow
3. **Pause 1–2 seconds** on each important screen before moving on
4. **If voiceover is hard live**: record screen silently first, then add voiceover in iMovie
5. **Export**: 1080p MP4, H.264 codec
6. **Stop recording**: ⌘+Ctrl+Esc (QuickTime)
