"""
Script to remove the status field from catalog_source in all products in MongoDB.

This script:
1. Connects to MongoDB
2. Removes the status field from catalog_source in all products
3. Provides progress tracking and statistics
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add backend directory to path to import app modules
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Change to backend directory so .env file can be found
original_cwd = Path.cwd()
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


async def remove_status_from_catalog_source(collection_name: str = "products") -> dict:
    """
    Remove the status field from catalog_source in all products.
    
    Args:
        collection_name: MongoDB collection name (default: "products")
    
    Returns:
        Dict with statistics about the operation
    """
    client = get_client()
    db = get_db()
    collection = db[collection_name]
    
    # Count how many products have status in catalog_source
    count_with_status = await collection.count_documents({"catalog_source.status": {"$exists": True}})
    total_products = await collection.count_documents({})
    
    logger.info(f"Total products in collection: {total_products}")
    logger.info(f"Products with status in catalog_source: {count_with_status}")
    
    if count_with_status == 0:
        logger.info("No products have status in catalog_source. Nothing to remove.")
        return {
            "total_products": total_products,
            "products_with_status_in_catalog_source": 0,
            "products_updated": 0,
        }
    
    # Remove the status field from catalog_source in all products
    logger.info(f"Removing status field from catalog_source in {count_with_status} product(s)...")
    
    result = await collection.update_many(
        {"catalog_source.status": {"$exists": True}},
        {"$unset": {"catalog_source.status": ""}},
    )
    
    logger.info("=" * 60)
    logger.info("Status Field Removal from catalog_source Summary:")
    logger.info(f"  Total products: {total_products}")
    logger.info(f"  Products with status in catalog_source: {count_with_status}")
    logger.info(f"  Products updated: {result.modified_count}")
    logger.info("=" * 60)
    
    return {
        "total_products": total_products,
        "products_with_status_in_catalog_source": count_with_status,
        "products_updated": result.modified_count,
    }


async def main():
    """Main entry point for the script."""
    logger.info("Starting status field removal from catalog_source...")
    logger.info(f"MongoDB URI: {settings.MONGODB_URI}")
    logger.info(f"Database: {settings.MONGODB_DB_NAME}")
    
    try:
        stats = await remove_status_from_catalog_source()
        
        if stats["products_updated"] > 0:
            logger.info(f"Successfully removed status field from catalog_source in {stats['products_updated']} product(s)!")
            return 0
        else:
            logger.info("No products were updated.")
            return 0
    
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)


