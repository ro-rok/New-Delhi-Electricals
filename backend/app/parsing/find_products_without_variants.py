"""
List products in MongoDB that have no variants (missing or empty `variant` field).

Outputs:
- Prints the total count and a short sample to stdout
- Saves full results to output/products_missing_variants.json

Usage:
    cd backend/app/parsing
    python find_products_without_variants.py
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Any, Dict, List

# Make backend imports work when running directly
backend_dir = PathLib(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Ensure .env is found
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

OUTPUT_PATH = PathLib(__file__).parent / "output" / "products_missing_variants.json"


async def fetch_missing_variants(db) -> List[Dict[str, Any]]:
    """Return products whose `variant` field is missing or empty (array or dict)."""
    collection = db["products"]
    cursor = collection.find(
        {
            "$or": [
                {"variant": {"$exists": False}},
                {"variant": []},   # empty list
                {"variant": {}},   # empty dict
            ]
        },
        {
            "_id": 0,
            "sku": 1,
            "name": 1,
            "category": 1,
            "product_family": 1,
            "series": 1,
        },
    )

    results: List[Dict[str, Any]] = []
    async for doc in cursor:
        results.append(doc)
    return results


def write_output(rows: List[Dict[str, Any]]):
    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    logger.info("Saved full list to %s", OUTPUT_PATH)


async def main():
    print("=" * 80)
    print("Finding products without variants in MongoDB")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()

    try:
        await client.admin.command("ping")
        rows = await fetch_missing_variants(db)
        count = len(rows)
        write_output(rows)

        print(f"Products without variants: {count}")
        sample = rows[:10]
        if sample:
            print("\nSample (first 10):")
            print(json.dumps(sample, indent=2))
        else:
            print("\nNo products without variants 🎉")
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

