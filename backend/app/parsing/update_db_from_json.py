"""
Script to update MongoDB database with products from all_fetched_products.json.
This script updates existing products and inserts new ones using upsert based on SKU.
"""
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Change to backend directory so .env file can be found
original_cwd = Path.cwd()
backend_path = backend_dir
os.chdir(backend_path)

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    from app.config import settings
    from app.db import get_client, get_db
finally:
    # Restore original working directory
    os.chdir(original_cwd)


def prepare_product_for_db(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare product for database update by removing _id and ensuring proper structure.
    """
    # Create a copy to avoid modifying the original
    db_product = product.copy()
    
    # Remove _id field (MongoDB will handle it)
    db_product.pop("_id", None)
    
    # Ensure all required fields exist
    if "sku" not in db_product:
        raise ValueError(f"Product missing SKU: {product.get('name', 'Unknown')}")
    
    return db_product


async def update_database_from_json(json_file: Path) -> Dict[str, Any]:
    """
    Update MongoDB database with products from JSON file.
    
    Returns:
        Dict with statistics: {"processed": int, "inserted": int, "updated": int, "errors": int}
    """
    client = get_client()
    db = get_db()
    
    stats = {
        "processed": 0,
        "inserted": 0,
        "updated": 0,
        "errors": 0,
        "error_details": []
    }
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB")
        
        # Load products from JSON
        print(f"\nLoading products from {json_file.name}...")
        with open(json_file, 'r', encoding='utf-8') as f:
            products = json.load(f)
        
        if not isinstance(products, list):
            raise ValueError("JSON file must contain an array of products")
        
        print(f"Loaded {len(products)} products")
        
        collection = db.products
        
        # Process each product
        print("\nUpdating database...")
        for i, product in enumerate(products):
            try:
                stats["processed"] += 1
                
                # Prepare product for database
                db_product = prepare_product_for_db(product)
                sku = db_product["sku"]
                
                # Use upsert: update if exists, insert if not
                result = await collection.update_one(
                    {"sku": sku},
                    {"$set": db_product},
                    upsert=True
                )
                
                if result.upserted_id:
                    stats["inserted"] += 1
                    if stats["inserted"] <= 5:  # Show first 5 inserts
                        print(f"  ✓ Inserted: {sku} - {product.get('name', 'Unknown')}")
                else:
                    stats["updated"] += 1
                    if stats["updated"] <= 5:  # Show first 5 updates
                        print(f"  ↻ Updated: {sku} - {product.get('name', 'Unknown')}")
                
                # Show progress every 25 products
                if stats["processed"] % 25 == 0:
                    print(f"  Processed {stats['processed']}/{len(products)} products...")
            
            except Exception as e:
                stats["errors"] += 1
                error_msg = f"Error processing {product.get('sku', 'unknown')}: {str(e)}"
                stats["error_details"].append(error_msg)
                print(f"  ✗ {error_msg}")
        
        print("\n" + "=" * 60)
        print("Update Summary:")
        print(f"  Products processed: {stats['processed']}")
        print(f"  Products inserted: {stats['inserted']}")
        print(f"  Products updated: {stats['updated']}")
        print(f"  Errors: {stats['errors']}")
        print("=" * 60)
        
        if stats["error_details"]:
            print("\nErrors encountered:")
            for error in stats["error_details"][:10]:  # Show first 10 errors
                print(f"  - {error}")
            if len(stats["error_details"]) > 10:
                print(f"  ... and {len(stats['error_details']) - 10} more errors")
        
        return stats
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        # Note: We don't close the client as it's a singleton
        print("\n✓ Update completed")


async def main():
    """Main function"""
    script_dir = Path(__file__).parent
    json_file = script_dir / "fetched_products" / "all_fetched_products.json"
    
    if not json_file.exists():
        print(f"✗ Error: File not found: {json_file}")
        sys.exit(1)
    
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}")
    print(f"Source file: {json_file}")
    
    try:
        stats = await update_database_from_json(json_file)
        
        if stats["errors"] > 0:
            print(f"\n⚠ Update completed with {stats['errors']} errors")
            sys.exit(1)
        else:
            print("\n✓ Update completed successfully!")
            sys.exit(0)
    
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

