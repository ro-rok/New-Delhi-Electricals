"""
Script to remove seo.slug field from all products in MongoDB.
Only the top-level slug field should remain.
"""

import asyncio
import logging
import os
import sys
from pathlib import Path as PathLib

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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def remove_seo_slug(collection_name: str = "products") -> dict:
    """
    Remove the seo.slug field from all products in the collection.
    Only the top-level slug field should remain.
    
    Args:
        collection_name: MongoDB collection name (default: "products")
    
    Returns:
        Dict with statistics about the operation
    """
    client = get_client()
    db = get_db()
    collection = db[collection_name]
    
    # First, count how many products have the seo.slug field
    count_with_seo_slug = await collection.count_documents({"seo.slug": {"$exists": True}})
    total_products = await collection.count_documents({})
    
    logger.info(f"Total products in collection: {total_products}")
    logger.info(f"Products with seo.slug field: {count_with_seo_slug}")
    
    if count_with_seo_slug == 0:
        logger.info("No products have the seo.slug field. Nothing to remove.")
        return {
            "total_products": total_products,
            "products_with_seo_slug": 0,
            "products_updated": 0,
        }
    
    # Remove the seo.slug field from all products
    logger.info(f"Removing seo.slug field from {count_with_seo_slug} product(s)...")
    
    result = await collection.update_many(
        {"seo.slug": {"$exists": True}},
        {"$unset": {"seo.slug": ""}},
    )
    
    logger.info("=" * 60)
    logger.info("SEO Slug Removal Summary:")
    logger.info(f"  Total products: {total_products}")
    logger.info(f"  Products with seo.slug field: {count_with_seo_slug}")
    logger.info(f"  Products updated: {result.modified_count}")
    logger.info("=" * 60)
    
    return {
        "total_products": total_products,
        "products_with_seo_slug": count_with_seo_slug,
        "products_updated": result.modified_count,
    }


async def main():
    """Main entry point for the script."""
    print("=" * 80)
    print("Remove seo.slug from all products")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")
    
    try:
        stats = await remove_seo_slug()
        
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Total products: {stats['total_products']}")
        print(f"Products with seo.slug: {stats['products_with_seo_slug']}")
        print(f"Products updated: {stats['products_updated']}")
        print("=" * 80)
        print("\n✓ Operation completed successfully")
        
    except Exception as e:
        logger.error(f"Error removing seo.slug: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client = get_client()
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

