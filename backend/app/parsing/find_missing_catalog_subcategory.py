"""
Find products missing catalog_source.subcategory.

Outputs:
- output/missing_catalog_subcategory.json : full list
- output/missing_catalog_subcategory_report.txt : human-readable summary

Definition of missing catalog_source.subcategory:
- catalog_source.subcategory does not exist OR is null/empty string.
"""

import asyncio
import json
import logging
import os
import sys
from collections import defaultdict
from pathlib import Path as PathLib
from typing import Any, Dict

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


def product_stub(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "_id": str(doc.get("_id", "")),
        "sku": doc.get("sku"),
        "name": doc.get("name"),
        "category": doc.get("category"),
        "subcategory": doc.get("subcategory"),
        "brand": doc.get("brand"),
        "product_family": doc.get("product_family") or doc.get("series"),
        "catalog_source_subcategory": doc.get("catalog_source", {}).get("subcategory"),
    }


async def find_missing(db, collection_name: str = "products") -> Dict[str, Any]:
    collection = db[collection_name]

    filter_query = {
        "$or": [
            {"catalog_source.subcategory": {"$exists": False}},
            {"catalog_source.subcategory": {"$exists": True, "$eq": None}},
            {"catalog_source.subcategory": ""},
        ]
    }

    cursor = collection.find(filter_query)

    missing_products = []
    by_category = defaultdict(int)
    by_family = defaultdict(int)

    total_missing = 0
    async for doc in cursor:
        total_missing += 1
        stub = product_stub(doc)
        missing_products.append(stub)
        by_category[stub.get("category") or "Unknown"] += 1
        by_family[stub.get("product_family") or "Unknown"] += 1

    total_products = await collection.count_documents({})

    return {
        "statistics": {
            "total_products": total_products,
            "total_missing_catalog_subcategory": total_missing,
            "by_category": dict(by_category),
            "by_family": dict(by_family),
        },
        "products_missing_catalog_subcategory": missing_products,
    }


def write_outputs(results: Dict[str, Any], output_dir: PathLib) -> None:
    output_dir.mkdir(exist_ok=True)

    # JSON
    json_file = output_dir / "missing_catalog_subcategory.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    logger.info("Saved JSON to %s", json_file)

    # Report
    report_file = output_dir / "missing_catalog_subcategory_report.txt"
    stats = results.get("statistics", {})
    products = results.get("products_missing_catalog_subcategory", [])
    by_category = stats.get("by_category", {})
    by_family = stats.get("by_family", {})

    with open(report_file, "w", encoding="utf-8") as f:
        f.write("=" * 80 + "\n")
        f.write("PRODUCTS MISSING catalog_source.subcategory\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Total products: {stats.get('total_products', 0):,}\n")
        f.write(f"Missing catalog_source.subcategory: {stats.get('total_missing_catalog_subcategory', 0):,}\n\n")

        f.write("BY CATEGORY:\n")
        for cat, cnt in sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:30]:
            f.write(f"  {cat}: {cnt:,}\n")

        f.write("\nBY PRODUCT FAMILY:\n")
        for fam, cnt in sorted(by_family.items(), key=lambda x: x[1], reverse=True)[:30]:
            f.write(f"  {fam}: {cnt:,}\n")

        if products:
            f.write("\nSAMPLE (first 50):\n")
            for prod in products[:50]:
                f.write(
                    f"  SKU {prod.get('sku')} | {prod.get('name')} | "
                    f"category={prod.get('category')} | subcategory={prod.get('subcategory')}\n"
                )

        f.write("\n" + "=" * 80 + "\n")
        f.write("End of Report\n")
        f.write("=" * 80 + "\n")

    logger.info("Report written to %s", report_file)


async def main():
    print("=" * 80)
    print("Finding products missing catalog_source.subcategory")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    output_dir = PathLib(__file__).parent / "output"

    client = get_client()
    db = get_db()

    try:
        await client.admin.command("ping")
        results = await find_missing(db, "products")
        write_outputs(results, output_dir)

        print("Done. Outputs:")
        print(f"  JSON: {output_dir / 'missing_catalog_subcategory.json'}")
        print(f"  Report: {output_dir / 'missing_catalog_subcategory_report.txt'}")

    except Exception as e:
        logger.exception("Error during find-missing: %s", e)
        raise
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

