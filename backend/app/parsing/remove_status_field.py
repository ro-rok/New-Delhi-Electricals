"""
Script to remove the status field from all products in MongoDB.

This script:
1. Connects to MongoDB
2. Removes the status field from all products in the products collection
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


async def remove_status_field(collection_name: str = "products") -> dict:
    """
    Remove the status field from all products in the collection.
    
    Args:
        collection_name: MongoDB collection name (default: "products")
    
    Returns:
        Dict with statistics about the operation
    """
    client = get_client()
    db = get_db()
    collection = db[collection_name]
    
    # First, count how many products have the status field
    count_with_status = await collection.count_documents({"status": {"$exists": True}})
    total_products = await collection.count_documents({})
    
    logger.info(f"Total products in collection: {total_products}")
    logger.info(f"Products with status field: {count_with_status}")
    
    if count_with_status == 0:
        logger.info("No products have the status field. Nothing to remove.")
        return {
            "total_products": total_products,
            "products_with_status": 0,
            "products_updated": 0,
        }
    
    # Remove the status field from all products
    logger.info(f"Removing status field from {count_with_status} product(s)...")
    
    result = await collection.update_many(
        {"status": {"$exists": True}},
        {"$unset": {"status": ""}},
    )
    
    logger.info("=" * 60)
    logger.info("Status Field Removal Summary:")
    logger.info(f"  Total products: {total_products}")
    logger.info(f"  Products with status field: {count_with_status}")
    logger.info(f"  Products updated: {result.modified_count}")
    logger.info("=" * 60)
    
    return {
        "total_products": total_products,
        "products_with_status": count_with_status,
        "products_updated": result.modified_count,
    }


async def main():
    """Main entry point for the script."""
    logger.info("Starting status field removal from products...")
    logger.info(f"MongoDB URI: {settings.MONGODB_URI}")
    logger.info(f"Database: {settings.MONGODB_DB_NAME}")
    
    try:
        stats = await remove_status_field()
        
        if stats["products_updated"] > 0:
            logger.info(f"Successfully removed status field from {stats['products_updated']} product(s)!")
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


