"""
Script to query products from MongoDB by subcategory.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from pathlib import Path as PathLib
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


async def query_products_by_subcategory(db, subcategory: str):
    """Query products by exact subcategory match."""
    print("\n" + "="*80)
    print(f"Querying products with subcategory: '{subcategory}'")
    print("="*80)
    
    # Query for products with exact subcategory match (case-insensitive)
    query = {
        "subcategory": {"$regex": f"^{subcategory}$", "$options": "i"}
    }
    
    cursor = db.products.find(query).sort("name", 1)
    products = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        products.append(doc)
    
    print(f"\nFound {len(products)} product(s)")
    
    if products:
        print("\n" + "-"*80)
        for i, product in enumerate(products, 1):
            print(f"\n{i}. SKU: {product.get('sku', 'N/A')}")
            print(f"   Name: {product.get('name', 'N/A')}")
            print(f"   Category: {product.get('category', 'N/A')}")
            print(f"   Subcategory: {product.get('subcategory', 'N/A')}")
            print(f"   Product Family: {product.get('product_family', 'N/A')}")
            print(f"   Brand: {product.get('brand', 'N/A')}")
            if 'pricing' in product:
                pricing = product['pricing']
                print(f"   MRP: {pricing.get('mrp', 'N/A')}")
                print(f"   Selling Price: {pricing.get('selling_price', 'N/A')}")
            if 'specs' in product:
                specs = product['specs']
                print(f"   Specs: {json.dumps(specs, indent=6, default=str)}")
        print("\n" + "-"*80)
    else:
        print("\nNo products found with this subcategory.")
        print("\nTrying case-insensitive partial match...")
        # Try partial match
        partial_query = {
            "subcategory": {"$regex": subcategory, "$options": "i"}
        }
        cursor = db.products.find(partial_query).sort("name", 1)
        partial_products = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            partial_products.append(doc)
        
        if partial_products:
            print(f"\nFound {len(partial_products)} product(s) with partial match:")
            for i, product in enumerate(partial_products[:10], 1):  # Show first 10
                print(f"\n{i}. SKU: {product.get('sku', 'N/A')}")
                print(f"   Name: {product.get('name', 'N/A')}")
                print(f"   Subcategory: {product.get('subcategory', 'N/A')}")
            if len(partial_products) > 10:
                print(f"\n... and {len(partial_products) - 10} more products")
    
    return products


async def main():
    """Main function to query products by subcategory."""
    subcategory = "Data Sockets - 1 Module"
    
    print("="*80)
    print("Product Query by Subcategory")
    print("="*80)
    print(f"\nConnecting to MongoDB...")
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}")
    
    try:
        client = get_client()
        db = get_db()
        
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB successfully\n")
        
        # Query products by subcategory
        products = await query_products_by_subcategory(db, subcategory)
        
        # Save results to JSON
        output_dir = PathLib(__file__).parent / "output"
        output_dir.mkdir(exist_ok=True)
        
        output_file = output_dir / f"products_subcategory_{subcategory.replace(' ', '_').replace('&', 'and')}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n✓ Results saved to: {output_file}")
        print("\n" + "="*80)
        print("SUMMARY")
        print("="*80)
        print(f"Subcategory: {subcategory}")
        print(f"Products found: {len(products)}")
        print("="*80)
        
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

