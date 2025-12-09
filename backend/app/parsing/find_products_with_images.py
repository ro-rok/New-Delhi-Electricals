"""
Find all products that have images and export their sku, name, and images.

Rules for images:
- Use top-level `images` if present and non-empty.
- Otherwise, use `media.images` if present and non-empty.
- Each image item may be a string URL or an object with a `url` field; normalize to URLs.

Outputs:
- output/products_with_images.json : list of {sku, name, images}
- output/products_with_images_report.txt : counts by source and a sample list

Usage:
    cd c:/NDE/New-Delhi-Electricals/backend/app/parsing
    python find_products_with_images.py
"""

import asyncio
import json
import logging
import os
import sys
from collections import defaultdict
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
    os.chdir(original_cwd)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def normalize_images(images: Any) -> List[str]:
    urls: List[str] = []
    if not images:
        return urls
    if isinstance(images, list):
        for item in images:
            if isinstance(item, str):
                urls.append(item)
            elif isinstance(item, dict):
                if "url" in item and isinstance(item["url"], str):
                    urls.append(item["url"])
    return [u for u in urls if u]


def extract_images(doc: Dict[str, Any]) -> List[str]:
    # Prefer top-level images
    imgs = normalize_images(doc.get("images"))
    if imgs:
        return imgs
    # Fallback to media.images
    media = doc.get("media") or {}
    return normalize_images(media.get("images"))


def product_stub(doc: Dict[str, Any], images: List[str]) -> Dict[str, Any]:
    return {
        "sku": doc.get("sku"),
        "name": doc.get("name"),
        "images": images,
    }


async def find_with_images(db, collection_name: str = "products") -> Dict[str, Any]:
    collection = db[collection_name]
    cursor = collection.find({})

    products: List[Dict[str, Any]] = []
    count_top_level = 0
    count_media = 0

    total = 0
    async for doc in cursor:
        total += 1
        imgs = extract_images(doc)
        if imgs:
            products.append(product_stub(doc, imgs))
            # simple source detection
            if doc.get("images"):
                count_top_level += 1
            elif (doc.get("media") or {}).get("images"):
                count_media += 1

    return {
        "statistics": {
            "total_products": total,
            "with_images": len(products),
            "from_top_level_images": count_top_level,
            "from_media_images": count_media,
        },
        "products_with_images": products,
    }


def write_outputs(results: Dict[str, Any], output_dir: PathLib) -> None:
    output_dir.mkdir(exist_ok=True)

    json_file = output_dir / "products_with_images.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    logger.info("Saved JSON to %s", json_file)

    report_file = output_dir / "products_with_images_report.txt"
    stats = results.get("statistics", {})
    products = results.get("products_with_images", [])

    with open(report_file, "w", encoding="utf-8") as f:
        f.write("=" * 80 + "\n")
        f.write("PRODUCTS WITH IMAGES\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Total products: {stats.get('total_products', 0):,}\n")
        f.write(f"Products with images: {stats.get('with_images', 0):,}\n")
        f.write(f"From top-level images: {stats.get('from_top_level_images', 0):,}\n")
        f.write(f"From media.images: {stats.get('from_media_images', 0):,}\n\n")

        f.write("SAMPLE (first 50):\n")
        for prod in products[:50]:
            imgs = prod.get("images", [])
            f.write(f"  SKU {prod.get('sku')} | {prod.get('name')} | images: {imgs[:3]}\n")
        f.write("\n" + "=" * 80 + "\n")
        f.write("End of Report\n")
        f.write("=" * 80 + "\n")

    logger.info("Report written to %s", report_file)


async def main():
    print("=" * 80, flush=True)
    print("Finding products with images", flush=True)
    print("=" * 80, flush=True)
    print(f"MongoDB URI: {settings.MONGODB_URI}", flush=True)
    print(f"Database: {settings.MONGODB_DB_NAME}\n", flush=True)

    output_dir = PathLib(__file__).parent / "output"

    client = get_client()
    db = get_db()

    try:
        await client.admin.command("ping")
        results = await find_with_images(db, "products")
        write_outputs(results, output_dir)

        print("Done. Outputs:", flush=True)
        print(f"  JSON: {output_dir / 'products_with_images.json'}", flush=True)
        print(f"  Report: {output_dir / 'products_with_images_report.txt'}", flush=True)

    except Exception as e:
        logger.exception("Error during find-with-images: %s", e)
        raise
    finally:
        client.close()
        print("\n✓ MongoDB connection closed", flush=True)


if __name__ == "__main__":
    asyncio.run(main())

