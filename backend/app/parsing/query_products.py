"""
Script to query products from MongoDB based on specific criteria:
1. All products from "Bell Push" category
2. Circuit Protection products with product_family "Penta" or "Signia"
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from pathlib import Path as PathLib
from motor.motor_asyncio import AsyncIOMotorClient

# Add backend directory to path to import app modules
# Script is at: backend/app/parsing/query_products.py
# We need backend/ in path to import app.config
backend_dir = PathLib(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Change to backend directory so .env file can be found
# The Settings class looks for .env in the current working directory
original_cwd = PathLib.cwd()
backend_path = backend_dir
os.chdir(backend_path)

try:
    from app.config import settings
    from app.db import get_client, get_db
finally:
    # Restore original working directory
    os.chdir(original_cwd)


async def query_bell_push_products(db):
    """Query all products from Bell Push category or subcategory."""
    # Get log_print from main's scope - we'll pass it or use a global
    import sys
    output = []
    
    def log(msg):
        print(msg, flush=True)
        output.append(msg)
    
    log("\n" + "="*80)
    log("QUERY 1: All products from 'Bell Push' category")
    log("="*80)
    
    # Query for products where category or subcategory contains "Bell Push"
    query = {
        "$or": [
            {"category": {"$regex": "Bell Push", "$options": "i"}},
            {"subcategory": {"$regex": "Bell Push", "$options": "i"}}
        ]
    }
    
    cursor = db.products.find(query).sort("name", 1)
    products = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        products.append(doc)
    
    log(f"\nFound {len(products)} products")
    log(f"\nProducts:")
    for i, product in enumerate(products, 1):
        log(f"\n{i}. SKU: {product.get('sku', 'N/A')}")
        log(f"   Name: {product.get('name', 'N/A')}")
        log(f"   Category: {product.get('category', 'N/A')}")
        log(f"   Subcategory: {product.get('subcategory', 'N/A')}")
        log(f"   Product Family: {product.get('product_family', 'N/A')}")
        log(f"   Brand: {product.get('brand', 'N/A')}")
        if 'pricing' in product:
            log(f"   Price: {product['pricing'].get('mrp', 'N/A')}")
    
    return products


async def query_circuit_protection_penta_signia(db):
    """Query Circuit Protection products with product_family Penta or Signia."""
    import sys
    output = []
    
    def log(msg):
        print(msg, flush=True)
        output.append(msg)
    
    log("\n" + "="*80)
    log("QUERY 2: Circuit Protection products with product_family 'Penta' or 'Signia'")
    log("="*80)
    
    # Query for Circuit Protection category with Penta or Signia product families
    # Check both 'series' (top-level) and 'catalog_source.product_family' (nested) fields
    query = {
        "$and": [
            {"category": {"$regex": "Circuit Protection", "$options": "i"}},
            {
                "$or": [
                    {"series": {"$regex": "^Penta$", "$options": "i"}},
                    {"series": {"$regex": "^Signia$", "$options": "i"}},
                    {"catalog_source.product_family": {"$regex": "^Penta$", "$options": "i"}},
                    {"catalog_source.product_family": {"$regex": "^Signia$", "$options": "i"}},
                    {"product_family": {"$regex": "^Penta$", "$options": "i"}},
                    {"product_family": {"$regex": "^Signia$", "$options": "i"}}
                ]
            }
        ]
    }
    
    cursor = db.products.find(query).sort("name", 1)
    products = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        products.append(doc)
    
    log(f"\nFound {len(products)} products")
    
    if len(products) == 0:
        log("\nNo products found. Checking what product families exist in Circuit Protection...")
        # Check what product families exist in Circuit Protection
        # Check series field
        pipeline_series = [
            {"$match": {"category": {"$regex": "Circuit Protection", "$options": "i"}, "series": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$series", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        # Check catalog_source.product_family field
        pipeline_family = [
            {"$match": {"category": {"$regex": "Circuit Protection", "$options": "i"}, "catalog_source.product_family": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$catalog_source.product_family", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        families_dict = {}
        async for doc in db.products.aggregate(pipeline_series):
            family_name = doc['_id'] if doc['_id'] else "None"
            families_dict[family_name] = families_dict.get(family_name, 0) + doc['count']
        async for doc in db.products.aggregate(pipeline_family):
            family_name = doc['_id'] if doc['_id'] else "None"
            families_dict[family_name] = families_dict.get(family_name, 0) + doc['count']
        
        families = [f"{name} ({count} products)" for name, count in sorted(families_dict.items(), key=lambda x: x[1], reverse=True)]
        log(f"\nAvailable product families in Circuit Protection:")
        if families:
            for family in families[:30]:  # Show first 30
                log(f"  - {family}")
        else:
            log("  - No product families found")
        
        # Also check if Penta/Signia exist in other categories
        log("\nChecking if Penta/Signia exist in other categories...")
        penta_query = {
            "$or": [
                {"series": {"$regex": "^Penta$", "$options": "i"}},
                {"catalog_source.product_family": {"$regex": "^Penta$", "$options": "i"}},
                {"product_family": {"$regex": "^Penta$", "$options": "i"}}
            ]
        }
        signia_query = {
            "$or": [
                {"series": {"$regex": "^Signia$", "$options": "i"}},
                {"catalog_source.product_family": {"$regex": "^Signia$", "$options": "i"}},
                {"product_family": {"$regex": "^Signia$", "$options": "i"}}
            ]
        }
        
        # Get categories for Penta
        penta_categories = set()
        async for doc in db.products.find(penta_query, {"category": 1}):
            if doc.get("category"):
                penta_categories.add(doc["category"])
        
        # Get categories for Signia
        signia_categories = set()
        async for doc in db.products.find(signia_query, {"category": 1}):
            if doc.get("category"):
                signia_categories.add(doc["category"])
        
        if penta_categories:
            log(f"\nPenta products found in categories: {', '.join(sorted(penta_categories))}")
        if signia_categories:
            log(f"Signia products found in categories: {', '.join(sorted(signia_categories))}")
    else:
        log(f"\nProducts:")
        for i, product in enumerate(products, 1):
            # Get product family from multiple possible locations
            product_family = (
                product.get('series') or 
                product.get('catalog_source', {}).get('product_family') or 
                product.get('product_family') or 
                'N/A'
            )
            log(f"\n{i}. SKU: {product.get('sku', 'N/A')}")
            log(f"   Name: {product.get('name', 'N/A')}")
            log(f"   Category: {product.get('category', 'N/A')}")
            log(f"   Subcategory: {product.get('subcategory', 'N/A')}")
            log(f"   Product Family: {product_family}")
            log(f"   Series: {product.get('series', 'N/A')}")
            log(f"   Brand: {product.get('brand', 'N/A')}")
            if 'pricing' in product:
                log(f"   Price: {product['pricing'].get('mrp', 'N/A')}")
            elif 'list_price' in product:
                log(f"   Price: {product.get('list_price', 'N/A')}")
    
    return products


async def save_results_to_json(bell_push_products, circuit_protection_products):
    """Save query results to JSON files."""
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    
    # Save Bell Push products
    bell_push_file = output_dir / "bell_push_products.json"
    with open(bell_push_file, 'w', encoding='utf-8') as f:
        json.dump(bell_push_products, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Saved {len(bell_push_products)} Bell Push products to {bell_push_file}", flush=True)
    
    # Save Circuit Protection products
    circuit_protection_file = output_dir / "circuit_protection_penta_signia.json"
    with open(circuit_protection_file, 'w', encoding='utf-8') as f:
        json.dump(circuit_protection_products, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved {len(circuit_protection_products)} Circuit Protection products to {circuit_protection_file}", flush=True)


async def main():
    """Main function to run queries."""
    import sys
    from datetime import datetime
    
    # Create output directory
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    log_file = output_dir / f"query_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    # Function to print and log
    def log_print(msg):
        print(msg, flush=True)
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')
    
    sys.stdout.flush()
    log_print("="*80)
    log_print("Product Query Script")
    log_print("="*80)
    log_print(f"\nConnecting to MongoDB...")
    log_print(f"MongoDB URI: {settings.MONGODB_URI}")
    log_print(f"Database: {settings.MONGODB_DB_NAME}")
    
    try:
        client = get_client()
        db = get_db()
        
        # Test connection
        await client.admin.command('ping')
        log_print("✓ Connected to MongoDB successfully\n")
        
        # Query 1: Bell Push products
        bell_push_products = await query_bell_push_products(db)
        
        # Query 2: Circuit Protection with Penta/Signia
        circuit_protection_products = await query_circuit_protection_penta_signia(db)
        
        # Save results to JSON
        await save_results_to_json(bell_push_products, circuit_protection_products)
        
        log_print("\n" + "="*80)
        log_print("SUMMARY")
        log_print("="*80)
        log_print(f"Bell Push products: {len(bell_push_products)}")
        log_print(f"Circuit Protection (Penta/Signia) products: {len(circuit_protection_products)}")
        log_print("="*80)
        log_print(f"\nFull log saved to: {log_file}")
        
    except Exception as e:
        log_print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        with open(log_file, 'a', encoding='utf-8') as f:
            traceback.print_exc(file=f)
    finally:
        # Close connection
        if 'client' in locals():
            client.close()
            log_print("\n✓ Database connection closed")


if __name__ == "__main__":
    asyncio.run(main())

