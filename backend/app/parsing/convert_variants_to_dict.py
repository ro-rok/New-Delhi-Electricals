"""
Convert existing MongoDB products' `variant` field from list → dict[sku, color].

Rules:
- If `variant` is already a dict, leave it.
- If `variant` is a list, turn it into {sku: color or ""} where color is taken
  from the referenced product's specs.color (if available).
- Writes summary to output/variant_dict_migration.json

Usage:
    cd backend/app/parsing
    python convert_variants_to_dict.py
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

OUTPUT_FILE = PathLib(__file__).parent / "output" / "variant_dict_migration.json"


async def build_color_lookup(db) -> Dict[str, str]:
    """Build sku -> color map from all products."""
    collection = db["products"]
    color_lookup: Dict[str, str] = {}
    cursor = collection.find({}, {"sku": 1, "specs.color": 1})
    async for doc in cursor:
        sku = doc.get("sku")
        if not sku:
            continue
        color = (doc.get("specs") or {}).get("color")
        if color:
            color_lookup[sku] = color
    logger.info("Built color lookup for %s SKUs", len(color_lookup))
    return color_lookup


def list_to_dict(variants: Any, color_lookup: Dict[str, str]) -> Dict[str, str]:
    """Convert a variant list to dict[sku, color_or_empty]."""
    if not isinstance(variants, list):
        return {}
    mapping: Dict[str, str] = {}
    for sku in variants:
        if not isinstance(sku, str):
            continue
        mapping[sku] = color_lookup.get(sku, "")
    return mapping


async def migrate_variants(db) -> Dict[str, Any]:
    collection = db["products"]
    color_lookup = await build_color_lookup(db)

    stats = {
        "processed": 0,
        "converted": 0,
        "skipped_already_dict": 0,
        "skipped_empty": 0,
        "errors": 0,
        "error_details": [],
    }

    cursor = collection.find({}, {"variant": 1})
    async for doc in cursor:
        stats["processed"] += 1
        variant_val = doc.get("variant")

        # Already dict -> skip
        if isinstance(variant_val, dict):
            if len(variant_val) == 0:
                stats["skipped_empty"] += 1
            else:
                stats["skipped_already_dict"] += 1
            continue

        # If missing or empty list, skip
        if not variant_val:
            stats["skipped_empty"] += 1
            continue

        new_mapping = list_to_dict(variant_val, color_lookup)
        if not new_mapping:
            stats["skipped_empty"] += 1
            continue

        try:
            res = await collection.update_one({"_id": doc["_id"]}, {"$set": {"variant": new_mapping}})
            if res.modified_count:
                stats["converted"] += 1
        except Exception as e:
            stats["errors"] += 1
            stats["error_details"].append({"id": str(doc.get("_id")), "error": str(e)})
            logger.exception("Error updating %s", doc.get("_id"))

    return stats


def write_summary(stats: Dict[str, Any]):
    OUTPUT_FILE.parent.mkdir(exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(stats, indent=2), encoding="utf-8")
    logger.info("Summary written to %s", OUTPUT_FILE)


async def main():
    print("=" * 80)
    print("Migrating variant list -> dict[sku, color]")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()

    try:
        await client.admin.command("ping")
        stats = await migrate_variants(db)
        write_summary(stats)

        print("Done.")
        print(f"  Processed: {stats['processed']}")
        print(f"  Converted: {stats['converted']}")
        print(f"  Skipped (already dict): {stats['skipped_already_dict']}")
        print(f"  Skipped (empty): {stats['skipped_empty']}")
        print(f"  Errors: {stats['errors']}")
        if stats["error_details"]:
            print("\nErrors (first 10):")
            for err in stats["error_details"][:10]:
                print(f"  - {err}")
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

