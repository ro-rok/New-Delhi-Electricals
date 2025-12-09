"""
Script to update product subcategories in MongoDB from a JSON file.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from pathlib import Path as PathLib
from typing import Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient

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


async def update_subcategories_from_json(
    json_file_path: PathLib,
    db,
    collection_name: str = "products"
) -> Dict[str, Any]:
    """Update product subcategories in MongoDB from JSON file."""
    
    # Load products from JSON file
    with open(json_file_path, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    collection = db[collection_name]
    
    stats = {
        "total": len(products),
        "updated": 0,
        "not_found": 0,
        "errors": 0,
        "skipped": 0
    }
    
    updated_products = []
    not_found_skus = []
    errors = []
    
    print(f"\nProcessing {len(products)} products from {json_file_path.name}...")
    print("="*80)
    
    for product_data in products:
        sku = product_data.get("sku")
        new_subcategory = product_data.get("subcategory")
        
        if not sku:
            stats["errors"] += 1
            errors.append(f"Product missing SKU: {product_data.get('name', 'Unknown')}")
            continue
        
        if not new_subcategory:
            stats["errors"] += 1
            errors.append(f"Product {sku} missing subcategory")
            continue
        
        try:
            # Find product by SKU
            existing_product = await collection.find_one({"sku": sku})
            
            if not existing_product:
                stats["not_found"] += 1
                not_found_skus.append({
                    "sku": sku,
                    "name": product_data.get("name", "Unknown")
                })
                print(f"✗ Not found: {sku} - {product_data.get('name', 'Unknown')}")
                continue
            
            # Check if subcategory needs updating
            current_subcategory = existing_product.get("subcategory")
            if current_subcategory == new_subcategory:
                stats["skipped"] += 1
                print(f"⊘ No change: {sku} - {product_data.get('name', 'Unknown')} (already '{new_subcategory}')")
                continue
            
            # Update subcategory
            result = await collection.update_one(
                {"sku": sku},
                {"$set": {"subcategory": new_subcategory}}
            )
            
            if result.matched_count > 0:
                stats["updated"] += 1
                updated_products.append({
                    "sku": sku,
                    "name": product_data.get("name", "Unknown"),
                    "old_subcategory": current_subcategory,
                    "new_subcategory": new_subcategory
                })
                print(f"✓ Updated: {sku} - {product_data.get('name', 'Unknown')}")
                print(f"  Old: '{current_subcategory}' → New: '{new_subcategory}'")
            else:
                stats["not_found"] += 1
                not_found_skus.append({
                    "sku": sku,
                    "name": product_data.get("name", "Unknown")
                })
                print(f"✗ Not found: {sku} - {product_data.get('name', 'Unknown')}")
        
        except Exception as e:
            stats["errors"] += 1
            error_msg = f"Error updating {sku}: {str(e)}"
            errors.append(error_msg)
            print(f"✗ Error: {error_msg}")
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total products: {stats['total']}")
    print(f"Updated: {stats['updated']}")
    print(f"Not found: {stats['not_found']}")
    print(f"Skipped (no change): {stats['skipped']}")
    print(f"Errors: {stats['errors']}")
    print("="*80)
    
    return {
        "stats": stats,
        "updated_products": updated_products,
        "not_found_skus": not_found_skus,
        "errors": errors
    }


async def main():
    """Main function to update subcategories."""
    # Path to the JSON file with updated subcategories
    json_file = PathLib(__file__).parent / "output" / "products_subcategory_Data_Sockets_-_1_Module.json"
    
    if not json_file.exists():
        print(f"✗ Error: File not found: {json_file}")
        return
    
    print("="*80)
    print("Update Product Subcategories in MongoDB")
    print("="*80)
    print(f"\nConnecting to MongoDB...")
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}")
    print(f"JSON file: {json_file}")
    
    try:
        client = get_client()
        db = get_db()
        
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB successfully\n")
        
        # Update subcategories
        results = await update_subcategories_from_json(json_file, db)
        
        # Save results to output file
        output_dir = PathLib(__file__).parent / "output"
        output_dir.mkdir(exist_ok=True)
        
        results_file = output_dir / "subcategory_update_results.json"
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n✓ Results saved to: {results_file}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'client' in locals():
            client.close()
            print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

