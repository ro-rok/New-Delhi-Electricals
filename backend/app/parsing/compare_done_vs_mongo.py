"""
Compare Done/*.json SKUs with Mongo products.

Outputs:
- output/done_mongo_comparison.json: counts + missing lists
- output/done_mongo_comparison.txt: human-readable summary

No DB writes.
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Any, Dict, List, Set

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

BASE_DIR = PathLib(__file__).parent
DONE_DIR = BASE_DIR / "Done"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
JSON_OUT = OUTPUT_DIR / "done_mongo_comparison.json"
TEXT_OUT = OUTPUT_DIR / "done_mongo_comparison.txt"


def load_done_skus() -> Set[str]:
    skus: Set[str] = set()
    if not DONE_DIR.exists():
        logger.warning("Done directory not found: %s", DONE_DIR)
        return skus
    for path in sorted(DONE_DIR.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                for p in data:
                    sku = p.get("sku")
                    if sku:
                        skus.add(sku)
        except Exception as e:
            logger.error("Error reading %s: %s", path, e)
    logger.info("Loaded %s unique SKUs from Done/*.json", len(skus))
    return skus


def format_list(items: List[str], limit: int = 50) -> str:
    head = items[:limit]
    more = len(items) - len(head)
    lines = "\n".join(f"  {sku}" for sku in head)
    if more > 0:
        lines += f"\n  ... (+{more} more)"
    return lines


def write_outputs(data: Dict[str, Any]):
    JSON_OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    with open(TEXT_OUT, "w", encoding="utf-8") as f:
        f.write("DONE vs MONGO COMPARISON\n")
        f.write("=" * 80 + "\n")
        f.write(f"Done SKU count: {data['done_count']}\n")
        f.write(f"Mongo SKU count: {data['mongo_count']}\n")
        f.write(f"In Done only: {len(data['missing_in_mongo'])}\n")
        f.write(f"In Mongo only: {len(data['missing_in_done'])}\n\n")
        f.write("Sample Done-only (first 50):\n")
        f.write(format_list(data["missing_in_mongo"]) + "\n\n")
        f.write("Sample Mongo-only (first 50):\n")
        f.write(format_list(data["missing_in_done"]) + "\n")
    logger.info("Wrote %s and %s", JSON_OUT, TEXT_OUT)


async def main():
    print("=" * 80)
    print("Comparing Done/*.json SKUs with Mongo products (no DB writes)")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    done_skus = load_done_skus()

    client = get_client()
    db = get_db()
    coll = db["products"]

    mongo_skus: Set[str] = set()
    async for doc in coll.find({}, {"sku": 1}):
        sku = doc.get("sku")
        if sku:
            mongo_skus.add(sku)

    missing_in_mongo = sorted(done_skus - mongo_skus)
    missing_in_done = sorted(mongo_skus - done_skus)

    data = {
        "done_count": len(done_skus),
        "mongo_count": len(mongo_skus),
        "missing_in_mongo": missing_in_mongo,
        "missing_in_done": missing_in_done,
    }

    write_outputs(data)

    print("Done.")
    print(f"  Done SKU count: {len(done_skus)}")
    print(f"  Mongo SKU count: {len(mongo_skus)}")
    print(f"  In Done only: {len(missing_in_mongo)}")
    print(f"  In Mongo only: {len(missing_in_done)}")
    client.close()
    print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
