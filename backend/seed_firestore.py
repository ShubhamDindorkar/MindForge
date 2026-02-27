"""
seed_firestore.py — Upload generated inventory history + stats to Firebase Firestore.

Prerequisites:
  1. Place your Firebase service account JSON at backend/serviceAccountKey.json
  2. Run generate_data.py first to create data/inventory_history.json

Run:  python seed_firestore.py

Firestore structure created:
  inventory_history/{sku}/
    ├── metadata   (document fields)
    ├── stats      (document fields)
    └── daily_data (subcollection — one doc per month for efficiency)
"""

import json
import os
from collections import defaultdict

import firebase_admin
from firebase_admin import credentials, firestore


def chunk_daily_by_month(daily_data: list[dict]) -> dict[str, list[dict]]:
    """Group daily records by YYYY-MM for efficient Firestore storage."""
    months: dict[str, list[dict]] = defaultdict(list)
    for record in daily_data:
        month_key = record["date"][:7]  # "2023-01"
        months[month_key].append(record)
    return dict(months)


def main():
    # Init Firebase Admin
    key_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
    if not os.path.exists(key_path):
        print("❌ serviceAccountKey.json not found in backend/")
        print("   Download it from Firebase Console → Project Settings → Service Accounts")
        return

    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    # Load generated data
    data_path = os.path.join(os.path.dirname(__file__), "data", "inventory_history.json")
    if not os.path.exists(data_path):
        print("❌ data/inventory_history.json not found. Run generate_data.py first.")
        return

    with open(data_path) as f:
        all_data = json.load(f)

    print(f"Seeding {len(all_data)} SKUs to Firestore...\n")

    for sku, sku_data in all_data.items():
        doc_ref = db.collection("inventory_history").document(sku)

        # Write metadata + stats as top-level fields
        doc_ref.set({
            "metadata": sku_data["metadata"],
            "stats": sku_data["stats"],
        })

        # Write daily data chunked by month into subcollection
        monthly = chunk_daily_by_month(sku_data["daily_data"])
        batch = db.batch()
        count = 0
        for month_key, records in monthly.items():
            month_ref = doc_ref.collection("daily_data").document(month_key)
            batch.set(month_ref, {"records": records})
            count += 1

            # Firestore batch limit = 500
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()

        batch.commit()
        print(f"  ✅ {sku} — {len(monthly)} months uploaded")

    print(f"\n✅ All data seeded to Firestore successfully!")


if __name__ == "__main__":
    main()
