"""
Apply variants from Done/*.json into Mongo products when variants are missing/empty.

Rules:
- Load Done/*.json products (with _source_file annotated)
- For each SKU in Mongo:
  - If source_product has variants (non-empty list)
  - And DB variants field is missing/empty
  - Then set `variant` to the source list
- Does NOT touch images or status.
- Outputs summary to output/variant_updates_applied.json
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
SUMMARY_FILE = OUTPUT_DIR / "variant_updates_applied.json"


def is_missing_variants(val: Any) -> bool:
    """True when variants are missing/empty (supports list or dict)."""
    if val is None:
        return True
    if isinstance(val, list):
        return len(val) == 0
    if isinstance(val, dict):
        return len(val) == 0
    return True


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
        except Exception as e:
            logger.error("Error reading %s: %s", path, e)
    logger.info("Loaded %s products from Done/*.json", len(products))
    return products


def build_color_lookup(products: List[Dict[str, Any]]) -> Dict[str, str]:
    """Build sku -> color lookup from the provided products list."""
    lookup: Dict[str, str] = {}
    for p in products:
        sku = p.get("sku")
        if not sku:
            continue
        color = (p.get("specs") or {}).get("color")
        if color:
            lookup[sku] = color
    return lookup


def normalize_variant_mapping(raw_variants: Any, color_lookup: Dict[str, str]) -> Dict[str, str]:
    """
    Convert variants to dict[sku, color_or_empty].
    Accepts either dict (returns as-is) or list (converts).
    """
    if isinstance(raw_variants, dict):
        return raw_variants
    if not isinstance(raw_variants, list):
        return {}
    mapping: Dict[str, str] = {}
    for sku in raw_variants:
        if not isinstance(sku, str):
            continue
        mapping[sku] = color_lookup.get(sku, "")
    return mapping


def build_updates(src: Dict[str, Any], db_doc: Dict[str, Any], color_lookup: Dict[str, str]) -> Dict[str, Any]:
    updates: Dict[str, Any] = {}
    src_variants = normalize_variant_mapping(src.get("variant"), color_lookup)
    db_variants = db_doc.get("variant")
    if src_variants and is_missing_variants(db_variants):
        updates["variant"] = src_variants
    return updates


async def apply_updates(db) -> Dict[str, Any]:
    collection = db["products"]
    src_products = load_done_products()
    color_lookup = build_color_lookup(src_products)

    applied = []
    not_found = []
    skipped_no_updates = []
    errors = []

    for src in src_products:
        sku = src.get("sku")
        if not sku:
            continue
        db_doc = await collection.find_one({"sku": sku})
        if not db_doc:
            not_found.append({"sku": sku, "source_file": src.get("_source_file", "")})
            continue

        updates = build_updates(src, db_doc, color_lookup)
        if not updates:
            skipped_no_updates.append(sku)
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
        "skipped_no_updates": skipped_no_updates,
        "errors": errors,
    }


def write_summary(results: Dict[str, Any]):
    OUTPUT_DIR.mkdir(exist_ok=True)
    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    logger.info("Summary written to %s", SUMMARY_FILE)


async def main():
    print("=" * 80)
    print("Applying variant updates from Done/*.json (only if DB variants missing)")
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
