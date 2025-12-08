"""
Script to upload specific JSON files to MongoDB.

This script uploads:
- penta.json
- penta2.json
- Fabio1.json
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Any, Dict

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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def transform_product(product_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform Product schema format to ProductBase format for MongoDB.
    """
    # Extract image URLs from media.images array
    images = []
    if "media" in product_data and "images" in product_data["media"]:
        for img in product_data["media"]["images"]:
            if isinstance(img, dict) and "url" in img:
                images.append(img["url"])
            elif isinstance(img, str):
                images.append(img)
    
    # Build the transformed product document
    transformed = {
        "sku": product_data["sku"],
        "name": product_data["name"],
        "brand": product_data.get("brand", ""),
        "category": product_data.get("category", ""),
        "series": product_data.get("product_family", ""),
        "list_price": int(product_data.get("pricing", {}).get("mrp", 0)),
        "currency": "INR",
        "images": images,
        "specs": product_data.get("specs", {}),
        "description": product_data.get("seo", {}).get("meta_description", ""),
        "status": product_data.get("status", {}),
        "catalog_source": {
            "source_file": product_data.get("_source_file", ""),
            "subcategory": product_data.get("subcategory", ""),
            "product_family": product_data.get("product_family", ""),
            "variant": product_data.get("variant", []),
            "pricing": product_data.get("pricing", {}),
            "seo": product_data.get("seo", {}),
            "highlights": product_data.get("highlights", []),
        },
    }
    
    # Add datasheet_url if available in media.documents
    if "media" in product_data and "documents" in product_data["media"]:
        documents = product_data["media"]["documents"]
        if documents and isinstance(documents, list) and len(documents) > 0:
            transformed["datasheet_url"] = documents[0] if isinstance(documents[0], str) else None
    
    return transformed


async def upload_products_from_file(
    file_path: PathLib, db, collection_name: str = "products"
) -> Dict[str, Any]:
    """
    Upload products from a single JSON file to MongoDB.
    
    Returns:
        Dict with stats: {"processed": int, "inserted": int, "updated": int, "errors": int}
    """
    stats = {"processed": 0, "inserted": 0, "updated": 0, "errors": 0}
    errors = []
    
    try:
        logger.info(f"Reading file: {file_path.name}")
        with open(file_path, "r", encoding="utf-8") as f:
            products = json.load(f)
        
        if not isinstance(products, list):
            logger.error(f"Invalid JSON format in {file_path.name}: expected array")
            stats["errors"] = 1
            return stats
        
        # Add source file info to each product
        for product in products:
            product["_source_file"] = file_path.name
        
        collection = db[collection_name]
        
        for product_data in products:
            try:
                stats["processed"] += 1
                
                # Transform product data
                transformed = transform_product(product_data)
                sku = transformed["sku"]
                
                # Use upsert: update if exists, insert if not
                result = await collection.update_one(
                    {"sku": sku},
                    {"$set": transformed},
                    upsert=True,
                )
                
                if result.upserted_id:
                    stats["inserted"] += 1
                else:
                    stats["updated"] += 1
                
                if stats["processed"] % 100 == 0:
                    logger.info(
                        f"Processed {stats['processed']} products from {file_path.name}"
                    )
            
            except Exception as e:
                stats["errors"] += 1
                error_msg = f"Error processing product {product_data.get('sku', 'unknown')}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        logger.info(
            f"Completed {file_path.name}: "
            f"{stats['processed']} processed, "
            f"{stats['inserted']} inserted, "
            f"{stats['updated']} updated, "
            f"{stats['errors']} errors"
        )
        
        if errors:
            logger.warning(f"Errors in {file_path.name}: {len(errors)} errors")
            for error in errors[:10]:  # Show first 10 errors
                logger.warning(f"  - {error}")
            if len(errors) > 10:
                logger.warning(f"  ... and {len(errors) - 10} more errors")
    
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {file_path.name}: {str(e)}")
        stats["errors"] = 1
    except Exception as e:
        logger.error(f"Error reading {file_path.name}: {str(e)}")
        stats["errors"] = 1
    
    return stats


async def upload_specific_files():
    """Upload the three specified JSON files to MongoDB."""
    parsing_folder = PathLib(__file__).parent
    
    # Files to upload
    files_to_upload = [
        "penta.json",
        "penta2.json",
        "Fabio1.json"
    ]
    
    # Connect to MongoDB
    logger.info("Connecting to MongoDB...")
    logger.info(f"MongoDB URI: {settings.MONGODB_URI}")
    logger.info(f"Database: {settings.MONGODB_DB_NAME}")
    
    client = get_client()
    db = get_db()
    
    overall_stats = {
        "total_files": 0,
        "total_processed": 0,
        "total_inserted": 0,
        "total_updated": 0,
        "total_errors": 0,
    }
    
    try:
        # Process each file
        for filename in files_to_upload:
            file_path = parsing_folder / filename
            
            if not file_path.exists():
                logger.error(f"File not found: {file_path}")
                overall_stats["total_errors"] += 1
                continue
            
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing: {filename}")
            logger.info(f"{'='*60}")
            
            stats = await upload_products_from_file(file_path, db, "products")
            
            overall_stats["total_files"] += 1
            overall_stats["total_processed"] += stats["processed"]
            overall_stats["total_inserted"] += stats["inserted"]
            overall_stats["total_updated"] += stats["updated"]
            overall_stats["total_errors"] += stats["errors"]
        
        logger.info("\n" + "=" * 60)
        logger.info("Upload Summary:")
        logger.info(f"  Files processed: {overall_stats['total_files']}")
        logger.info(f"  Products processed: {overall_stats['total_processed']}")
        logger.info(f"  Products inserted: {overall_stats['total_inserted']}")
        logger.info(f"  Products updated: {overall_stats['total_updated']}")
        logger.info(f"  Errors: {overall_stats['total_errors']}")
        logger.info("=" * 60)
        
        return overall_stats
    
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        raise


async def main():
    """Main entry point for the script."""
    logger.info("Starting upload of specific files to MongoDB...")
    
    try:
        stats = await upload_specific_files()
        
        if stats["total_errors"] > 0:
            logger.warning(f"Upload completed with {stats['total_errors']} errors")
            return 1
        else:
            logger.info("Upload completed successfully!")
            return 0
    
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    print("Starting script...")
    try:
        exit_code = asyncio.run(main())
        print(f"Script completed with exit code: {exit_code}")
        sys.exit(exit_code)
    except Exception as e:
        print(f"Error running script: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

