"""
generate_data.py — Generate 3 years of realistic daily inventory data for StockShiftAI.

Run:  python generate_data.py
Output: data/inventory_history.json  (one file, all SKUs)

The generated data contains built-in:
  - Seasonal patterns (holiday spikes, summer dips, etc.)
  - Weekly cycles (Mon-Fri higher demand)
  - Gradual trends (growing / declining items)
  - Random anomaly spikes (3-5x normal)
"""

import json
import math
import os
import random
from datetime import datetime, timedelta

random.seed(42)

# ── SKU definitions (must match frontend mock-data.ts) ──────────────────────

SKUS = [
    {
        "sku": "ELEC-PCB-001",
        "name": "Circuit Board PCB-A1",
        "category": "Electronics",
        "location": "Warehouse A",
        "unit_cost": 12.50,
        "sell_price": 24.99,
        "lead_time_days": 7,
        "base_daily_demand": 8,
        "trend": 0.003,           # slight upward trend
        "seasonal_peak_month": 11, # Nov peak (holiday electronics)
        "seasonal_amplitude": 0.4,
    },
    {
        "sku": "RAW-COP-014",
        "name": "Copper Wire Spool 14AWG",
        "category": "Raw Materials",
        "location": "Warehouse B",
        "unit_cost": 45.00,
        "sell_price": 72.00,
        "lead_time_days": 14,
        "base_daily_demand": 3,
        "trend": 0.001,
        "seasonal_peak_month": 3,  # March (construction season)
        "seasonal_amplitude": 0.35,
    },
    {
        "sku": "OFF-PAP-A4R",
        "name": "A4 Copy Paper (Ream)",
        "category": "Office Supplies",
        "location": "Storage Room 1",
        "unit_cost": 4.25,
        "sell_price": 8.99,
        "lead_time_days": 3,
        "base_daily_demand": 15,
        "trend": -0.001,          # slight decline (digital shift)
        "seasonal_peak_month": 9,  # Sept (back to office)
        "seasonal_amplitude": 0.25,
    },
    {
        "sku": "TLS-DRL-SET",
        "name": "Industrial Drill Bit Set",
        "category": "Tools & Equipment",
        "location": "Storage Room 2",
        "unit_cost": 89.99,
        "sell_price": 149.99,
        "lead_time_days": 10,
        "base_daily_demand": 1,
        "trend": 0.002,
        "seasonal_peak_month": 4,  # Spring projects
        "seasonal_amplitude": 0.3,
    },
    {
        "sku": "PKG-BOX-12C",
        "name": "Cardboard Box 12x12x12",
        "category": "Packaging",
        "location": "Loading Dock",
        "unit_cost": 1.20,
        "sell_price": 2.50,
        "lead_time_days": 5,
        "base_daily_demand": 40,
        "trend": 0.004,
        "seasonal_peak_month": 12, # Dec (holiday shipping)
        "seasonal_amplitude": 0.5,
    },
    {
        "sku": "SAF-GOG-PRO",
        "name": "Safety Goggles Pro",
        "category": "Safety Gear",
        "location": "Storage Room 1",
        "unit_cost": 15.00,
        "sell_price": 29.99,
        "lead_time_days": 7,
        "base_daily_demand": 3,
        "trend": 0.001,
        "seasonal_peak_month": 6,  # Summer construction
        "seasonal_amplitude": 0.2,
    },
    {
        "sku": "ELEC-LED-7S",
        "name": "LED Display Module 7-Seg",
        "category": "Electronics",
        "location": "Warehouse A",
        "unit_cost": 3.75,
        "sell_price": 8.50,
        "lead_time_days": 7,
        "base_daily_demand": 12,
        "trend": 0.005,           # growing demand (IoT trend)
        "seasonal_peak_month": 10,
        "seasonal_amplitude": 0.3,
    },
    {
        "sku": "RAW-ALU-4X8",
        "name": "Aluminum Sheet 4x8ft",
        "category": "Raw Materials",
        "location": "Warehouse B",
        "unit_cost": 120.00,
        "sell_price": 195.00,
        "lead_time_days": 14,
        "base_daily_demand": 2,
        "trend": 0.002,
        "seasonal_peak_month": 5,
        "seasonal_amplitude": 0.25,
    },
    {
        "sku": "PKG-BWR-12R",
        "name": "Bubble Wrap Roll 12in",
        "category": "Packaging",
        "location": "Loading Dock",
        "unit_cost": 18.50,
        "sell_price": 34.99,
        "lead_time_days": 5,
        "base_daily_demand": 8,
        "trend": 0.003,
        "seasonal_peak_month": 12,
        "seasonal_amplitude": 0.45,
    },
    {
        "sku": "SAF-HHT-CLE",
        "name": "Hard Hat Class E",
        "category": "Safety Gear",
        "location": "Storage Room 2",
        "unit_cost": 22.00,
        "sell_price": 44.99,
        "lead_time_days": 7,
        "base_daily_demand": 2,
        "trend": 0.001,
        "seasonal_peak_month": 6,
        "seasonal_amplitude": 0.2,
    },
    {
        "sku": "ELEC-USB-C6",
        "name": "USB-C Cable 6ft",
        "category": "Electronics",
        "location": "Warehouse A",
        "unit_cost": 2.10,
        "sell_price": 7.99,
        "lead_time_days": 5,
        "base_daily_demand": 20,
        "trend": 0.006,           # strong growth
        "seasonal_peak_month": 11,
        "seasonal_amplitude": 0.4,
    },
    {
        "sku": "OFF-MRK-12P",
        "name": "Whiteboard Markers (12pk)",
        "category": "Office Supplies",
        "location": "Storage Room 1",
        "unit_cost": 8.99,
        "sell_price": 16.99,
        "lead_time_days": 3,
        "base_daily_demand": 4,
        "trend": 0.0,
        "seasonal_peak_month": 9,
        "seasonal_amplitude": 0.2,
    },
]

