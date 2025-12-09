"""
Sanity checks for product data (no DB writes):
- Count products
- Missing slug (top-level)
- Slug not prefixed by product_family-
- Missing subcategory
- Missing specs

Outputs: output/sanity_check_report.txt
"""
import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Any, Dict

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
REPORT = OUTPUT_DIR / "sanity_check_report.txt"


def is_missing(val: Any) -> bool:
    if val is None:
        return True
    if isinstance(val, str) and val.strip() == "":
        return True
    if isinstance(val, dict) and len(val) == 0:
        return True
    if isinstance(val, list) and len(val) == 0:
        return True
    return False


def needs_prefix(pf: str, slug: str) -> bool:
    if not pf or not slug:
        return False
    return not slug.lower().startswith(pf.lower() + "-")


async def main():
    print("=" * 80)
    print("Running sanity checks (no DB writes)")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()
    coll = db["products"]

    total = 0
    missing_slug = []
    bad_prefix = []
    missing_subcat = []
    missing_specs = []

    async for doc in coll.find({}):
        total += 1
        sku = doc.get("sku")
        pf = doc.get("product_family") or doc.get("series")
        slug = doc.get("slug")
        subcat = doc.get("subcategory")
        specs = doc.get("specs")

        if is_missing(slug):
            missing_slug.append(sku)
        elif needs_prefix(pf, slug):
            bad_prefix.append({"sku": sku, "product_family": pf, "slug": slug})

        if is_missing(subcat):
            missing_subcat.append(sku)
        if is_missing(specs):
            missing_specs.append(sku)

    with open(REPORT, "w", encoding="utf-8") as f:
        f.write("SANITY CHECK REPORT\n")
        f.write("=" * 80 + "\n")
        f.write(f"Total products: {total}\n")
        f.write(f"Missing slug: {len(missing_slug)}\n")
        f.write(f"Slug missing family prefix: {len(bad_prefix)}\n")
        f.write(f"Missing subcategory: {len(missing_subcat)}\n")
        f.write(f"Missing specs: {len(missing_specs)}\n\n")

        f.write("Sample missing slug (up to 50):\n")
        for sku in missing_slug[:50]:
            f.write(f"  {sku}\n")
        f.write("\nSample bad prefix (up to 50):\n")
        for item in bad_prefix[:50]:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
        f.write("\nSample missing subcategory (up to 50):\n")
        for sku in missing_subcat[:50]:
            f.write(f"  {sku}\n")
        f.write("\nSample missing specs (up to 50):\n")
        for sku in missing_specs[:50]:
            f.write(f"  {sku}\n")

    print(f"Done. Report: {REPORT}")
    client.close()
    print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
