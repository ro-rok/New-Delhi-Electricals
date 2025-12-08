"""
Script to find products missing subcategory field.

This script:
1. Finds all products missing subcategory
2. Shows which products have catalog_source.subcategory but not top-level subcategory
3. Groups products by category and product family
4. Saves results to JSON and text files
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def find_products_missing_subcategory(db, collection_name: str = "products") -> Dict[str, Any]:
    """Find products missing subcategory."""
    logger.info("Finding products missing subcategory...")
    
    collection = db[collection_name]
    
    # Get all products
    cursor = collection.find({})
    
    products_missing_subcategory = []
    stats_by_category = defaultdict(int)
    stats_by_family = defaultdict(int)
    
    async for doc in cursor:
        subcategory = doc.get("subcategory")
        category = doc.get("category", "N/A")
        catalog_source = doc.get("catalog_source", {})
        catalog_subcategory = catalog_source.get("subcategory")
        
        # Check if subcategory is missing or empty
        if not subcategory:
            product_info = {
                "_id": str(doc.get("_id", "")),
                "sku": doc.get("sku", "N/A"),
                "name": doc.get("name", "N/A"),
                "category": category,
                "subcategory": subcategory or "N/A",
                "brand": doc.get("brand", "N/A"),
                "product_family": doc.get("product_family") or doc.get("series") or catalog_source.get("product_family", "N/A"),
                "catalog_source_subcategory": catalog_subcategory or "N/A",
                "has_catalog_subcategory": bool(catalog_subcategory),
            }
            products_missing_subcategory.append(product_info)
            
            # Update statistics
            stats_by_category[category] += 1
            family = product_info["product_family"]
            stats_by_family[family] += 1
    
    # Statistics
    total_products = await collection.count_documents({})
    total_with_subcategory = await collection.count_documents({"subcategory": {"$exists": True, "$ne": None}})
    total_with_catalog_subcategory = await collection.count_documents({"catalog_source.subcategory": {"$exists": True, "$ne": None}})
    
    # Group products by category
    grouped_by_category = defaultdict(list)
    for product in products_missing_subcategory:
        grouped_by_category[product["category"]].append(product)
    
    # Group products by product family
    grouped_by_family = defaultdict(list)
    for product in products_missing_subcategory:
        grouped_by_family[product["product_family"]].append(product)
    
    # Group products by whether they have catalog_source.subcategory
    with_catalog_subcategory = [p for p in products_missing_subcategory if p["has_catalog_subcategory"]]
    without_catalog_subcategory = [p for p in products_missing_subcategory if not p["has_catalog_subcategory"]]
    
    return {
        "statistics": {
            "total_products": total_products,
            "total_with_subcategory": total_with_subcategory,
            "total_without_subcategory": len(products_missing_subcategory),
            "total_with_catalog_subcategory": total_with_catalog_subcategory,
            "missing_with_catalog_subcategory": len(with_catalog_subcategory),
            "missing_without_catalog_subcategory": len(without_catalog_subcategory),
            "by_category": dict(stats_by_category),
            "by_family": dict(stats_by_family),
        },
        "products_missing_subcategory": products_missing_subcategory,
        "grouped_by_category": {
            category: products
            for category, products in sorted(grouped_by_category.items())
        },
        "grouped_by_family": {
            family: products
            for family, products in sorted(grouped_by_family.items())
        },
        "with_catalog_subcategory": with_catalog_subcategory,
        "without_catalog_subcategory": without_catalog_subcategory,
    }


async def generate_report(results: Dict[str, Any], output_dir: PathLib) -> None:
    """Generate a human-readable report of products missing subcategory."""
    report_file = output_dir / "products_missing_subcategory_report.txt"
    
    stats = results.get("statistics", {})
    products = results.get("products_missing_subcategory", [])
    grouped_by_category = results.get("grouped_by_category", {})
    grouped_by_family = results.get("grouped_by_family", {})
    with_catalog = results.get("with_catalog_subcategory", [])
    without_catalog = results.get("without_catalog_subcategory", [])
    
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("=" * 80 + "\n")
        f.write("PRODUCTS MISSING SUBCATEGORY REPORT\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("STATISTICS:\n")
        f.write(f"  Total products: {stats.get('total_products', 0):,}\n")
        f.write(f"  Products with subcategory: {stats.get('total_with_subcategory', 0):,}\n")
        f.write(f"  Products missing subcategory: {stats.get('total_without_subcategory', 0):,}\n")
        f.write(f"  Products with catalog_source.subcategory: {stats.get('total_with_catalog_subcategory', 0):,}\n")
        f.write(f"  Missing subcategory but have catalog_source.subcategory: {stats.get('missing_with_catalog_subcategory', 0):,}\n")
        f.write(f"  Missing subcategory and no catalog_source.subcategory: {stats.get('missing_without_catalog_subcategory', 0):,}\n\n")
        
        f.write("MISSING SUBCATEGORY BY CATEGORY:\n")
        by_category = stats.get("by_category", {})
        for category, count in sorted(by_category.items(), key=lambda x: x[1], reverse=True):
            f.write(f"  {category}: {count:,} products\n")
        
        f.write("\nMISSING SUBCATEGORY BY PRODUCT FAMILY:\n")
        by_family = stats.get("by_family", {})
        for family, count in sorted(by_family.items(), key=lambda x: x[1], reverse=True):
            f.write(f"  {family}: {count:,} products\n")
        
        # Products that have catalog_source.subcategory but missing top-level subcategory
        if with_catalog:
            f.write("\n" + "-" * 80 + "\n")
            f.write("PRODUCTS WITH catalog_source.subcategory BUT MISSING TOP-LEVEL subcategory\n")
            f.write(f"(These can be easily fixed by copying catalog_source.subcategory)\n")
            f.write("-" * 80 + "\n\n")
            
            # Group by catalog subcategory
            by_catalog_subcategory = defaultdict(list)
            for product in with_catalog:
                cat_sub = product.get("catalog_source_subcategory", "N/A")
                by_catalog_subcategory[cat_sub].append(product)
            
            for cat_sub, cat_products in sorted(by_catalog_subcategory.items(), key=lambda x: len(x[1]), reverse=True):
                f.write(f"\nCatalog Subcategory: {cat_sub} ({len(cat_products)} products):\n")
                for i, product in enumerate(cat_products[:20], 1):
                    f.write(f"  {i}. SKU: {product.get('sku', 'N/A')} | ")
                    f.write(f"Name: {product.get('name', 'N/A')} | ")
                    f.write(f"Category: {product.get('category', 'N/A')}\n")
                if len(cat_products) > 20:
                    f.write(f"  ... and {len(cat_products) - 20} more\n")
        
        # Products grouped by category
        if grouped_by_category:
            f.write("\n" + "-" * 80 + "\n")
            f.write("PRODUCTS MISSING SUBCATEGORY GROUPED BY CATEGORY\n")
            f.write("-" * 80 + "\n\n")
            
            for category, cat_products in sorted(grouped_by_category.items(), key=lambda x: len(x[1]), reverse=True):
                f.write(f"\n{category} ({len(cat_products)} products):\n")
                for i, product in enumerate(cat_products[:30], 1):
                    f.write(f"  {i}. SKU: {product.get('sku', 'N/A')} | ")
                    f.write(f"Name: {product.get('name', 'N/A')} | ")
                    f.write(f"Family: {product.get('product_family', 'N/A')} | ")
                    f.write(f"Catalog Subcategory: {product.get('catalog_source_subcategory', 'N/A')}\n")
                if len(cat_products) > 30:
                    f.write(f"  ... and {len(cat_products) - 30} more\n")
        
        # Products grouped by family
        if grouped_by_family:
            f.write("\n" + "-" * 80 + "\n")
            f.write("PRODUCTS MISSING SUBCATEGORY GROUPED BY PRODUCT FAMILY\n")
            f.write("-" * 80 + "\n\n")
            
            for family, family_products in sorted(grouped_by_family.items(), key=lambda x: len(x[1]), reverse=True):
                f.write(f"\n{family} ({len(family_products)} products):\n")
                for i, product in enumerate(family_products[:30], 1):
                    f.write(f"  {i}. SKU: {product.get('sku', 'N/A')} | ")
                    f.write(f"Name: {product.get('name', 'N/A')} | ")
                    f.write(f"Category: {product.get('category', 'N/A')} | ")
                    f.write(f"Catalog Subcategory: {product.get('catalog_source_subcategory', 'N/A')}\n")
                if len(family_products) > 30:
                    f.write(f"  ... and {len(family_products) - 30} more\n")
        
        f.write("\n" + "=" * 80 + "\n")
        f.write("End of Report\n")
        f.write("=" * 80 + "\n")
    
    logger.info(f"Report saved to: {report_file}")


async def main():
    """Main function to find products missing subcategory."""
    print("=" * 80, flush=True)
    print("Finding Products Missing Subcategory", flush=True)
    print("=" * 80, flush=True)
    
    # Create output directory
    output_dir = PathLib(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    
    # Connect to MongoDB
    print("\nConnecting to MongoDB...", flush=True)
    print(f"MongoDB URI: {settings.MONGODB_URI}", flush=True)
    print(f"Database: {settings.MONGODB_DB_NAME}", flush=True)
    logger.info("Connecting to MongoDB...")
    logger.info(f"MongoDB URI: {settings.MONGODB_URI}")
    logger.info(f"Database: {settings.MONGODB_DB_NAME}")
    
    client = get_client()
    db = get_db()
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB successfully\n", flush=True)
        logger.info("✓ Connected to MongoDB successfully\n")
        
        # Find products missing subcategory
        results = await find_products_missing_subcategory(db, "products")
        
        stats = results.get("statistics", {})
        products = results.get("products_missing_subcategory", [])
        
        # Print summary
        print("\n" + "=" * 80, flush=True)
        print("RESULTS SUMMARY", flush=True)
        print("=" * 80, flush=True)
        print(f"Total products: {stats.get('total_products', 0):,}", flush=True)
        print(f"Products with subcategory: {stats.get('total_with_subcategory', 0):,}", flush=True)
        print(f"Products missing subcategory: {stats.get('total_without_subcategory', 0):,}", flush=True)
        print(f"Missing but have catalog_source.subcategory: {stats.get('missing_with_catalog_subcategory', 0):,}", flush=True)
        print(f"Missing and no catalog_source.subcategory: {stats.get('missing_without_catalog_subcategory', 0):,}", flush=True)
        
        by_category = stats.get("by_category", {})
        if by_category:
            print(f"\nMissing subcategory by category:", flush=True)
            for category, count in sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"  {category}: {count:,} products", flush=True)
        
        by_family = stats.get("by_family", {})
        if by_family:
            print(f"\nMissing subcategory by product family:", flush=True)
            for family, count in sorted(by_family.items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"  {family}: {count:,} products", flush=True)
        
        if products:
            print(f"\nTop 10 products missing subcategory:", flush=True)
            for i, product in enumerate(products[:10], 1):
                print(f"  {i}. SKU: {product.get('sku', 'N/A')} | "
                      f"Name: {product.get('name', 'N/A')} | "
                      f"Category: {product.get('category', 'N/A')} | "
                      f"Catalog Subcategory: {product.get('catalog_source_subcategory', 'N/A')}", flush=True)
        
        # Save results to JSON
        json_file = output_dir / "products_missing_subcategory.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
        print(f"\n✓ Results saved to: {json_file}", flush=True)
        logger.info(f"Results saved to: {json_file}")
        
        # Generate report
        await generate_report(results, output_dir)
        
        print("=" * 80, flush=True)
        print(f"\nFull JSON results: {json_file}", flush=True)
        print(f"Report: {output_dir / 'products_missing_subcategory_report.txt'}", flush=True)
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        logger.error(f"Error: {str(e)}", exc_info=True)
    finally:
        # Close MongoDB connection
        client.close()
        print("\n✓ MongoDB connection closed", flush=True)
        logger.info("MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
