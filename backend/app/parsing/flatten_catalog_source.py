"""
Flatten catalog_source into top-level fields and create a top-level slug.

Behavior per product:
- If catalog_source.subcategory exists and top-level subcategory is missing/empty, set subcategory.
- If catalog_source.product_family exists and top-level product_family is missing/empty, set product_family.
- If catalog_source.variant exists and top-level variant is missing/empty, set variant.
- If catalog_source.pricing exists and top-level pricing is missing/empty, set pricing.
- If catalog_source.highlights exists and top-level highlights is missing/empty, set highlights.
- If catalog_source.seo exists, merge missing seo fields (slug, keywords, meta_description) into top-level seo.
- If catalog_source.source_file exists and top-level _source_file missing, set _source_file.
- Create top-level slug from (seo.slug or catalog_source.seo.slug) if top-level slug is missing.
- After moves, remove catalog_source completely.

Does NOT touch images or status.

Outputs summary: output/flatten_catalog_source_summary.json
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
SUMMARY_FILE = OUTPUT_DIR / "flatten_catalog_source_summary.json"


def is_missing(val: Any) -> bool:
    if val is None:
        return True
    if isinstance(val, str) and val.strip() == "":
        return True
    if isinstance(val, dict) and len(val) == 0:
        return True
    if isinstance(val, list) and len(val) == 0:
        return True
    return False


def merge_seo(target: Dict[str, Any], source: Dict[str, Any]) -> Dict[str, Any]:
    merged = dict(target or {})
    for k in ["slug", "keywords", "meta_description"]:
        if is_missing(merged.get(k)) and not is_missing(source.get(k)):
            merged[k] = source.get(k)
    return merged


async def main():
    print("=" * 80)
    print("Flattening catalog_source into top-level fields and slug")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()
    collection = db["products"]

    summary = {"processed": 0, "updated": 0, "details": []}

    try:
        async for doc in collection.find({"catalog_source": {"$exists": True}}):
            summary["processed"] += 1
            cs = doc.get("catalog_source") or {}
            updates: Dict[str, Any] = {}
            unset: Dict[str, Any] = {}

            # subcategory
            if is_missing(doc.get("subcategory")) and not is_missing(cs.get("subcategory")):
                updates["subcategory"] = cs.get("subcategory")

            # product_family
            if is_missing(doc.get("product_family")) and not is_missing(cs.get("product_family")):
                updates["product_family"] = cs.get("product_family")

            # variant
            if is_missing(doc.get("variant")) and not is_missing(cs.get("variant")):
                updates["variant"] = cs.get("variant")

            # pricing
            if is_missing(doc.get("pricing")) and not is_missing(cs.get("pricing")):
                updates["pricing"] = cs.get("pricing")

            # highlights
            if is_missing(doc.get("highlights")) and not is_missing(cs.get("highlights")):
                updates["highlights"] = cs.get("highlights")

            # source file
            if is_missing(doc.get("_source_file")) and not is_missing(cs.get("source_file")):
                updates["_source_file"] = cs.get("source_file")

            # seo merge
            cs_seo = cs.get("seo") or {}
            if cs_seo:
                merged_seo = merge_seo(doc.get("seo") or {}, cs_seo)
                if merged_seo != (doc.get("seo") or {}):
                    updates["seo"] = merged_seo

            # top-level slug from seo/catalog_source.seo if missing
            top_slug = doc.get("slug")
            candidate_slug = None
            if not is_missing(top_slug):
                candidate_slug = top_slug
            else:
                seo_slug = (doc.get("seo") or {}).get("slug")
                cs_slug = cs_seo.get("slug") if cs_seo else None
                candidate_slug = seo_slug or cs_slug
            if is_missing(top_slug) and not is_missing(candidate_slug):
                updates["slug"] = candidate_slug

            # remove catalog_source entirely
            unset["catalog_source"] = ""

            if updates or unset:
                res = await collection.update_one({"_id": doc["_id"]}, {"$set": updates, "$unset": unset})
                summary["updated"] += 1
                summary["details"].append({
                    "sku": doc.get("sku"),
                    "updates": updates,
                    "unset": list(unset.keys()),
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
