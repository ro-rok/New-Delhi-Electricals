"""
Normalize Mini MCB variants under Switches:
- Any product in Switches whose subcategory OR name mentions "Mini MCB"
  will be forced to subcategory "Mini MCB" (top-level + catalog_source.subcategory).
- If it mentions "3k" / "3ka" -> set specs.breaking_capacity = "3kA".
- If it mentions "indicator" -> set specs.has_indicator = True.
No other fields touched. Summary written to output/normalize_mini_mcb_subcategories.json
"""

import asyncio
import json
import logging
import os
import re
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

OUTPUT_DIR = PathLib(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
SUMMARY_FILE = OUTPUT_DIR / "normalize_mini_mcb_subcategories.json"

TARGET_SUBCAT = "Mini MCB"
RE_MINI_MCB = re.compile(r"mini\\s*mcb", re.IGNORECASE)
RE_3K = re.compile(r"3\\s*k", re.IGNORECASE)
RE_IND = re.compile(r"indicator", re.IGNORECASE)


def ensure_specs(doc: Dict[str, Any]) -> Dict[str, Any]:
    specs = doc.get("specs")
    if isinstance(specs, dict):
        return dict(specs)
    return {}


def build_updates(doc: Dict[str, Any]) -> Dict[str, Any]:
    name = doc.get("name") or ""
    subcat = doc.get("subcategory") or ""

    if not (RE_MINI_MCB.search(subcat) or RE_MINI_MCB.search(name)):
        return {}

    has_3k = RE_3K.search(subcat) or RE_3K.search(name)
    has_indicator = RE_IND.search(subcat) or RE_IND.search(name)

    updates: Dict[str, Any] = {"subcategory": TARGET_SUBCAT, "catalog_source.subcategory": TARGET_SUBCAT}
    specs = ensure_specs(doc)
    if has_3k:
        specs["breaking_capacity"] = "3kA"
    if has_indicator:
        specs["has_indicator"] = True
    updates["specs"] = specs
    return updates


async def main():
    print("=" * 80)
    print("Normalizing Mini MCB subcategories and specs")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()
    coll = db["products"]

    applied: List[Dict[str, Any]] = []
    skipped: List[str] = []
    errors: List[Dict[str, Any]] = []

    try:
        await client.admin.command("ping")
        cursor = coll.find({
            "$or": [
                {"subcategory": {"$regex": RE_MINI_MCB.pattern, "$options": "i"}},
                {"name": {"$regex": RE_MINI_MCB.pattern, "$options": "i"}},
            ]
        })
        async for doc in cursor:
            updates = build_updates(doc)
            if not updates:
                skipped.append(doc.get("sku"))
                continue
            try:
                res = await coll.update_one({"_id": doc["_id"]}, {"$set": updates})
                applied.append({
                    "sku": doc.get("sku"),
                    "old_subcategory": doc.get("subcategory"),
                    "new_subcategory": updates.get("subcategory"),
                    "flag": SRC_SUBCATS.get(doc.get("subcategory")),
                    "matched": res.matched_count,
                    "modified": res.modified_count,
                })
            except Exception as e:
                errors.append({"sku": doc.get("sku"), "error": str(e)})
                logger.exception("Error updating %s", doc.get("sku"))
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")

    summary = {
        "applied": applied,
        "skipped": skipped,
        "errors": errors,
    }
    SUMMARY_FILE.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Summary: {SUMMARY_FILE}")
    print(f"Applied: {len(applied)}, Errors: {len(errors)}, Skipped: {len(skipped)})")


if __name__ == "__main__":
    asyncio.run(main())
