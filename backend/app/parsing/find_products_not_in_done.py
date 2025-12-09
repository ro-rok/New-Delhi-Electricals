"""
Export full products from Mongo that are NOT present in Done/*.json SKU list.

Outputs:
- output/products_not_in_done_full.json : full docs (_id stringified)
- output/products_not_in_done_report.txt : count + sample SKUs

No DB writes.
"""
import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Dict, Any, List

backend_dir = PathLib(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

original_cwd = PathLib.cwd()
backend_path = backend_dir
os.chdir(backend_path)
try:
    from app.db import get_client, get_db
finally:
    os.chdir(original_cwd)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

DONE_DIR = PathLib(__file__).parent / "Done"
OUTPUT_DIR = PathLib(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


def load_done_skus() -> set:
    skus = set()
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
    logger.info("Loaded %s SKUs from Done/*.json", len(skus))
    return skus


async def main():
    print("Finding Mongo products not present in Done/*.json SKU list...")
    done_skus = load_done_skus()
    client = get_client()
    db = get_db()
    coll = db["products"]

    missing: List[Dict[str, Any]] = []
    async for doc in coll.find({}):
        sku = doc.get("sku")
        if not sku or sku in done_skus:
            continue
        doc["_id"] = str(doc.get("_id", ""))
        missing.append(doc)

    json_file = OUTPUT_DIR / "products_not_in_done_full.json"
    report_file = OUTPUT_DIR / "products_not_in_done_report.txt"

    json_file.write_text(json.dumps(missing, indent=2, ensure_ascii=False), encoding="utf-8")
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(f"Not in Done count: {len(missing)}\n")
        f.write("Sample (first 50):\n")
        for doc in missing[:50]:
            f.write(f"  {doc.get('sku')} | {doc.get('name')}\n")

    print(f"Done. Not-in-Done count: {len(missing)}")
    print(f"JSON: {json_file}")
    print(f"Report: {report_file}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
