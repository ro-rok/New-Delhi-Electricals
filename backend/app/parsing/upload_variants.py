"""
Upload generated variants into MongoDB.

Behavior:
- Reads a variants JSON file (default: output/generated_variants.json) with entries:
    { "sku": "ABC", "variant": { "SIB1": "ColorOrSize", ... } }
- For each SKU, merges into the existing `variant` field on the product document.
- Skips documents not found.

Usage:
    python backend/app/parsing/upload_variants.py \
        --input backend/app/parsing/output/generated_variants.json \
        --collection products \
        [--dry-run] [--limit 100]
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

from bson import ObjectId

# Ensure backend modules are importable
CURRENT_DIR = Path(__file__).parent
BACKEND_DIR = CURRENT_DIR.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Change to backend dir to load env if needed
os.chdir(BACKEND_DIR)

from app.db import get_client, get_db  # type: ignore


def load_variants(path: Path) -> List[Dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("Variants file must be a JSON array")
    return data


async def upload_variants(
    input_path: Path,
    collection_name: str,
    dry_run: bool = False,
    limit: int | None = None,
) -> Dict[str, Any]:
    client = get_client()
    db = get_db()
    collection = db[collection_name]

    variants = load_variants(input_path)
    if limit:
        variants = variants[:limit]

    stats = {
        "total": len(variants),
        "updated": 0,
        "skipped_not_found": 0,
        "skipped_empty_variant": 0,
        "errors": 0,
    }

    for entry in variants:
        sku = entry.get("sku")
        new_variant = entry.get("variant") or {}
        if not sku or not isinstance(new_variant, dict) or not new_variant:
            stats["skipped_empty_variant"] += 1
            continue

        doc = await collection.find_one({"sku": sku})
        if not doc:
            stats["skipped_not_found"] += 1
            continue

        existing_variant = doc.get("variant") or {}
        if not isinstance(existing_variant, dict):
            existing_variant = {}

        merged_variant = {**existing_variant, **new_variant}
        # If nothing changes, skip update
        if merged_variant == existing_variant:
            continue

        if dry_run:
            print(f"[DRY-RUN] Would update {sku}: +{len(new_variant)} entries")
            stats["updated"] += 1
            continue

        try:
            await collection.update_one(
                {"_id": doc["_id"] if isinstance(doc["_id"], ObjectId) else doc["_id"]},
                {"$set": {"variant": merged_variant}},
            )
            stats["updated"] += 1
        except Exception as e:
            stats["errors"] += 1
            print(f"Error updating {sku}: {e}")

    client.close()
    return stats


async def main() -> None:
    parser = argparse.ArgumentParser(description="Upload generated variants into MongoDB.")
    parser.add_argument(
        "--input",
        type=Path,
        default=CURRENT_DIR / "output" / "generated_variants.json",
        help="Path to variants JSON file.",
    )
    parser.add_argument(
        "--collection",
        type=str,
        default="products",
        help="MongoDB collection name.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="If set, do not persist changes; just log actions.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of entries to process (for testing).",
    )
    args = parser.parse_args()

    stats = await upload_variants(
        input_path=args.input,
        collection_name=args.collection,
        dry_run=args.dry_run,
        limit=args.limit,
    )
    print("Done:", stats)


if __name__ == "__main__":
    asyncio.run(main())

