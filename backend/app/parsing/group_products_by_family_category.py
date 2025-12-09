"""
Group all products by product_family and category/subcategory.
Also generate a report of missing fields (category, subcategory, specs, SEO fields).

Outputs:
- output/grouped_products.json: grouped products and counts
- output/grouped_products_report.txt: human-readable summary + missing fields stats
"""

import asyncio
import json
import logging
import os
import sys
from collections import defaultdict
from pathlib import Path
from pathlib import Path as PathLib
from typing import Any, Dict, List

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
    # Restore original working directory
    os.chdir(original_cwd)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def product_stub(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "_id": str(doc.get("_id", "")),
        "sku": doc.get("sku"),
        "name": doc.get("name"),
        "category": doc.get("category"),
        "subcategory": doc.get("subcategory"),
        "brand": doc.get("brand"),
        "product_family": doc.get("product_family") or doc.get("series"),
    }


def analyze_missing(doc: Dict[str, Any]) -> List[str]:
    missing = []
    catalog_source = doc.get("catalog_source", {}) or {}
    seo = catalog_source.get("seo", {}) or {}
    if not doc.get("category"):
        missing.append("category")
    if not doc.get("subcategory"):
        missing.append("subcategory")
    if not doc.get("specs"):
        missing.append("specs")
    else:
        if isinstance(doc.get("specs"), dict) and len(doc.get("specs")) == 0:
            missing.append("specs")
    if not seo.get("slug"):
        missing.append("catalog_source.seo.slug")
    if not seo.get("keywords"):
        missing.append("catalog_source.seo.keywords")
    if not seo.get("meta_description"):
        missing.append("catalog_source.seo.meta_description")
    return missing


async def build_groupings(db, collection_name: str = "products") -> Dict[str, Any]:
    collection = db[collection_name]
    cursor = collection.find({})

    by_family: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"count": 0, "products": []})
    by_category: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"count": 0, "subcategories": defaultdict(lambda: {"count": 0, "products": []})})
    missing_stats = defaultdict(int)
    missing_products: List[Dict[str, Any]] = []

    total = 0
    async for doc in cursor:
        total += 1
        stub = product_stub(doc)
        family = stub.get("product_family") or "Unknown"
        category = stub.get("category") or "Unknown"
        subcategory = stub.get("subcategory") or "Unknown"

        by_family[family]["count"] += 1
        by_family[family]["products"].append(stub)

        by_category[category]["count"] += 1
        by_category[category]["subcategories"][subcategory]["count"] += 1
        by_category[category]["subcategories"][subcategory]["products"].append(stub)

        missing = analyze_missing(doc)
        if missing:
            missing_products.append({"product": stub, "missing": missing})
            for field in missing:
                missing_stats[field] += 1

    # Normalize subcategory dicts
    by_category_final = {}
    for cat, data in by_category.items():
        subcats = data["subcategories"]
        by_category_final[cat] = {
            "count": data["count"],
            "subcategories": {sc: subcats[sc] for sc in sorted(subcats)}
        }

    return {
        "statistics": {
            "total_products": total,
            "missing_counts": dict(missing_stats),
            "missing_products": len(missing_products),
        },
        "by_product_family": {fam: by_family[fam] for fam in sorted(by_family)},
        "by_category": by_category_final,
        "missing_products": missing_products,
    }


def write_report(data: Dict[str, Any], output_dir: PathLib) -> None:
    report = output_dir / "grouped_products_report.txt"
    stats = data.get("statistics", {})
    by_family = data.get("by_product_family", {})
    by_category = data.get("by_category", {})
    missing_counts = stats.get("missing_counts", {})
    missing_products = data.get("missing_products", [])

    with open(report, "w", encoding="utf-8") as f:
        f.write("=" * 80 + "\n")
        f.write("GROUPED PRODUCTS REPORT\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Total products: {stats.get('total_products', 0):,}\n")
        f.write(f"Products with missing fields: {stats.get('missing_products', 0):,}\n\n")

        f.write("MISSING FIELDS COUNTS:\n")
        for field, count in sorted(missing_counts.items(), key=lambda x: x[1], reverse=True):
            f.write(f"  {field}: {count:,}\n")

        f.write("\nTOP PRODUCT FAMILIES (by count):\n")
        for fam, info in sorted(by_family.items(), key=lambda x: x[1]["count"], reverse=True)[:20]:
            f.write(f"  {fam}: {info['count']:,}\n")

        f.write("\nTOP CATEGORIES (by count):\n")
        for cat, info in sorted(by_category.items(), key=lambda x: x[1]["count"], reverse=True)[:20]:
            f.write(f"  {cat}: {info['count']:,}\n")

        if missing_products:
            f.write("\nPRODUCTS WITH MISSING FIELDS (first 50):\n")
            for item in missing_products[:50]:
                prod = item["product"]
                missing = ", ".join(item["missing"])
                f.write(f"  SKU {prod.get('sku')}: {prod.get('name')} | Missing: {missing}\n")

        f.write("\n" + "=" * 80 + "\n")
        f.write("End of Report\n")
        f.write("=" * 80 + "\n")

    logger.info("Report written to %s", report)


async def main():
    print("=" * 80)
    print("Grouping products by family, category, subcategory and summarizing missing fields")
    print("=" * 80)

    output_dir = PathLib(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)

    client = get_client()
    db = get_db()

    try:
        await client.admin.command("ping")
        data = await build_groupings(db, "products")

        json_file = output_dir / "grouped_products.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        logger.info("Grouped products JSON saved to %s", json_file)

        write_report(data, output_dir)

        print("\nDone. Outputs:")
        print(f"  JSON: {json_file}")
        print(f"  Report: {output_dir / 'grouped_products_report.txt'}")

    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

