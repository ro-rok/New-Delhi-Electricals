"""
Get all unique colors from product specs in MongoDB.

Outputs:
- Prints all unique colors to stdout
- Saves to output/all_colors.json

Usage:
    cd backend/app/parsing
    python get_all_colors.py
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Set

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
    os.chdir(original_cwd)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_FILE = PathLib(__file__).parent / "output" / "all_colors.json"


async def get_all_colors(db) -> Set[str]:
    """
    Extract all unique color values from product specs.
    Returns a set of all color strings.
    """
    collection = db["products"]
    colors: Set[str] = set()
    
    cursor = collection.find({}, {"specs.color": 1})
    async for doc in cursor:
        color = (doc.get("specs") or {}).get("color")
        if color:
            if isinstance(color, str):
                color = color.strip()
                if color:
                    colors.add(color)
    
    return colors


def write_output(colors: Set[str]):
    """Write colors to JSON file, sorted alphabetically."""
    OUTPUT_FILE.parent.mkdir(exist_ok=True)
    sorted_colors = sorted(colors)
    output_data = {
        "total": len(sorted_colors),
        "colors": sorted_colors
    }
    OUTPUT_FILE.write_text(json.dumps(output_data, indent=2, ensure_ascii=False), encoding="utf-8")
    logger.info("Saved colors to %s", OUTPUT_FILE)


async def main():
    print("=" * 80)
    print("Extracting all unique colors from product specs")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")
    
    client = get_client()
    db = get_db()
    
    try:
        await client.admin.command("ping")
        colors = await get_all_colors(db)
        
        sorted_colors = sorted(colors)
        
        print(f"\nFound {len(sorted_colors)} unique colors:\n")
        for i, color in enumerate(sorted_colors, 1):
            print(f"  {i:3d}. {color}")
        
        write_output(colors)
        print(f"\n✓ Colors saved to {OUTPUT_FILE}")
        
    except Exception as e:
        logger.exception("Error during processing: %s", e)
        raise
    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())

