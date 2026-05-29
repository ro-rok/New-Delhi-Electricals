"""
Seed sample draft quotations using real products from MongoDB.

Usage (from backend/):
  python scripts/seed_quotation_samples.py

Recommended indexes (run once in mongosh):
  db.products.createIndex({ category: 1, brand: 1, series: 1 })
  db.products.createIndex({ sku: 1 })
  db.quotations.createIndex({ quotation_number: 1 }, { unique: true })
  db.quotations.createIndex({ status: 1, updated_at: -1 })
"""

from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

from app.db import get_db  # noqa: E402
from app.services.quotation_db import next_quotation_number, record_product_usage  # noqa: E402
from app.services.quotation_pricing import build_quotation_item, compute_pricing, extract_color_from_specs  # noqa: E402
from app.schemas.quotation import GstMode, QuotationItem, QuotationStatus  # noqa: E402


async def pick_products(db, category: str, limit: int = 3):
    cursor = db.products.find({"category": category}).limit(limit)
    return [doc async for doc in cursor]


async def build_sample(db, category: str, customer_name: str):
    docs = await pick_products(db, category, 3)
    if not docs:
        print(f"  Skip {category}: no products")
        return None

    items = []
    for doc in docs:
        specs = doc.get("specs") or {}
        item = build_quotation_item(
            product_id=str(doc["_id"]),
            sku=doc.get("sku", ""),
            name=doc.get("name", ""),
            brand=doc.get("brand", ""),
            list_price=int(doc.get("list_price", 0)),
            quantity=2 if category == "Switches" else 1,
            item_discount_pct=5.0,
            series=doc.get("series"),
            color=extract_color_from_specs(specs),
        )
        items.append(item)

    pricing = compute_pricing(items, overall_discount_pct=2.0, gst_mode=GstMode.EXCLUSIVE, gst_rate=18.0)
    now = datetime.utcnow()
    qnum = await next_quotation_number(db)
    doc = {
        "quotation_number": qnum,
        "status": QuotationStatus.DRAFT.value,
        "customer": {
            "name": customer_name,
            "phone": "9876543210",
            "gst_number": "",
            "address": "New Delhi",
        },
        "items": [i.model_dump(by_alias=True) for i in items],
        "pricing": pricing.model_dump(by_alias=True),
        "notes": f"Sample draft for {category}",
        "created_at": now,
        "updated_at": now,
        "created_by": "seed_script",
    }
    result = await db.quotations.insert_one(doc)
    await record_product_usage(db, doc["items"])
    print(f"  Created {qnum} ({category}) id={result.inserted_id}")
    return result.inserted_id


async def main():
    db = get_db()
    print("Seeding sample quotations...")
    for cat, name in [
        ("Switches", "Sample Customer A"),
        ("Plates", "Sample Customer B"),
        ("Circuit Protection", "Sample Customer C"),
    ]:
        await build_sample(db, cat, name)
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
