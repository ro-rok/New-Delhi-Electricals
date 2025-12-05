"""
Script to fetch all subcategories from the database and update categories_with_subcategories.json
"""
import asyncio
import json
import os
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Change to backend directory so .env file can be found
# The Settings class looks for .env in the current working directory
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


def create_slug(text: str) -> str:
    """Create a URL-friendly slug from text"""
    return text.lower().replace(" ", "-").replace("/", "-").replace("(", "").replace(")", "").replace("&", "and")


async def fetch_categories_with_subcategories():
    """Fetch all categories with their subcategories from the database"""
    client = get_client()
    db = get_db()
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB")
        
        # Aggregate pipeline to get categories with subcategories
        # Subcategory can be in: subcategory field or catalog_source.subcategory
        pipeline = [
            {
                "$project": {
                    "category": 1,
                    "subcategory": {
                        "$ifNull": [
                            "$subcategory",
                            "$catalog_source.subcategory"
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "category": "$category",
                        "subcategory": "$subcategory"
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": "$_id.category",
                    "subcategories": {
                        "$push": {
                            "name": "$_id.subcategory",
                            "count": "$count"
                        }
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "category": "$_id",
                    "subcategories": 1
                }
            },
            {
                "$sort": {"category": 1}
            }
        ]
        
        categories_map = {}
        
        async for doc in db.products.aggregate(pipeline):
            category = doc["category"]
            if not category:
                category = "Uncategorized"
            
            slug = create_slug(category)
            
            # Get total product count for this category
            category_count = await db.products.count_documents({"category": category})
            
            # Process subcategories
            subcategories = []
            for subcat_data in doc.get("subcategories", []):
                subcat_name = subcat_data.get("name", "")
                if not subcat_name:
                    subcat_name = "Uncategorized"
                
                subcat_slug = create_slug(subcat_name)
                subcat_count = subcat_data.get("count", 0)
                
                subcategories.append({
                    "id": subcat_slug,
                    "name": subcat_name,
                    "slug": subcat_slug,
                    "productCount": subcat_count
                })
            
            # Sort subcategories by name
            subcategories.sort(key=lambda x: x["name"])
            
            # If no subcategories, add uncategorized
            if not subcategories:
                subcategories.append({
                    "id": "uncategorized",
                    "name": "Uncategorized",
                    "slug": "uncategorized",
                    "productCount": category_count
                })
            
            categories_map[category] = {
                "id": slug,
                "name": category,
                "slug": slug,
                "description": f"{category} products",
                "icon": "Package",
                "image": f"/category-images/{slug}.jpg",
                "productCount": category_count,
                "subcategories": subcategories
            }
        
        # Convert to list and sort by name
        categories_list = list(categories_map.values())
        categories_list.sort(key=lambda x: x["name"])
        
        return categories_list
        
    except Exception as e:
        print(f"✗ Error fetching categories: {e}")
        raise
    finally:
        client.close()
        print("✓ Connection closed")


async def main():
    """Main function"""
    script_dir = Path(__file__).parent
    output_file = script_dir / "categories_with_subcategories.json"
    
    print("Fetching categories with subcategories from database...")
    categories = await fetch_categories_with_subcategories()
    
    print(f"\nFound {len(categories)} categories:")
    for cat in categories:
        print(f"  - {cat['name']}: {cat['productCount']} products, {len(cat['subcategories'])} subcategories")
        for subcat in cat['subcategories']:
            print(f"    • {subcat['name']}: {subcat['productCount']} products")
    
    # Write to JSON file
    print(f"\nWriting to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(categories, f, indent=2, ensure_ascii=False)
    
    print("✓ Done!")


if __name__ == "__main__":
    asyncio.run(main())