START_DATE = datetime(2023, 1, 1)
END_DATE = datetime(2026, 2, 27)


def seasonal_factor(day: datetime, peak_month: int, amplitude: float) -> float:
    """Cosine-based seasonal factor centered on peak_month."""
    month_angle = (day.month - peak_month) * (2 * math.pi / 12)
    return 1.0 + amplitude * math.cos(month_angle)


def weekday_factor(day: datetime) -> float:
    """Mon-Fri get more demand; weekends are quieter."""
    wd = day.weekday()
    if wd < 5:
        return 1.0 + 0.1 * random.random()
    return 0.3 + 0.2 * random.random()


def trend_factor(day_index: int, trend: float) -> float:
    """Exponential trend over time."""
    return math.exp(trend * day_index)


def inject_anomalies(daily_data: list[dict], sku_info: dict) -> None:
    """Inject 8-15 random anomaly spikes across the 3-year period."""
    n_anomalies = random.randint(8, 15)
    indices = random.sample(range(30, len(daily_data) - 5), n_anomalies)
    for idx in indices:
        spike_multiplier = random.uniform(2.5, 5.0)
        # Spike lasts 1-3 days
        duration = random.randint(1, 3)
        for d in range(duration):
            if idx + d < len(daily_data):
                daily_data[idx + d]["qty_sold"] = int(
                    daily_data[idx + d]["qty_sold"] * spike_multiplier
                )
                daily_data[idx + d]["is_anomaly"] = True


def generate_sku_data(sku_info: dict) -> dict:
    """Generate daily records for a single SKU over the full date range."""
    records = []
    stock = int(sku_info["base_daily_demand"] * 30)  # start with ~1 month stock
    day = START_DATE
    day_index = 0

    while day <= END_DATE:
        # Compute demand
        sf = seasonal_factor(day, sku_info["seasonal_peak_month"], sku_info["seasonal_amplitude"])
        wf = weekday_factor(day)
        tf = trend_factor(day_index, sku_info["trend"])
        base = sku_info["base_daily_demand"]

        raw_demand = base * sf * wf * tf
        noise = random.gauss(0, base * 0.15)
        qty_sold = max(0, int(round(raw_demand + noise)))

        # Simulate restocking: order when stock is low
        qty_received = 0
        if stock < base * sku_info["lead_time_days"] * 1.2:
            # Restock arrives (simulating lead-time aligned ordering)
            qty_received = int(base * random.uniform(14, 28) * tf)

        stock = stock + qty_received - qty_sold
        if stock < 0:
            qty_sold = qty_sold + stock  # can't sell what you don't have
            stock = 0

        records.append({
            "date": day.strftime("%Y-%m-%d"),
            "qty_sold": qty_sold,
            "qty_received": qty_received,
            "stock_level": stock,
            "is_anomaly": False,
        })

        day += timedelta(days=1)
        day_index += 1

    # Inject anomalies
    inject_anomalies(records, sku_info)

    return {
        "sku": sku_info["sku"],
        "name": sku_info["name"],
        "category": sku_info["category"],
        "location": sku_info["location"],
        "unit_cost": sku_info["unit_cost"],
        "sell_price": sku_info["sell_price"],
        "lead_time_days": sku_info["lead_time_days"],
        "daily_data": records,
    }


