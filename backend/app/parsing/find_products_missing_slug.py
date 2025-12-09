"""
Find products missing top-level slug and dump full documents.

Criteria: slug missing or empty.
Outputs:
- output/products_missing_slug.json : list of full docs (_id stringified)
- output/products_missing_slug_report.txt : count and sample SKUs
No DB writes.
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib

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


async def main():
    print("=" * 80)
    print("Finding products missing slug (no updates)")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()
    collection = db["products"]

    missing = []
    async for doc in collection.find({"$or": [{"slug": {"$exists": False}}, {"slug": {"$in": [None, ""]}}]}):
        doc["_id"] = str(doc.get("_id", ""))
        missing.append(doc)

    json_file = OUTPUT_DIR / "products_missing_slug.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(missing, f, indent=2, ensure_ascii=False)

    report = OUTPUT_DIR / "products_missing_slug_report.txt"
    with open(report, "w", encoding="utf-8") as f:
        f.write(f"Missing slug count: {len(missing)}\n")
        f.write("Sample SKUs (first 50):\n")
        for doc in missing[:50]:
            f.write(f"  {doc.get('sku')} | {doc.get('name')}\n")

    print(f"Done. Missing slug count: {len(missing)}")
    print(f"JSON: {json_file}")
    print(f"Report: {report}")

    client.close()
    print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
