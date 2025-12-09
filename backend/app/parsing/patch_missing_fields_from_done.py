"""
Fill missing fields in MongoDB products using data from Done/*.json files.

Behavior:
- Read all JSON files under backend/app/parsing/Done/*.json
- For each product (matched by SKU) update ONLY missing/empty fields (subcategory, specs, seo fields, catalog_source.seo fields, catalog_source.subcategory, description if missing).
- Do NOT touch images.
- If Mongo category differs from source category, skip update and log to category_mismatches.json.
- Outputs summary files under output/:
    - missing_field_updates.json (what was set per SKU)
    - category_mismatches.json (SKU with db_category vs source_category)
    - not_found.json (SKUs not found in DB)
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path
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

DONE_DIR = Path(__file__).parent / "Done"
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


def is_missing(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    if isinstance(value, dict) and len(value) == 0:
        return True
    if isinstance(value, list) and len(value) == 0:
        return True
    return False


def load_done_products() -> List[Dict[str, Any]]:
    products: List[Dict[str, Any]] = []
    if not DONE_DIR.exists():
        logger.warning("Done directory not found: %s", DONE_DIR)
        return products
    for path in sorted(DONE_DIR.glob("*.json")):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                for p in data:
                    p["_source_file"] = path.name
                    products.append(p)
            else:
                logger.warning("Skipping %s (not a list)", path.name)
        except Exception as e:
            logger.error("Error reading %s: %s", path, e)
    logger.info("Loaded %s products from Done/*.json", len(products))
    return products


def build_updates(src: Dict[str, Any], db_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Return $set fields for missing data (excluding images)."""
    updates: Dict[str, Any] = {}

    # Top-level subcategory
    if is_missing(db_doc.get("subcategory")) and not is_missing(src.get("subcategory")):
        updates["subcategory"] = src.get("subcategory")

    # catalog_source.subcategory
    src_cat_sub = ((src.get("catalog_source") or {}).get("subcategory") or src.get("subcategory"))
    db_cat_sub = (db_doc.get("catalog_source") or {}).get("subcategory")
    if is_missing(db_cat_sub) and not is_missing(src_cat_sub):
        updates["catalog_source.subcategory"] = src_cat_sub

    # specs
    if is_missing(db_doc.get("specs")) and not is_missing(src.get("specs")):
        updates["specs"] = src.get("specs")

    # top-level seo
    src_seo = src.get("seo") or {}
    db_seo = db_doc.get("seo") or {}
    for key in ["slug", "keywords", "meta_description"]:
        if is_missing(db_seo.get(key)) and not is_missing(src_seo.get(key)):
            updates[f"seo.{key}"] = src_seo.get(key)

    # catalog_source.seo
    src_cs = src.get("catalog_source") or {}
    src_cs_seo = src_cs.get("seo") or {}
    db_cs = db_doc.get("catalog_source") or {}
    db_cs_seo = db_cs.get("seo") or {}
    for key in ["slug", "keywords", "meta_description"]:
        if is_missing(db_cs_seo.get(key)) and not is_missing(src_cs_seo.get(key)):
            updates[f"catalog_source.seo.{key}"] = src_cs_seo.get(key)

    # description from seo.meta_description if missing
    if is_missing(db_doc.get("description")):
        if not is_missing(src_seo.get("meta_description")):
            updates["description"] = src_seo.get("meta_description")

    return updates


async def process(db) -> Dict[str, Any]:
    collection = db["products"]
    src_products = load_done_products()

    summary_updates = []
    category_mismatches = []
    not_found = []

    for src in src_products:
        sku = src.get("sku")
        if not sku:
            continue
        db_doc = await collection.find_one({"sku": sku})
        if not db_doc:
            not_found.append({"sku": sku, "source_file": src.get("_source_file", "")})
            continue

        # Category mismatch check (do not update if mismatch)
        src_cat = src.get("category")
        db_cat = db_doc.get("category")
        if src_cat and db_cat and src_cat != db_cat:
            # Keep full source product so we can review all fields from the JSON
            category_mismatches.append({
                "sku": sku,
                "name": src.get("name"),
                "db_category": db_cat,
                "source_category": src_cat,
                "source_file": src.get("_source_file", ""),
                "source_product": src,
            })
            continue

        updates = build_updates(src, db_doc)
        if updates:
            result = await collection.update_one({"_id": db_doc["_id"]}, {"$set": updates})
            summary_updates.append({
                "sku": sku,
                "name": src.get("name"),
                "fields_set": updates,
                "matched": result.matched_count,
                "modified": result.modified_count,
            })

    return {
        "updated_count": len(summary_updates),
        "category_mismatches": category_mismatches,
        "not_found": not_found,
        "updates": summary_updates,
    }


def write_outputs(results: Dict[str, Any]) -> None:
    updates_file = OUTPUT_DIR / "missing_field_updates.json"
    mismatches_file = OUTPUT_DIR / "category_mismatches.json"
    not_found_file = OUTPUT_DIR / "not_found.json"

    with open(updates_file, "w", encoding="utf-8") as f:
        json.dump(results.get("updates", []), f, indent=2, ensure_ascii=False)
    with open(mismatches_file, "w", encoding="utf-8") as f:
        json.dump(results.get("category_mismatches", []), f, indent=2, ensure_ascii=False)
    with open(not_found_file, "w", encoding="utf-8") as f:
        json.dump(results.get("not_found", []), f, indent=2, ensure_ascii=False)

    logger.info("Wrote updates to %s", updates_file)
    logger.info("Wrote category mismatches to %s", mismatches_file)
    logger.info("Wrote not-found to %s", not_found_file)


async def main():
    print("=" * 80)
    print("Patching missing fields from Done/*.json into Mongo products")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()

    try:
        await client.admin.command("ping")
        results = await process(db)
        write_outputs(results)

        print("Done.")
        print(f"  Updated products: {results.get('updated_count', 0)}")
        print(f"  Category mismatches: {len(results.get('category_mismatches', []))}")
        print(f"  Not found: {len(results.get('not_found', []))}")

    except Exception as e:
        logger.exception("Error during patch: %s", e)
        raise
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