def compute_stats(sku_data: dict) -> dict:
    """Pre-compute statistical summaries for a SKU."""
    daily = sku_data["daily_data"]
    last_30 = daily[-30:]
    last_7 = daily[-7:]
    last_90 = daily[-90:]

    sold_30 = [d["qty_sold"] for d in last_30]
    sold_7 = [d["qty_sold"] for d in last_7]
    sold_90 = [d["qty_sold"] for d in last_90]

    avg_30 = sum(sold_30) / len(sold_30) if sold_30 else 0
    avg_7 = sum(sold_7) / len(sold_7) if sold_7 else 0
    avg_90 = sum(sold_90) / len(sold_90) if sold_90 else 0

    # Standard deviation (30d)
    variance = sum((x - avg_30) ** 2 for x in sold_30) / len(sold_30) if sold_30 else 0
    std_dev = math.sqrt(variance)

    # Trend slope (simple linear regression on last 90 days)
    n = len(sold_90)
    if n > 1:
        x_mean = (n - 1) / 2
        y_mean = avg_90
        numerator = sum((i - x_mean) * (sold_90[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        slope = numerator / denominator if denominator else 0
    else:
        slope = 0

    # Seasonal factors (avg demand per month across all years)
    monthly_totals: dict[int, list[int]] = {m: [] for m in range(1, 13)}
    for d in daily:
        month = int(d["date"].split("-")[1])
        monthly_totals[month].append(d["qty_sold"])
    overall_avg = sum(d["qty_sold"] for d in daily) / len(daily) if daily else 1
    seasonal_factors = {}
    for m in range(1, 13):
        m_avg = sum(monthly_totals[m]) / len(monthly_totals[m]) if monthly_totals[m] else overall_avg
        seasonal_factors[str(m)] = round(m_avg / overall_avg, 3) if overall_avg else 1.0

    # Anomaly count in last 30 days
    recent_anomalies = sum(1 for d in last_30 if d["is_anomaly"])

    # Current stock
    current_stock = daily[-1]["stock_level"] if daily else 0

    # Days until stockout at current rate
    days_until_stockout = int(current_stock / avg_7) if avg_7 > 0 else 999

    # Same period last year comparison
    today_idx = len(daily) - 1
    ly_start = max(0, today_idx - 365 - 30)
    ly_end = max(0, today_idx - 365)
    if ly_end > ly_start:
        ly_slice = daily[ly_start:ly_end]
        ly_avg = sum(d["qty_sold"] for d in ly_slice) / len(ly_slice) if ly_slice else 0
    else:
        ly_avg = avg_30
    yoy_change = ((avg_30 - ly_avg) / ly_avg * 100) if ly_avg > 0 else 0

    return {
        "avg_daily_demand_7d": round(avg_7, 2),
        "avg_daily_demand_30d": round(avg_30, 2),
        "avg_daily_demand_90d": round(avg_90, 2),
        "std_deviation_30d": round(std_dev, 2),
        "trend_slope_90d": round(slope, 4),
        "seasonal_factors": seasonal_factors,
        "current_stock": current_stock,
        "days_until_stockout": days_until_stockout,
        "recent_anomaly_count": recent_anomalies,
        "yoy_change_pct": round(yoy_change, 1),
        "lead_time_days": sku_data["lead_time_days"],
    }


def main():
    os.makedirs("data", exist_ok=True)

    all_data = {}
    for sku_info in SKUS:
        print(f"Generating data for {sku_info['sku']}...")
        sku_data = generate_sku_data(sku_info)
        stats = compute_stats(sku_data)

        all_data[sku_info["sku"]] = {
            "metadata": {
                "sku": sku_info["sku"],
                "name": sku_info["name"],
                "category": sku_info["category"],
                "location": sku_info["location"],
                "unit_cost": sku_info["unit_cost"],
                "sell_price": sku_info["sell_price"],
                "lead_time_days": sku_info["lead_time_days"],
            },
            "stats": stats,
            "daily_data": sku_data["daily_data"],
        }

    with open("data/inventory_history.json", "w") as f:
        json.dump(all_data, f, indent=2)

    print(f"\n✅ Generated data for {len(SKUS)} SKUs")
    print(f"   Date range: {START_DATE.date()} → {END_DATE.date()}")
    total_records = sum(len(v["daily_data"]) for v in all_data.values())
    print(f"   Total daily records: {total_records:,}")
    print(f"   Output: data/inventory_history.json")


if __name__ == "__main__":
    main()
