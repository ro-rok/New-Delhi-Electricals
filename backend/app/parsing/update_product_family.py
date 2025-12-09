"""
Utility script to rename product families in MongoDB products collection.

Changes applied:
- Signiagrande -> Signia (product_family, series, catalog_source.product_family)
- Fabio Art -> Fabio (product_family, series, catalog_source.product_family)

Usage:
    cd c:/NDE/New-Delhi-Electricals/backend/app/parsing
    python update_product_family.py

Outputs basic stats to stdout.
"""

import asyncio
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Dict

# Add backend directory to path to import app modules
backend_dir = PathLib(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Change to backend directory so .env file can be found
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


async def run_updates(db) -> Dict[str, Dict[str, int]]:
    collection = db["products"]

    mappings = {
        "Signiagrande": "Signia",
        "Fabio Art": "Fabio",
    }

    stats: Dict[str, Dict[str, int]] = {}

    for old, new in mappings.items():
        stats[old] = {"matched": 0, "modified": 0}

        filter_query = {
            "$or": [
                {"product_family": old},
                {"series": old},
                {"catalog_source.product_family": old},
            ]
        }

        update_doc = {
            "$set": {
                "product_family": new,
                "series": new,
                "catalog_source.product_family": new,
            }
        }

        result = await collection.update_many(filter_query, update_doc)
        stats[old]["matched"] = result.matched_count
        stats[old]["modified"] = result.modified_count

    return stats


async def main():
    print("=" * 80)
    print("Updating product families (Signiagrande->Signia, Fabio Art->Fabio)")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()

    try:
        await client.admin.command("ping")
        print("✓ Connected to MongoDB\n")

        stats = await run_updates(db)

        print("Update results:")
        for old, data in stats.items():
            print(f"  {old} -> new name")
            print(f"    matched : {data['matched']}")
            print(f"    modified: {data['modified']}")

    except Exception as e:
        logger.exception("Error during update: %s", e)
        raise
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

