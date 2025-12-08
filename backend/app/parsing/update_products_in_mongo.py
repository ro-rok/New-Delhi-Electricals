"""
Script to update product category and subcategory in MongoDB from updated JSON files.

This script:
1. Reads the updated bell_push_products.json and circuit_protection_penta_signia.json files
2. Updates MongoDB products by SKU with new category, subcategory, and SEO fields
3. Provides progress tracking and error reporting
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from pathlib import Path as PathLib
from typing import Any, Dict, List

# Add backend directory to path to import app modules
# Script is at: backend/app/parsing/update_products_in_mongo.py
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def update_products_from_file(
    file_path: PathLib, db, collection_name: str = "products"
) -> Dict[str, Any]:
    """
    Update products in MongoDB from a JSON file.
    
    Only updates: category, subcategory, and SEO-related fields.
    
    Returns:
        Dict with stats: {"processed": int, "updated": int, "not_found": int, "errors": int}
    """
    stats = {"processed": 0, "updated": 0, "not_found": 0, "errors": 0}
    errors = []
    not_found_skus = []
    
    try:
        logger.info(f"Reading file: {file_path.name}")
        with open(file_path, "r", encoding="utf-8") as f:
            products = json.load(f)
        
        if not isinstance(products, list):
            logger.error(f"Invalid JSON format in {file_path.name}: expected array")
            stats["errors"] = 1
            return stats
        
        collection = db[collection_name]
        
        for product_data in products:
            try:
                stats["processed"] += 1
                sku = product_data.get("sku")
                
                if not sku:
                    error_msg = f"Product missing SKU in {file_path.name}"
                    errors.append(error_msg)
                    stats["errors"] += 1
                    logger.error(error_msg)
                    continue
                
                # Prepare update fields
                update_fields = {}
                
                # Update category
                if "category" in product_data:
                    update_fields["category"] = product_data["category"]
                
                # Update subcategory
                if "subcategory" in product_data:
                    update_fields["subcategory"] = product_data["subcategory"]
                
                # Update top-level description if it exists
                if "description" in product_data:
                    update_fields["description"] = product_data["description"]
                
                # Update catalog_source fields if they exist
                if "catalog_source" in product_data and isinstance(product_data["catalog_source"], dict):
                    catalog_source = product_data["catalog_source"]
                    
                    # Update catalog_source.subcategory
                    if "subcategory" in catalog_source:
                        update_fields["catalog_source.subcategory"] = catalog_source["subcategory"]
                    
                    # Update catalog_source.seo fields if they exist
                    if "seo" in catalog_source and isinstance(catalog_source["seo"], dict):
                        seo = catalog_source["seo"]
                        if "slug" in seo:
                            update_fields["catalog_source.seo.slug"] = seo["slug"]
                        if "meta_description" in seo:
                            update_fields["catalog_source.seo.meta_description"] = seo["meta_description"]
                        if "keywords" in seo:
                            update_fields["catalog_source.seo.keywords"] = seo["keywords"]
                
                # Also check for top-level seo field (if it exists in some products)
                if "seo" in product_data and isinstance(product_data["seo"], dict):
                    seo = product_data["seo"]
                    if "slug" in seo:
                        update_fields["seo.slug"] = seo["slug"]
                    if "meta_description" in seo:
                        update_fields["seo.meta_description"] = seo["meta_description"]
                    if "keywords" in seo:
                        update_fields["seo.keywords"] = seo["keywords"]
                
                if not update_fields:
                    logger.warning(f"No fields to update for SKU: {sku}")
                    continue
                
                # Update the product in MongoDB
                result = await collection.update_one(
                    {"sku": sku},
                    {"$set": update_fields}
                )
                
                if result.matched_count == 0:
                    stats["not_found"] += 1
                    not_found_skus.append(sku)
                    logger.warning(f"Product not found in MongoDB: {sku} - {product_data.get('name', 'Unknown')}")
                elif result.modified_count > 0:
                    stats["updated"] += 1
                    logger.info(f"✓ Updated: {sku} - {product_data.get('name', 'Unknown')}")
                else:
                    # Matched but not modified (already had same values)
                    stats["updated"] += 1
                    logger.debug(f"⊘ No changes needed: {sku} - {product_data.get('name', 'Unknown')}")
                
                if stats["processed"] % 10 == 0:
                    logger.info(
                        f"Processed {stats['processed']} products from {file_path.name} "
                        f"({stats['updated']} updated, {stats['not_found']} not found)"
                    )
            
            except Exception as e:
                stats["errors"] += 1
                error_msg = f"Error updating product {product_data.get('sku', 'unknown')}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        logger.info(
            f"Completed {file_path.name}: "
            f"{stats['processed']} processed, "
            f"{stats['updated']} updated, "
            f"{stats['not_found']} not found, "
            f"{stats['errors']} errors"
        )
        
        if not_found_skus:
            logger.warning(f"Products not found in MongoDB ({len(not_found_skus)}): {', '.join(not_found_skus[:10])}")
            if len(not_found_skus) > 10:
                logger.warning(f"  ... and {len(not_found_skus) - 10} more")
        
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


async def main():
    """Main function to update products in MongoDB."""
    # Path to output directory
    output_dir = PathLib(__file__).parent / "output"
    
    # Files to process
    files_to_update = [
        output_dir / "bell_push_products.json",
        output_dir / "circuit_protection_penta_signia.json"
    ]
    
    # Check if files exist
    existing_files = [f for f in files_to_update if f.exists()]
    
    if not existing_files:
        logger.error("No JSON files found to update!")
        logger.error(f"Expected files in: {output_dir}")
        return
    
    logger.info("=" * 80)
    logger.info("Updating Products in MongoDB")
    logger.info("=" * 80)
    logger.info(f"Found {len(existing_files)} file(s) to process")
    
    # Connect to MongoDB
    client = get_client()
    db = get_db()
    
    overall_stats = {
        "total_files": len(existing_files),
        "total_processed": 0,
        "total_updated": 0,
        "total_not_found": 0,
        "total_errors": 0,
    }
    
    try:
        # Process each file
        for json_file in existing_files:
            logger.info(f"\nProcessing: {json_file.name}")
            logger.info("-" * 80)
            stats = await update_products_from_file(json_file, db)
            
            overall_stats["total_processed"] += stats["processed"]
            overall_stats["total_updated"] += stats["updated"]
            overall_stats["total_not_found"] += stats["not_found"]
            overall_stats["total_errors"] += stats["errors"]
        
        logger.info("\n" + "=" * 80)
        logger.info("Update Summary:")
        logger.info("=" * 80)
        logger.info(f"  Files processed: {overall_stats['total_files']}")
        logger.info(f"  Products processed: {overall_stats['total_processed']}")
        logger.info(f"  Products updated: {overall_stats['total_updated']}")
        logger.info(f"  Products not found: {overall_stats['total_not_found']}")
        logger.info(f"  Errors: {overall_stats['total_errors']}")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
    finally:
        # Close MongoDB connection
        client.close()
        logger.info("MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
