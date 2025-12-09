"""
Apply updates for mismatched products:
- Update subcategory (top-level and catalog_source.subcategory)
- Update specs (from source_product.specs)
- Update SEO (top-level seo and catalog_source.seo from source_product.seo)
- Do NOT touch status or images

Sources:
- output/category_mismatches_by_source_category.json (flattened entries)
- output/hospitality.json (already mapped Hospitality entries)

Writes a summary to output/mismatch_updates_applied.json
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Any, Dict, List

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

BASE_DIR = PathLib(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
MISMATCH_GROUPED = OUTPUT_DIR / "category_mismatches_by_source_category.json"
HOSPITALITY_FILE = OUTPUT_DIR / "hospitality.json"
SUMMARY_FILE = OUTPUT_DIR / "mismatch_updates_applied.json"


def is_present(val: Any) -> bool:
    if val is None:
        return False
    if isinstance(val, str) and val.strip() == "":
        return False
    if isinstance(val, dict) and len(val) == 0:
        return False
    if isinstance(val, list) and len(val) == 0:
        return False
    return True


def load_entries() -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    # grouped mismatches
    if MISMATCH_GROUPED.exists():
        with open(MISMATCH_GROUPED, "r", encoding="utf-8") as f:
            grouped = json.load(f)
        for _, lst in grouped.items():
            if isinstance(lst, list):
                entries.extend(lst)
    # hospitality
    if HOSPITALITY_FILE.exists():
        with open(HOSPITALITY_FILE, "r", encoding="utf-8") as f:
            hosp = json.load(f)
        if isinstance(hosp, list):
            entries.extend(hosp)
    logger.info("Loaded %s mismatch entries", len(entries))
    return entries


def build_updates(entry: Dict[str, Any]) -> Dict[str, Any]:
    updates: Dict[str, Any] = {}
    sp = entry.get("source_product") or {}

    # subcategory
    sub = entry.get("subcategory") or sp.get("subcategory")
    if is_present(sub):
        updates["subcategory"] = sub
        updates["catalog_source.subcategory"] = sub

    # specs
    specs = sp.get("specs")
    if is_present(specs):
        updates["specs"] = specs

    # seo
    seo = sp.get("seo") or {}
    if is_present(seo):
        updates["seo"] = seo
        updates["catalog_source.seo"] = seo
        if is_present(seo.get("meta_description")) and not is_present(entry.get("description")):
            updates["description"] = seo.get("meta_description")

    return updates


async def apply_updates(db) -> Dict[str, Any]:
    collection = db["products"]
    entries = load_entries()

    applied = []
    skipped_no_updates = []
    not_found = []
    errors = []

    for ent in entries:
        sku = ent.get("sku")
        if not sku:
            continue
        db_doc = await collection.find_one({"sku": sku})
        if not db_doc:
            not_found.append({"sku": sku, "name": ent.get("name")})
            continue

        updates = build_updates(ent)
        if not updates:
            skipped_no_updates.append(sku)
            continue

        try:
            res = await collection.update_one({"_id": db_doc["_id"]}, {"$set": updates})
            applied.append({
                "sku": sku,
                "name": ent.get("name"),
                "fields_set": updates,
                "matched": res.matched_count,
                "modified": res.modified_count,
            })
        except Exception as e:
            errors.append({"sku": sku, "error": str(e)})
            logger.exception("Error updating %s", sku)

    return {
        "applied": applied,
        "not_found": not_found,
        "skipped_no_updates": skipped_no_updates,
        "errors": errors,
    }


def write_summary(results: Dict[str, Any]):
    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    logger.info("Summary written to %s", SUMMARY_FILE)


async def main():
    print("=" * 80)
    print("Applying mismatch updates (subcategory, specs, seo)")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()

    try:
        await client.admin.command("ping")
        results = await apply_updates(db)
        write_summary(results)
        print("Done.")
        print(f"  Applied: {len(results['applied'])}")
        print(f"  Not found: {len(results['not_found'])}")
        print(f"  No updates: {len(results['skipped_no_updates'])}")
        print(f"  Errors: {len(results['errors'])}")
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
