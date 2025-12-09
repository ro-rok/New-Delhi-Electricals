"""
Find SKUs present in Done/*.json but missing in Mongo products.

Outputs:
- output/missing_from_done.json : list of {sku, name, source_file}
- output/missing_from_done_report.txt : count and sample
No DB writes.
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import List, Dict, Any

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


def load_done_products() -> List[Dict[str, Any]]:
    products: List[Dict[str, Any]] = []
    if not DONE_DIR.exists():
        logger.warning("Done directory not found: %s", DONE_DIR)
        return products
    for path in sorted(DONE_DIR.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                for p in data:
                    p["_source_file"] = path.name
                    products.append(p)
        except Exception as e:
            logger.error("Error reading %s: %s", path, e)
    logger.info("Loaded %s products from Done/*.json", len(products))
    return products


async def main():
    print("Finding SKUs present in Done but missing in Mongo...")
    client = get_client()
    db = get_db()
    coll = db["products"]

    src = load_done_products()
    src_sku_map = {p.get("sku"): p for p in src if p.get("sku")}

    missing = []
    for sku, prod in src_sku_map.items():
        db_doc = await coll.find_one({"sku": sku}, {"_id": 1})
        if not db_doc:
            missing.append({
                "sku": sku,
                "name": prod.get("name"),
                "source_file": prod.get("_source_file", ""),
            })

    json_file = OUTPUT_DIR / "missing_from_done.json"
    report_file = OUTPUT_DIR / "missing_from_done_report.txt"

    json_file.write_text(json.dumps(missing, indent=2, ensure_ascii=False), encoding="utf-8")

    with open(report_file, "w", encoding="utf-8") as f:
        f.write(f"Missing count: {len(missing)}\n")
        f.write("Sample (first 50):\n")
        for m in missing[:50]:
            f.write(f"  {m['sku']} | {m.get('name','')} | {m.get('source_file','')}\n")

    print(f"Done. Missing: {len(missing)}")
    print(f"JSON: {json_file}")
    print(f"Report: {report_file}")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
