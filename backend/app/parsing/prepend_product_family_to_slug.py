"""
Prepend product_family to slug fields when not already prefixed.

Behavior per product:
- If product_family and slug exist, and slug does not start with "<product_family>-", set slug = "<product_family>-<slug>" (lowercase product_family, existing slug kept as-is).
- Also update seo.slug the same way if present.
- Skips if product_family missing or slug missing.
- Does NOT touch images or status.

Outputs summary: output/prepend_slug_summary.json
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Any, Dict

backend_dir = PathLib(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

original_cwd = PathLib.cwd()
backend_path = backend_dir
os.chdir(backend_path)
try:
    from app.config import settings
    from app.db import get_client, get_db
finally:
    os.chdir(original_cwd)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_DIR = PathLib(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
SUMMARY_FILE = OUTPUT_DIR / "prepend_slug_summary.json"


def needs_prefix(pf: str, slug: str) -> bool:
    if not pf or not slug:
        return False
    prefix = pf.lower() + "-"
    return not slug.lower().startswith(prefix)


def add_prefix(pf: str, slug: str) -> str:
    if not pf or not slug:
        return slug
    prefix = pf.lower()
    return f"{prefix}-{slug}" if not slug.lower().startswith(prefix + "-") else slug


async def main():
    print("=" * 80)
    print("Prepending product_family to slug/seo.slug when missing")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()
    collection = db["products"]

    summary = {"processed": 0, "updated": 0, "details": []}

    try:
        async for doc in collection.find({"slug": {"$exists": True}}):
            summary["processed"] += 1
            pf = doc.get("product_family") or doc.get("series")
            slug = doc.get("slug")
            seo = doc.get("seo") or {}
            seo_slug = seo.get("slug")

            updates: Dict[str, Any] = {}

            if pf and slug and needs_prefix(pf, slug):
                updates["slug"] = add_prefix(pf, slug)

            if pf and seo_slug and needs_prefix(pf, seo_slug):
                new_seo = dict(seo)
                new_seo["slug"] = add_prefix(pf, seo_slug)
                updates["seo"] = new_seo

            if updates:
                res = await collection.update_one({"_id": doc["_id"]}, {"$set": updates})
                summary["updated"] += 1
                summary["details"].append({
                    "sku": doc.get("sku"),
                    "product_family": pf,
                    "updates": updates,
                    "matched": res.matched_count,
                    "modified": res.modified_count,
                })

        with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"Done. Processed {summary['processed']} products, updated {summary['updated']}")
        print(f"Summary: {SUMMARY_FILE}")

    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
