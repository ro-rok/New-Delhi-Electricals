"""
Script to find products missing SEO fields (slug, keywords, meta_description) and specs.

This script:
1. Finds products that have catalog_source but are missing SEO fields
2. Finds products that are missing specs
3. Identifies which specific fields are missing
4. Groups products by what fields they're missing
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


async def find_products_missing_seo(db, collection_name: str = "products") -> Dict[str, Any]:
    """Find products missing SEO fields and specs."""
    logger.info("Finding products missing SEO fields and specs...")
    
    collection = db[collection_name]
    
    # Get all products
    cursor = collection.find({})
    
    products_missing_seo = []
    products_missing_specs = []
    products_missing_category = []
    missing_fields_stats = defaultdict(int)
    missing_specs_stats = defaultdict(int)
    missing_category_stats = defaultdict(int)
    
    async for doc in cursor:
        catalog_source = doc.get("catalog_source", {})
        specs = doc.get("specs", {})
        category = doc.get("category")
        subcategory = doc.get("subcategory")
        
        missing_fields = []
        missing_specs_fields = []
        missing_category_fields = []
        
        # Check SEO fields if catalog_source exists
        if catalog_source:
            seo = catalog_source.get("seo", {})
            
            # Check if seo object exists at all
            if not seo:
                missing_fields.extend([
                    "catalog_source.seo.slug",
                    "catalog_source.seo.keywords",
                    "catalog_source.seo.meta_description"
                ])
            else:
                # Check for slug
                if not seo.get("slug"):
                    missing_fields.append("catalog_source.seo.slug")
                
                # Check for keywords
                keywords = seo.get("keywords")
                if not keywords or (isinstance(keywords, list) and len(keywords) == 0):
                    missing_fields.append("catalog_source.seo.keywords")
                
                # Check for meta_description
                if not seo.get("meta_description"):
                    missing_fields.append("catalog_source.seo.meta_description")
        
        # Check specs
        if not specs:
            missing_specs_fields.append("specs")
        else:
            # Check if specs is an empty dict
            if isinstance(specs, dict) and len(specs) == 0:
                missing_specs_fields.append("specs")
        
        # If any SEO fields are missing, record this product
        if missing_fields:
            product_info = {
                "_id": str(doc.get("_id", "")),
                "sku": doc.get("sku", "N/A"),
                "name": doc.get("name", "N/A"),
                "category": doc.get("category", "N/A"),
                "subcategory": doc.get("subcategory", "N/A"),
                "brand": doc.get("brand", "N/A"),
                "product_family": doc.get("product_family") or doc.get("series") or catalog_source.get("product_family", "N/A"),
                "catalog_source_exists": bool(catalog_source),
                "seo_exists": bool(catalog_source.get("seo", {})) if catalog_source else False,
                "missing_fields": missing_fields,
                "has_slug": bool(catalog_source.get("seo", {}).get("slug")) if catalog_source else False,
                "has_keywords": bool(catalog_source.get("seo", {}).get("keywords")) if catalog_source else False,
                "has_meta_description": bool(catalog_source.get("seo", {}).get("meta_description")) if catalog_source else False,
            }
            products_missing_seo.append(product_info)
            
            # Update statistics
            for field in missing_fields:
                missing_fields_stats[field] += 1
        
        # If specs are missing, record this product
        if missing_specs_fields:
            product_info = {
                "_id": str(doc.get("_id", "")),
                "sku": doc.get("sku", "N/A"),
                "name": doc.get("name", "N/A"),
                "category": doc.get("category", "N/A"),
                "subcategory": doc.get("subcategory", "N/A"),
                "brand": doc.get("brand", "N/A"),
                "product_family": doc.get("product_family") or doc.get("series") or catalog_source.get("product_family", "N/A"),
                "specs_exists": bool(specs),
                "missing_specs_fields": missing_specs_fields,
            }
            products_missing_specs.append(product_info)
            
            # Update statistics
            for field in missing_specs_fields:
                missing_specs_stats[field] += 1
        
        # Check for missing category/subcategory
        if not category:
            missing_category_fields.append("category")
        if not subcategory:
            missing_category_fields.append("subcategory")
        
        # If category/subcategory are missing, record this product
        if missing_category_fields:
            product_info = {
                "_id": str(doc.get("_id", "")),
                "sku": doc.get("sku", "N/A"),
                "name": doc.get("name", "N/A"),
                "category": category or "N/A",
                "subcategory": subcategory or "N/A",
                "brand": doc.get("brand", "N/A"),
                "product_family": doc.get("product_family") or doc.get("series") or catalog_source.get("product_family", "N/A"),
                "catalog_source_category": catalog_source.get("subcategory", "N/A"),
                "missing_category_fields": missing_category_fields,
            }
            products_missing_category.append(product_info)
            
            # Update statistics
            for field in missing_category_fields:
                missing_category_stats[field] += 1
    
    # Group products by missing field combinations
    grouped_by_missing = defaultdict(list)
    for product in products_missing_seo:
        missing_key = ", ".join(sorted(product["missing_fields"]))
        grouped_by_missing[missing_key].append(product)
    
    # Group products by missing field combinations
    grouped_by_missing = defaultdict(list)
    for product in products_missing_seo:
        missing_key = ", ".join(sorted(product["missing_fields"]))
        grouped_by_missing[missing_key].append(product)
    
    # Group products missing specs
    grouped_by_missing_specs = defaultdict(list)
    for product in products_missing_specs:
        missing_key = ", ".join(sorted(product["missing_specs_fields"]))
        grouped_by_missing_specs[missing_key].append(product)
    
    # Group products missing category/subcategory
    grouped_by_missing_category = defaultdict(list)
    for product in products_missing_category:
        missing_key = ", ".join(sorted(product["missing_category_fields"]))
        grouped_by_missing_category[missing_key].append(product)
    
    # Statistics
    total_products = await collection.count_documents({})
    total_with_catalog_source = await collection.count_documents({"catalog_source": {"$exists": True}})
    total_with_seo = await collection.count_documents({"catalog_source.seo": {"$exists": True}})
    total_with_slug = await collection.count_documents({"catalog_source.seo.slug": {"$exists": True, "$ne": None}})
    total_with_keywords = await collection.count_documents({"catalog_source.seo.keywords": {"$exists": True, "$ne": None}})
    total_with_meta_description = await collection.count_documents({"catalog_source.seo.meta_description": {"$exists": True, "$ne": None}})
    total_with_specs = await collection.count_documents({"specs": {"$exists": True, "$ne": None}})
    total_with_category = await collection.count_documents({"category": {"$exists": True, "$ne": None}})
    total_with_subcategory = await collection.count_documents({"subcategory": {"$exists": True, "$ne": None}})
    
    return {
        "statistics": {
            "total_products": total_products,
            "total_with_catalog_source": total_with_catalog_source,
            "total_with_seo": total_with_seo,
            "total_with_slug": total_with_slug,
            "total_with_keywords": total_with_keywords,
            "total_with_meta_description": total_with_meta_description,
            "total_with_specs": total_with_specs,
            "total_with_category": total_with_category,
            "total_with_subcategory": total_with_subcategory,
            "total_missing_seo_fields": len(products_missing_seo),
            "total_missing_specs": len(products_missing_specs),
            "total_missing_category": len(products_missing_category),
            "missing_fields_counts": dict(missing_fields_stats),
            "missing_specs_counts": dict(missing_specs_stats),
            "missing_category_counts": dict(missing_category_stats),
        },
        "products_missing_seo": products_missing_seo,
        "products_missing_specs": products_missing_specs,
        "products_missing_category": products_missing_category,
        "grouped_by_missing_fields": {
            key: {
                "count": len(products),
                "products": products
            }
            for key, products in sorted(grouped_by_missing.items(), key=lambda x: len(x[1]), reverse=True)
        },
        "grouped_by_missing_specs": {
            key: {
                "count": len(products),
                "products": products
            }
            for key, products in sorted(grouped_by_missing_specs.items(), key=lambda x: len(x[1]), reverse=True)
        },
        "grouped_by_missing_category": {
            key: {
                "count": len(products),
                "products": products
            }
            for key, products in sorted(grouped_by_missing_category.items(), key=lambda x: len(x[1]), reverse=True)
        }
    }


async def generate_report(results: Dict[str, Any], output_dir: PathLib) -> None:
    """Generate a human-readable report of products missing SEO fields and specs."""
    report_file = output_dir / "products_missing_seo_report.txt"
    
    stats = results.get("statistics", {})
    products = results.get("products_missing_seo", [])
    products_missing_specs = results.get("products_missing_specs", [])
    grouped = results.get("grouped_by_missing_fields", {})
    grouped_specs = results.get("grouped_by_missing_specs", {})
    
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("=" * 80 + "\n")
        f.write("PRODUCTS MISSING SEO FIELDS, SPECS, AND CATEGORY/SUBCATEGORY REPORT\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("STATISTICS:\n")
        f.write(f"  Total products: {stats.get('total_products', 0):,}\n")
        f.write(f"  Products with catalog_source: {stats.get('total_with_catalog_source', 0):,}\n")
        f.write(f"  Products with catalog_source.seo: {stats.get('total_with_seo', 0):,}\n")
        f.write(f"  Products with slug: {stats.get('total_with_slug', 0):,}\n")
        f.write(f"  Products with keywords: {stats.get('total_with_keywords', 0):,}\n")
        f.write(f"  Products with meta_description: {stats.get('total_with_meta_description', 0):,}\n")
        f.write(f"  Products with specs: {stats.get('total_with_specs', 0):,}\n")
        f.write(f"  Products missing SEO fields: {stats.get('total_missing_seo_fields', 0):,}\n")
        f.write(f"  Products missing specs: {stats.get('total_missing_specs', 0):,}\n\n")
        
        f.write("MISSING SEO FIELDS BREAKDOWN:\n")
        missing_counts = stats.get("missing_fields_counts", {})
        for field, count in sorted(missing_counts.items(), key=lambda x: x[1], reverse=True):
            f.write(f"  {field}: {count:,} products\n")
        
        f.write("\nMISSING SPECS BREAKDOWN:\n")
        missing_specs_counts = stats.get("missing_specs_counts", {})
        for field, count in sorted(missing_specs_counts.items(), key=lambda x: x[1], reverse=True):
            f.write(f"  {field}: {count:,} products\n")
        
        f.write("\nMISSING CATEGORY/SUBCATEGORY BREAKDOWN:\n")
        missing_category_counts = stats.get("missing_category_counts", {})
        for field, count in sorted(missing_category_counts.items(), key=lambda x: x[1], reverse=True):
            f.write(f"  {field}: {count:,} products\n")
        
        if grouped:
            f.write("\n" + "-" * 80 + "\n")
            f.write("PRODUCTS GROUPED BY MISSING FIELDS\n")
            f.write("-" * 80 + "\n\n")
            
            for missing_fields_str, group_data in list(grouped.items())[:20]:  # Show top 20 groups
                count = group_data.get("count", 0)
                group_products = group_data.get("products", [])
                
                f.write(f"Missing: {missing_fields_str}\n")
                f.write(f"  Count: {count} products\n")
                f.write(f"  Products:\n")
                
                for i, product in enumerate(group_products[:10], 1):  # Show first 10 products per group
                    f.write(f"    {i}. SKU: {product.get('sku', 'N/A')}\n")
                    f.write(f"       Name: {product.get('name', 'N/A')}\n")
                    f.write(f"       Category: {product.get('category', 'N/A')}\n")
                    f.write(f"       Subcategory: {product.get('subcategory', 'N/A')}\n")
                    f.write(f"       Brand: {product.get('brand', 'N/A')}\n")
                    f.write(f"       Product Family: {product.get('product_family', 'N/A')}\n")
                    f.write(f"       Missing: {', '.join(product.get('missing_fields', []))}\n")
                
                if len(group_products) > 10:
                    f.write(f"       ... and {len(group_products) - 10} more products\n")
                f.write("\n")
        
        if products:
            f.write("-" * 80 + "\n")
            f.write("ALL PRODUCTS MISSING SEO FIELDS\n")
            f.write("-" * 80 + "\n\n")
            
            # Group by product family for easier review
            by_family = defaultdict(list)
            for product in products:
                family = product.get("product_family", "Unknown")
                by_family[family].append(product)
            
            for family, family_products in sorted(by_family.items()):
                f.write(f"\n{family} ({len(family_products)} products):\n")
                for product in family_products[:20]:  # Show first 20 per family
                    f.write(f"  - SKU: {product.get('sku', 'N/A')} | ")
                    f.write(f"Name: {product.get('name', 'N/A')} | ")
                    f.write(f"Missing: {', '.join(product.get('missing_fields', []))}\n")
                if len(family_products) > 20:
                    f.write(f"  ... and {len(family_products) - 20} more\n")
        
        # Products missing specs
        if products_missing_specs:
            f.write("\n" + "-" * 80 + "\n")
            f.write("PRODUCTS MISSING SPECS\n")
            f.write("-" * 80 + "\n\n")
            
            if grouped_specs:
                f.write("PRODUCTS GROUPED BY MISSING SPECS:\n\n")
                for missing_fields_str, group_data in list(grouped_specs.items())[:10]:
                    count = group_data.get("count", 0)
                    group_products = group_data.get("products", [])
                    
                    f.write(f"Missing: {missing_fields_str}\n")
                    f.write(f"  Count: {count} products\n")
                    f.write(f"  Products:\n")
                    
                    for i, product in enumerate(group_products[:10], 1):
                        f.write(f"    {i}. SKU: {product.get('sku', 'N/A')}\n")
                        f.write(f"       Name: {product.get('name', 'N/A')}\n")
                        f.write(f"       Category: {product.get('category', 'N/A')}\n")
                        f.write(f"       Subcategory: {product.get('subcategory', 'N/A')}\n")
                        f.write(f"       Brand: {product.get('brand', 'N/A')}\n")
                        f.write(f"       Product Family: {product.get('product_family', 'N/A')}\n")
                    
                    if len(group_products) > 10:
                        f.write(f"       ... and {len(group_products) - 10} more products\n")
                    f.write("\n")
            
            # Group by product family
            by_family_specs = defaultdict(list)
            for product in products_missing_specs:
                family = product.get("product_family", "Unknown")
                by_family_specs[family].append(product)
            
            f.write("\nPRODUCTS MISSING SPECS BY FAMILY:\n")
            for family, family_products in sorted(by_family_specs.items()):
                f.write(f"\n{family} ({len(family_products)} products):\n")
                for product in family_products[:20]:
                    f.write(f"  - SKU: {product.get('sku', 'N/A')} | ")
                    f.write(f"Name: {product.get('name', 'N/A')}\n")
                if len(family_products) > 20:
                    f.write(f"  ... and {len(family_products) - 20} more\n")
        
        # Products missing category/subcategory
        if products_missing_category:
            f.write("\n" + "-" * 80 + "\n")
            f.write("PRODUCTS MISSING CATEGORY/SUBCATEGORY\n")
            f.write("-" * 80 + "\n\n")
            
            if grouped_category:
                f.write("PRODUCTS GROUPED BY MISSING CATEGORY/SUBCATEGORY:\n\n")
                for missing_fields_str, group_data in list(grouped_category.items())[:10]:
                    count = group_data.get("count", 0)
                    group_products = group_data.get("products", [])
                    
                    f.write(f"Missing: {missing_fields_str}\n")
                    f.write(f"  Count: {count} products\n")
                    f.write(f"  Products:\n")
                    
                    for i, product in enumerate(group_products[:10], 1):
                        f.write(f"    {i}. SKU: {product.get('sku', 'N/A')}\n")
                        f.write(f"       Name: {product.get('name', 'N/A')}\n")
                        f.write(f"       Category: {product.get('category', 'N/A')}\n")
                        f.write(f"       Subcategory: {product.get('subcategory', 'N/A')}\n")
                        f.write(f"       Catalog Source Subcategory: {product.get('catalog_source_category', 'N/A')}\n")
                        f.write(f"       Brand: {product.get('brand', 'N/A')}\n")
                        f.write(f"       Product Family: {product.get('product_family', 'N/A')}\n")
                    
                    if len(group_products) > 10:
                        f.write(f"       ... and {len(group_products) - 10} more products\n")
                    f.write("\n")
            
            # Group by product family
            by_family_category = defaultdict(list)
            for product in products_missing_category:
                family = product.get("product_family", "Unknown")
                by_family_category[family].append(product)
            
            f.write("\nPRODUCTS MISSING CATEGORY/SUBCATEGORY BY FAMILY:\n")
            for family, family_products in sorted(by_family_category.items()):
                f.write(f"\n{family} ({len(family_products)} products):\n")
                for product in family_products[:20]:
                    f.write(f"  - SKU: {product.get('sku', 'N/A')} | ")
                    f.write(f"Name: {product.get('name', 'N/A')} | ")
                    f.write(f"Missing: {', '.join(product.get('missing_category_fields', []))}\n")
                if len(family_products) > 20:
                    f.write(f"  ... and {len(family_products) - 20} more\n")
        
        f.write("\n" + "=" * 80 + "\n")
        f.write("End of Report\n")
        f.write("=" * 80 + "\n")
    
    logger.info(f"Report saved to: {report_file}")


async def main():
    """Main function to find products missing SEO fields."""
    print("=" * 80, flush=True)
    print("Finding Products Missing SEO Fields, Specs, and Category/Subcategory", flush=True)
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
        
        # Find products missing SEO
        results = await find_products_missing_seo(db, "products")
        
        stats = results.get("statistics", {})
        products = results.get("products_missing_seo", [])
        
        # Print summary
        print("\n" + "=" * 80, flush=True)
        print("RESULTS SUMMARY", flush=True)
        print("=" * 80, flush=True)
        print(f"Total products: {stats.get('total_products', 0):,}", flush=True)
        print(f"Products with catalog_source: {stats.get('total_with_catalog_source', 0):,}", flush=True)
        print(f"Products with SEO fields: {stats.get('total_with_seo', 0):,}", flush=True)
        print(f"Products with specs: {stats.get('total_with_specs', 0):,}", flush=True)
        print(f"Products with category: {stats.get('total_with_category', 0):,}", flush=True)
        print(f"Products with subcategory: {stats.get('total_with_subcategory', 0):,}", flush=True)
        print(f"Products missing SEO fields: {stats.get('total_missing_seo_fields', 0):,}", flush=True)
        print(f"Products missing specs: {stats.get('total_missing_specs', 0):,}", flush=True)
        print(f"Products missing category/subcategory: {stats.get('total_missing_category', 0):,}", flush=True)
        
        missing_counts = stats.get("missing_fields_counts", {})
        if missing_counts:
            print(f"\nMissing SEO fields breakdown:", flush=True)
            for field, count in sorted(missing_counts.items(), key=lambda x: x[1], reverse=True):
                print(f"  {field}: {count:,} products", flush=True)
        
        missing_specs_counts = stats.get("missing_specs_counts", {})
        if missing_specs_counts:
            print(f"\nMissing specs breakdown:", flush=True)
            for field, count in sorted(missing_specs_counts.items(), key=lambda x: x[1], reverse=True):
                print(f"  {field}: {count:,} products", flush=True)
        
        if products:
            print(f"\nTop 10 products missing SEO fields:", flush=True)
            for i, product in enumerate(products[:10], 1):
                print(f"  {i}. SKU: {product.get('sku', 'N/A')} | "
                      f"Name: {product.get('name', 'N/A')} | "
                      f"Missing: {', '.join(product.get('missing_fields', []))}", flush=True)
        
        products_missing_specs = results.get("products_missing_specs", [])
        if products_missing_specs:
            print(f"\nTop 10 products missing specs:", flush=True)
            for i, product in enumerate(products_missing_specs[:10], 1):
                print(f"  {i}. SKU: {product.get('sku', 'N/A')} | "
                      f"Name: {product.get('name', 'N/A')}", flush=True)
        
        missing_category_counts = stats.get("missing_category_counts", {})
        if missing_category_counts:
            print(f"\nMissing category/subcategory breakdown:", flush=True)
            for field, count in sorted(missing_category_counts.items(), key=lambda x: x[1], reverse=True):
                print(f"  {field}: {count:,} products", flush=True)
        
        products_missing_category = results.get("products_missing_category", [])
        if products_missing_category:
            print(f"\nTop 10 products missing category/subcategory:", flush=True)
            for i, product in enumerate(products_missing_category[:10], 1):
                print(f"  {i}. SKU: {product.get('sku', 'N/A')} | "
                      f"Name: {product.get('name', 'N/A')} | "
                      f"Missing: {', '.join(product.get('missing_category_fields', []))}", flush=True)
        
        # Save results to JSON
        json_file = output_dir / "products_missing_seo.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
        print(f"\n✓ Results saved to: {json_file}", flush=True)
        logger.info(f"Results saved to: {json_file}")
        
        # Generate report
        await generate_report(results, output_dir)
        
        print("=" * 80, flush=True)
        print(f"\nFull JSON results: {json_file}", flush=True)
        print(f"Report: {output_dir / 'products_missing_seo_report.txt'}", flush=True)
        
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
