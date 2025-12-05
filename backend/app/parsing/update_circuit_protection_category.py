"""
Script to update MongoDB database: Change category to "Switches" for Circuit Protection 
products where product_family is not "Tripper".
"""
import asyncio
import argparse
import os
import sys
from pathlib import Path

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


async def update_circuit_protection_category(skip_confirmation: bool = False):
    """
    Update category to "Switches" for Circuit Protection products 
    where catalog_source.product_family is not "Tripper".
    
    Args:
        skip_confirmation: If True, skip the confirmation prompt
    """
    client = get_client()
    db = get_db()
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB")
        print(f"MongoDB URI: {settings.MONGODB_URI}")
        print(f"Database: {settings.MONGODB_DB_NAME}\n")
        
        collection = db.products
        
        # Build the query:
        # - category is "Circuit Protection" (case-insensitive match)
        # - catalog_source.product_family is NOT "Tripper" (case-insensitive)
        # We'll use $regex for case-insensitive matching
        query = {
            "category": {"$regex": "^Circuit Protection$", "$options": "i"},
            "$or": [
                {"catalog_source.product_family": {"$exists": False}},
                {"catalog_source": {"$exists": False}},
                {"catalog_source.product_family": {"$not": {"$regex": "^Tripper$", "$options": "i"}}}
            ]
        }
        
        # Count matching documents first
        count = await collection.count_documents(query)
        print(f"Found {count} products matching the criteria")
        
        if count == 0:
            print("No products to update.")
            return
        
        # Show a few sample products before update
        print("\nSample products that will be updated:")
        sample_products = await collection.find(query).limit(5).to_list(length=5)
        for i, product in enumerate(sample_products, 1):
            product_family = product.get("catalog_source", {}).get("product_family", "N/A")
            print(f"  {i}. SKU: {product.get('sku', 'N/A')} | "
                  f"Category: {product.get('category', 'N/A')} | "
                  f"Product Family: {product_family}")
        
        # Confirm before proceeding (unless skip_confirmation is True)
        if not skip_confirmation:
            print(f"\n⚠️  About to update {count} products from 'Circuit Protection' to 'Switches'")
            print("   (excluding products with product_family = 'Tripper')")
            response = input("\nProceed with update? (yes/no): ").strip().lower()
            
            if response not in ['yes', 'y']:
                print("Update cancelled.")
                return
        else:
            print(f"\n⚠️  Updating {count} products from 'Circuit Protection' to 'Switches'")
            print("   (excluding products with product_family = 'Tripper')")
        
        # Perform the update
        print("\nUpdating products...")
        result = await collection.update_many(
            query,
            {"$set": {"category": "Switches"}}
        )
        
        print("\n" + "=" * 60)
        print("Update Summary:")
        print(f"  Products matched: {result.matched_count}")
        print(f"  Products modified: {result.modified_count}")
        print("=" * 60)
        
        if result.modified_count > 0:
            print("\n✓ Update completed successfully!")
        else:
            print("\n⚠ No products were modified (they may already have category='Switches')")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        print("\n✓ Script completed")


async def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Update Circuit Protection products category to Switches (excluding Tripper)"
    )
    parser.add_argument(
        "--yes", "-y",
        action="store_true",
        help="Skip confirmation prompt and proceed with update"
    )
    args = parser.parse_args()
    
    try:
        await update_circuit_protection_category(skip_confirmation=args.yes)
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

