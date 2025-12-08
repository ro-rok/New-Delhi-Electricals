"""
Script to find products with duplicate slugs in MongoDB.

This script:
1. Queries all products with slugs
2. Groups products by slug value
3. Identifies duplicate slugs (slugs used by multiple products)
4. Displays which products share the same slug
5. Saves results to JSON and text files
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


async def find_duplicate_slugs(db, collection_name: str = "products") -> Dict[str, Any]:
    """Find all products with duplicate slugs."""
    logger.info("Finding products with duplicate slugs...")
    
    collection = db[collection_name]
    
    # Get all products with slugs
    # Check multiple possible slug locations
    cursor = collection.find({
        "$or": [
            {"catalog_source.seo.slug": {"$exists": True, "$ne": None}},
            {"catalog_source.slug": {"$exists": True, "$ne": None}},
            {"seo.slug": {"$exists": True, "$ne": None}},
            {"slug": {"$exists": True, "$ne": None}},
        ]
    })
    
    # Group products by slug
    slug_to_products: Dict[str, List[Dict]] = defaultdict(list)
    
    async for doc in cursor:
        # Extract slug from multiple possible locations
        slug = (
            doc.get("catalog_source", {}).get("seo", {}).get("slug") or
            doc.get("catalog_source", {}).get("slug") or
            doc.get("seo", {}).get("slug") or
            doc.get("slug")
        )
        
        if slug:
            # Store product info
            product_info = {
                "_id": str(doc.get("_id", "")),
                "sku": doc.get("sku", "N/A"),
                "name": doc.get("name", "N/A"),
                "category": doc.get("category", "N/A"),
                "subcategory": doc.get("subcategory", "N/A"),
                "brand": doc.get("brand", "N/A"),
                "product_family": doc.get("product_family") or doc.get("series", "N/A"),
            }
            slug_to_products[slug].append(product_info)
    
    # Find duplicates (slugs with more than one product)
    duplicates = {
        slug: products
        for slug, products in slug_to_products.items()
        if len(products) > 1
    }
    
    # Statistics
    total_products_with_slugs = sum(len(products) for products in slug_to_products.values())
    total_unique_slugs = len(slug_to_products)
    total_duplicate_slugs = len(duplicates)
    total_products_with_duplicates = sum(len(products) for products in duplicates.values())
    
    return {
        "statistics": {
            "total_products_with_slugs": total_products_with_slugs,
            "total_unique_slugs": total_unique_slugs,
            "total_duplicate_slugs": total_duplicate_slugs,
            "total_products_with_duplicate_slugs": total_products_with_duplicates,
        },
        "duplicates": duplicates,
        "all_slugs": {slug: len(products) for slug, products in sorted(slug_to_products.items())}
    }


async def generate_report(results: Dict[str, Any], output_dir: PathLib) -> None:
    """Generate a human-readable report of duplicate slugs."""
    report_file = output_dir / "duplicate_slugs_report.txt"
    
    stats = results.get("statistics", {})
    duplicates = results.get("duplicates", {})
    
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("=" * 80 + "\n")
        f.write("DUPLICATE SLUGS REPORT\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("STATISTICS:\n")
        f.write(f"  Total products with slugs: {stats.get('total_products_with_slugs', 0):,}\n")
        f.write(f"  Total unique slugs: {stats.get('total_unique_slugs', 0):,}\n")
        f.write(f"  Duplicate slugs found: {stats.get('total_duplicate_slugs', 0):,}\n")
        f.write(f"  Products with duplicate slugs: {stats.get('total_products_with_duplicate_slugs', 0):,}\n\n")
        
        if duplicates:
            f.write("-" * 80 + "\n")
            f.write("DUPLICATE SLUGS DETAILS\n")
            f.write("-" * 80 + "\n\n")
            
            # Sort by number of duplicates (most duplicates first)
            sorted_duplicates = sorted(
                duplicates.items(),
                key=lambda x: len(x[1]),
                reverse=True
            )
            
            for slug, products in sorted_duplicates:
                f.write(f"Slug: {slug}\n")
                f.write(f"  Used by {len(products)} product(s):\n")
                for i, product in enumerate(products, 1):
                    f.write(f"    {i}. SKU: {product.get('sku', 'N/A')}\n")
                    f.write(f"       Name: {product.get('name', 'N/A')}\n")
                    f.write(f"       Category: {product.get('category', 'N/A')}\n")
                    f.write(f"       Subcategory: {product.get('subcategory', 'N/A')}\n")
                    f.write(f"       Brand: {product.get('brand', 'N/A')}\n")
                    f.write(f"       Product Family: {product.get('product_family', 'N/A')}\n")
                    f.write(f"       _id: {product.get('_id', 'N/A')}\n")
                f.write("\n")
        else:
            f.write("\nNo duplicate slugs found! All slugs are unique.\n")
        
        f.write("=" * 80 + "\n")
        f.write("End of Report\n")
        f.write("=" * 80 + "\n")
    
    logger.info(f"Report saved to: {report_file}")


async def main():
    """Main function to find duplicate slugs."""
    import sys
    sys.stdout.flush()
    
    # Create output directory first
    output_dir = PathLib(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    
    # Test file write
    test_file = output_dir / "test_run.txt"
    with open(test_file, "w") as f:
        f.write("Script started\n")
    
    print("=" * 80, flush=True)
    print("Finding Products with Duplicate Slugs", flush=True)
    print("=" * 80, flush=True)
    
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
        
        # Find duplicate slugs
        results = await find_duplicate_slugs(db, "products")
        
        stats = results.get("statistics", {})
        duplicates = results.get("duplicates", {})
        
        # Print summary
        print("\n" + "=" * 80, flush=True)
        print("RESULTS SUMMARY", flush=True)
        print("=" * 80, flush=True)
        print(f"Total products with slugs: {stats.get('total_products_with_slugs', 0):,}", flush=True)
        print(f"Total unique slugs: {stats.get('total_unique_slugs', 0):,}", flush=True)
        print(f"Duplicate slugs found: {stats.get('total_duplicate_slugs', 0):,}", flush=True)
        print(f"Products with duplicate slugs: {stats.get('total_products_with_duplicate_slugs', 0):,}", flush=True)
        
        if duplicates:
            print(f"\nTop 10 duplicate slugs (by number of products):", flush=True)
            sorted_duplicates = sorted(
                duplicates.items(),
                key=lambda x: len(x[1]),
                reverse=True
            )
            for i, (slug, products) in enumerate(sorted_duplicates[:10], 1):
                print(f"  {i}. '{slug}': {len(products)} products", flush=True)
        
        # Save results to JSON
        json_file = output_dir / "duplicate_slugs.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
        print(f"\n✓ Results saved to: {json_file}", flush=True)
        logger.info(f"Results saved to: {json_file}")
        
        # Generate report
        await generate_report(results, output_dir)
        
        print("=" * 80, flush=True)
        print(f"\nFull JSON results: {json_file}", flush=True)
        print(f"Report: {output_dir / 'duplicate_slugs_report.txt'}", flush=True)
        
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
