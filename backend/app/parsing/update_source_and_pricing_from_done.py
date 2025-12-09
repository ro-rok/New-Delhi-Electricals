"""
Update Mongo products with _source_file and pricing from Done/*.json when missing.

Rules per SKU:
- If DB _source_file is missing/empty and Done product has _source_file -> set _source_file.
- If DB pricing is missing/empty and Done product has pricing -> set pricing.
- Do NOT touch images or status.

Outputs summary: output/source_pricing_updates.json
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

DONE_DIR = PathLib(__file__).parent / "Done"
OUTPUT_DIR = PathLib(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
SUMMARY_FILE = OUTPUT_DIR / "source_pricing_updates.json"


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


def load_done_products() -> List[Dict[str, Any]]:
    products: List[Dict[str, Any]] = []
    if not DONE_DIR.exists():
        logger.warning("Done directory not found: %s", DONE_DIR)
        return products
    for path in sorted(DONE_DIR.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                for p in data:
                    p["_source_file"] = path.name
                    products.append(p)
        except Exception as e:
            logger.error("Error reading %s: %s", path, e)
    logger.info("Loaded %s products from Done/*.json", len(products))
    return products


def build_updates(src: Dict[str, Any], db_doc: Dict[str, Any]) -> Dict[str, Any]:
    updates: Dict[str, Any] = {}

    # _source_file
    if is_missing(db_doc.get("_source_file")) and not is_missing(src.get("_source_file")):
        updates["_source_file"] = src.get("_source_file")

    # pricing
    if is_missing(db_doc.get("pricing")) and not is_missing(src.get("pricing")):
        updates["pricing"] = src.get("pricing")

    return updates


async def apply_updates(db) -> Dict[str, Any]:
    collection = db["products"]
    src_products = load_done_products()

    applied = []
    not_found = []
    skipped = []
    errors = []

    for src in src_products:
        sku = src.get("sku")
        if not sku:
            continue
        db_doc = await collection.find_one({"sku": sku})
        if not db_doc:
            not_found.append({"sku": sku, "source_file": src.get("_source_file", "")})
            continue

        updates = build_updates(src, db_doc)
        if not updates:
            skipped.append(sku)
            continue

        try:
            res = await collection.update_one({"_id": db_doc["_id"]}, {"$set": updates})
            applied.append({
                "sku": sku,
                "source_file": src.get("_source_file", ""),
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
        "skipped": skipped,
        "errors": errors,
    }


def write_summary(results: Dict[str, Any]):
    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    logger.info("Summary written to %s", SUMMARY_FILE)


async def main():
    print("=" * 80)
    print("Updating _source_file and pricing from Done/*.json when missing")
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
        print(f"  Skipped: {len(results['skipped'])}")
        print(f"  Errors: {len(results['errors'])}")
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
