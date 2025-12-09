"""
Add missing variant products to MongoDB.

This script:
1. Loads all products from output/all_products_full.json
2. For each product with variants, checks if those variant SKUs exist in MongoDB
3. If a variant SKU exists in the JSON but not in MongoDB, adds it to MongoDB

Usage:
    cd c:/NDE/New-Delhi-Electricals/backend/app/parsing
    python add_missing_variants_to_mongo.py
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Any, Dict, List, Set

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


def load_json_products(json_file: PathLib) -> Dict[str, Dict[str, Any]]:
    """
    Load all products from JSON file and return a dictionary mapping SKU to product.
    """
    logger.info(f"Loading products from {json_file}")
    with open(json_file, "r", encoding="utf-8") as f:
        products = json.load(f)
    
    if not isinstance(products, list):
        raise ValueError(f"Expected JSON array, got {type(products)}")
    
    sku_map = {}
    for product in products:
        sku = product.get("sku")
        if sku:
            sku_map[sku] = product
    
    logger.info(f"Loaded {len(sku_map)} products from JSON")
    return sku_map


def prepare_product_for_mongo(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare a product from JSON for MongoDB insertion.
    Handles both formats: already MongoDB-like or needs transformation.
    """
    # Remove _id if present (MongoDB will generate a new one)
    mongo_product = {k: v for k, v in product.items() if k != "_id"}
    
    # Ensure required fields exist
    if "sku" not in mongo_product:
        raise ValueError("Product missing 'sku' field")
    
    # If product has 'pricing' object but not 'list_price', extract it
    if "pricing" in mongo_product and "list_price" not in mongo_product:
        pricing = mongo_product.get("pricing", {})
        if "mrp" in pricing:
            mongo_product["list_price"] = int(pricing["mrp"])
        mongo_product["currency"] = mongo_product.get("currency", "INR")
    
    # Ensure currency is set
    if "currency" not in mongo_product:
        mongo_product["currency"] = "INR"
    
    # Ensure images is a list
    if "images" not in mongo_product:
        mongo_product["images"] = []
    elif not isinstance(mongo_product["images"], list):
        mongo_product["images"] = []
    
    # Ensure variant is a list
    if "variant" not in mongo_product:
        mongo_product["variant"] = []
    elif not isinstance(mongo_product["variant"], list):
        mongo_product["variant"] = []
    
    # Ensure specs exists
    if "specs" not in mongo_product:
        mongo_product["specs"] = {}
    
    # Ensure seo exists
    if "seo" not in mongo_product:
        mongo_product["seo"] = {}
    
    # Ensure status exists
    if "status" not in mongo_product:
        mongo_product["status"] = {}
    
    return mongo_product


async def get_existing_skus(db, skus: Set[str]) -> Set[str]:
    """
    Check which SKUs already exist in MongoDB.
    Returns a set of SKUs that exist in the database.
    """
    collection = db["products"]
    existing = set()
    
    # Query in batches to avoid query size limits
    sku_list = list(skus)
    batch_size = 1000
    
    for i in range(0, len(sku_list), batch_size):
        batch = sku_list[i:i + batch_size]
        cursor = collection.find({"sku": {"$in": batch}}, {"sku": 1})
        async for doc in cursor:
            existing.add(doc["sku"])
    
    return existing


async def insert_missing_variants(
    db,
    json_products: Dict[str, Dict[str, Any]],
    missing_skus: Set[str]
) -> Dict[str, Any]:
    """
    Insert missing variant products into MongoDB.
    
    Returns:
        Dictionary with stats: {"inserted": int, "errors": int, "error_details": List}
    """
    collection = db["products"]
    stats = {
        "inserted": 0,
        "errors": 0,
        "error_details": []
    }
    
    for sku in missing_skus:
        if sku not in json_products:
            logger.warning(f"Variant SKU {sku} not found in JSON file, skipping")
            stats["errors"] += 1
            stats["error_details"].append({
                "sku": sku,
                "error": "SKU not found in JSON file"
            })
            continue
        
        try:
            product = json_products[sku]
            mongo_product = prepare_product_for_mongo(product)
            
            # Insert the product
            await collection.insert_one(mongo_product)
            stats["inserted"] += 1
            logger.info(f"✓ Inserted variant: {sku} - {mongo_product.get('name', 'N/A')}")
            
        except Exception as e:
            stats["errors"] += 1
            error_msg = str(e)
            stats["error_details"].append({
                "sku": sku,
                "error": error_msg
            })
            logger.error(f"Error inserting variant {sku}: {e}")
    
    return stats


async def main():
    print("=" * 80)
    print("Adding missing variant products to MongoDB")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")
    
    # Load JSON file
    script_dir = PathLib(__file__).parent
    json_file = script_dir / "output" / "all_products_full.json"
    
    if not json_file.exists():
        logger.error(f"JSON file not found: {json_file}")
        sys.exit(1)
    
    json_products = load_json_products(json_file)
    
    # Collect all variant SKUs
    all_variant_skus: Set[str] = set()
    products_with_variants = []
    
    for sku, product in json_products.items():
        variants = product.get("variant", [])
        if variants and isinstance(variants, list):
            products_with_variants.append(sku)
            for variant_sku in variants:
                if isinstance(variant_sku, str) and variant_sku.strip():
                    all_variant_skus.add(variant_sku.strip())
    
    logger.info(f"Found {len(products_with_variants)} products with variants")
    logger.info(f"Found {len(all_variant_skus)} unique variant SKUs")
    
    # Connect to MongoDB
    client = get_client()
    db = get_db()
    
    try:
        await client.admin.command("ping")
        
        # Check which variant SKUs already exist in MongoDB
        logger.info("Checking which variant SKUs exist in MongoDB...")
        existing_skus = await get_existing_skus(db, all_variant_skus)
        missing_skus = all_variant_skus - existing_skus
        
        logger.info(f"Found {len(existing_skus)} variant SKUs already in MongoDB")
        logger.info(f"Found {len(missing_skus)} variant SKUs missing from MongoDB")
        
        if not missing_skus:
            print("\n✓ All variant products already exist in MongoDB!")
            return
        
        # Insert missing variants
        print(f"\nInserting {len(missing_skus)} missing variant products...")
        stats = await insert_missing_variants(db, json_products, missing_skus)
        
        print("\n" + "=" * 80)
        print("Summary:")
        print(f"  Variant SKUs checked: {len(all_variant_skus)}")
        print(f"  Already in MongoDB: {len(existing_skus)}")
        print(f"  Missing from MongoDB: {len(missing_skus)}")
        print(f"  Successfully inserted: {stats['inserted']}")
        print(f"  Errors: {stats['errors']}")
        
        if stats["error_details"]:
            print(f"\nError details:")
            for error in stats["error_details"][:10]:  # Show first 10 errors
                print(f"  - {error['sku']}: {error['error']}")
            if len(stats["error_details"]) > 10:
                print(f"  ... and {len(stats['error_details']) - 10} more errors")
        
    except Exception as e:
        logger.exception("Error during processing: %s", e)
        raise
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

