"""
Export all products with all fields to JSON.

Outputs:
- output/all_products_full.json : array of full product documents, _id stringified

Usage:
    cd c:/NDE/New-Delhi-Electricals/backend/app/parsing
    python export_all_products.py
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib

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


async def export_all(db):
    collection = db["products"]
    cursor = collection.find({})
    docs = []
    async for doc in cursor:
        doc["_id"] = str(doc.get("_id", ""))
        docs.append(doc)
    return docs


async def main():
    print("=" * 80)
    print("Exporting all products to JSON")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    output_dir = PathLib(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / "all_products_full.json"

    client = get_client()
    db = get_db()

    try:
        await client.admin.command("ping")
        docs = await export_all(db)
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(docs, f, ensure_ascii=False, indent=2)
        print(f"Exported {len(docs)} products to {output_file}")
    except Exception as e:
        logger.exception("Error during export: %s", e)
        raise
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

