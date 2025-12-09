"""
Move top-level subcategory into catalog_source.subcategory and remove the top-level subcategory.

Rules:
- If top-level subcategory exists (non-empty), set catalog_source.subcategory to that value.
- Then unset the top-level subcategory field.
- If catalog_source.subcategory already exists, it will be overwritten with the top-level value.

Usage:
    cd c:/NDE/New-Delhi-Electricals/backend/app/parsing
    python move_subcategory_to_catalog_source.py
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


async def run_update(db) -> Dict[str, int]:
    collection = db["products"]

    # Match documents that have a non-null/ non-empty subcategory
    filter_query = {
        "subcategory": {"$exists": True, "$ne": None, "$ne": ""}
    }

    update_doc = {
        "$set": {"catalog_source.subcategory": "$subcategory"},  # use pipeline update
        "$unset": {"subcategory": ""},
    }

    # Use aggregation pipeline form to copy value
    result = await collection.update_many(
        filter_query,
        [
            {"$set": {"catalog_source.subcategory": "$subcategory"}},
            {"$unset": "subcategory"},
        ],
    )

    return {
        "matched": result.matched_count,
        "modified": result.modified_count,
    }


async def main():
    print("=" * 80)
    print("Moving top-level subcategory into catalog_source.subcategory")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()

    try:
        await client.admin.command("ping")
        print("✓ Connected to MongoDB\n")

        stats = await run_update(db)

        print("Update results:")
        print(f"  matched : {stats['matched']}")
        print(f"  modified: {stats['modified']}")

    except Exception as e:
        logger.exception("Error during update: %s", e)
        raise
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

