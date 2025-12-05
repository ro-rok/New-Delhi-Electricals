"""
Script to upload engem products from JSON files to MongoDB.
Uploads engem 1.json, engem 2.json, and engem 3.json
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Import the upload function from the main upload script
from app.parsing.upload_products_to_db import upload_products_from_file, get_db
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def main():
    """Upload engem products to MongoDB."""
    parsing_folder = Path(__file__).parent
    
    # Specific engem files to upload
    engem_files = [
        parsing_folder / "engem 1.json",
        parsing_folder / "engem 2.json",
        parsing_folder / "engem 3.json",
    ]
    
    # Check if files exist
    missing_files = [f for f in engem_files if not f.exists()]
    if missing_files:
        logger.error(f"Missing files: {[f.name for f in missing_files]}")
        return 1
    
    logger.info("Starting engem products upload to MongoDB...")
    logger.info(f"Files to upload: {[f.name for f in engem_files]}")
    
    db = get_db()
    
    total_stats = {
        "total_files": len(engem_files),
        "total_processed": 0,
        "total_inserted": 0,
        "total_updated": 0,
        "total_errors": 0,
    }
    
    try:
        for json_file in engem_files:
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing: {json_file.name}")
            logger.info(f"{'='*60}")
            
            stats = await upload_products_from_file(json_file, db, "products")
            
            total_stats["total_processed"] += stats["processed"]
            total_stats["total_inserted"] += stats["inserted"]
            total_stats["total_updated"] += stats["updated"]
            total_stats["total_errors"] += stats["errors"]
        
        logger.info("\n" + "=" * 60)
        logger.info("ENGEM PRODUCTS UPLOAD SUMMARY:")
        logger.info(f"  Files processed: {total_stats['total_files']}")
        logger.info(f"  Products processed: {total_stats['total_processed']}")
        logger.info(f"  Products inserted: {total_stats['total_inserted']}")
        logger.info(f"  Products updated: {total_stats['total_updated']}")
        logger.info(f"  Errors: {total_stats['total_errors']}")
        logger.info("=" * 60)
        
        if total_stats["total_errors"] > 0:
            logger.warning(f"Upload completed with {total_stats['total_errors']} errors")
            return 1
        else:
            logger.info("Upload completed successfully!")
            return 0
    
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

