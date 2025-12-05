"""
Script to fetch products by category and subcategory
"""
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Any

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


def create_slug(text: str) -> str:
    """Create a URL-friendly slug from text"""
    return text.lower().replace(" ", "-").replace("/", "-").replace("(", "").replace(")", "").replace("&", "and")


def load_subcategory_mapping() -> Dict[str, Dict[str, str]]:
    """
    Load subcategory slug to name mapping from categories_with_subcategories.json
    
    Returns:
        Dict mapping category_name -> {slug: name}
    """
    script_dir = Path(__file__).parent
    categories_file = script_dir / "categories_with_subcategories.json"
    
    if not categories_file.exists():
        print(f"Warning: {categories_file} not found. Using slug-based matching.")
        return {}
    
    with open(categories_file, 'r', encoding='utf-8') as f:
        categories = json.load(f)
    
    mapping = {}
    for category in categories:
        cat_name = category["name"]
        mapping[cat_name] = {}
        for subcat in category.get("subcategories", []):
            slug = subcat["slug"]
            name = subcat["name"]
            mapping[cat_name][slug] = name
    
    return mapping


async def fetch_products_by_category_and_subcategory(
    category: str,
    subcategory_slugs: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Fetch products by category and optionally by subcategory slugs.
    
    Args:
        category: Category name (e.g., "Switches", "Bell Push", "Motor Starter")
        subcategory_slugs: List of subcategory slugs to filter by. If None, fetches all products in category.
    
    Returns:
        List of product documents
    """
    client = get_client()
    db = get_db()
    
    try:
        # Test connection
        await client.admin.command('ping')
        print(f"✓ Connected to MongoDB")
        
        # Build query
        query: Dict[str, Any] = {
            "category": {"$regex": f"^{category}$", "$options": "i"}
        }
        
        # If subcategory slugs are provided, filter by them
        if subcategory_slugs:
            # Load subcategory mapping to get actual names
            subcategory_mapping = load_subcategory_mapping()
            cat_mapping = subcategory_mapping.get(category, {})
            
            # Build list of subcategory names to match
            subcategory_names = []
            for slug in subcategory_slugs:
                # Try to get actual name from mapping
                if slug in cat_mapping:
                    subcategory_names.append(cat_mapping[slug])
                else:
                    # Fallback: convert slug to name pattern
                    # Slugs like "data-sockets-and-accessories---1-module" -> "Data Sockets & Accessories - 1 Module"
                    name = slug.replace("---", " - ").replace("-", " ")
                    # Capitalize words
                    name = " ".join(word.capitalize() for word in name.split())
                    subcategory_names.append(name)
            
            print(f"  Matching subcategories: {subcategory_names}")
            
            # Subcategory can be in: subcategory field or catalog_source.subcategory
            # Build $or conditions to match any of the subcategory names
            or_conditions = []
            for subcat_name in subcategory_names:
                # Escape special regex characters
                escaped_name = subcat_name.replace("(", "\\(").replace(")", "\\)")
                or_conditions.extend([
                    {"subcategory": {"$regex": f"^{escaped_name}$", "$options": "i"}},
                    {"catalog_source.subcategory": {"$regex": f"^{escaped_name}$", "$options": "i"}}
                ])
            
            if or_conditions:
                query["$or"] = or_conditions
        
        print(f"\nQuery: {json.dumps(query, indent=2, default=str)}")
        
        # Fetch products
        products = []
        async for doc in db.products.find(query):
            # Convert ObjectId to string
            doc["_id"] = str(doc["_id"])
            products.append(doc)
        
        print(f"✓ Found {len(products)} products")
        return products
        
    except Exception as e:
        print(f"✗ Error fetching products: {e}")
        import traceback
        traceback.print_exc()
        raise


async def main():
    """Main function to fetch all requested products"""
    
    # Define the subcategory slugs for Switches category
    switches_subcategories = [
        "accessories",
        "data-sockets-and-accessories---1-module",
        "data-sockets---1-module",
        "fan-regulators-and-dimmers---1-module",
        "fan-regulators-and-dimmers---2-module",
        "hospitality-range",
        "power-sockets---2-module",
        "switches-and-bell-push---1-module",
        "switches-and-bell-push---2-module",
        "wi-fi-curtain-controller",
        "wi-fi-fan-regulator",
        "wi-fi-light-dimmer",
        "wi-fi-scene-controller",
    ]
    
    script_dir = Path(__file__).parent
    output_dir = script_dir / "fetched_products"
    output_dir.mkdir(exist_ok=True)
    
    all_products = []
    
    try:
        # 1. Fetch Switches products with specific subcategories
        print("\n" + "="*60)
        print("Fetching Switches products with specific subcategories...")
        print("="*60)
        switches_products = await fetch_products_by_category_and_subcategory(
            category="Switches",
            subcategory_slugs=switches_subcategories
        )
        all_products.extend(switches_products)
        
        # Save Switches products to file
        switches_file = output_dir / "switches_products.json"
        with open(switches_file, 'w', encoding='utf-8') as f:
            json.dump(switches_products, f, indent=2, ensure_ascii=False)
        print(f"✓ Saved {len(switches_products)} Switches products to {switches_file}")
        
        # 2. Fetch all Bell Push products
        print("\n" + "="*60)
        print("Fetching all Bell Push products...")
        print("="*60)
        bell_push_products = await fetch_products_by_category_and_subcategory(
            category="Bell Push",
            subcategory_slugs=None  # All products
        )
        all_products.extend(bell_push_products)
        
        # Save Bell Push products to file
        bell_push_file = output_dir / "bell_push_products.json"
        with open(bell_push_file, 'w', encoding='utf-8') as f:
            json.dump(bell_push_products, f, indent=2, ensure_ascii=False)
        print(f"✓ Saved {len(bell_push_products)} Bell Push products to {bell_push_file}")
        
        # 3. Fetch all Motor Starter products
        print("\n" + "="*60)
        print("Fetching all Motor Starter products...")
        print("="*60)
        motor_starter_products = await fetch_products_by_category_and_subcategory(
            category="Motor Starter",
            subcategory_slugs=None  # All products
        )
        all_products.extend(motor_starter_products)
        
        # Save Motor Starter products to file
        motor_starter_file = output_dir / "motor_starter_products.json"
        with open(motor_starter_file, 'w', encoding='utf-8') as f:
            json.dump(motor_starter_products, f, indent=2, ensure_ascii=False)
        print(f"✓ Saved {len(motor_starter_products)} Motor Starter products to {motor_starter_file}")
        
        # Save all products to a combined file
        all_products_file = output_dir / "all_fetched_products.json"
        with open(all_products_file, 'w', encoding='utf-8') as f:
            json.dump(all_products, f, indent=2, ensure_ascii=False)
        
        # Print summary
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        print(f"Total products fetched: {len(all_products)}")
        print(f"  - Switches: {len(switches_products)}")
        print(f"  - Bell Push: {len(bell_push_products)}")
        print(f"  - Motor Starter: {len(motor_starter_products)}")
        print(f"\nAll products saved to: {all_products_file}")
        print("✓ Done!")
    finally:
        # Close client at the end
        client = get_client()
        client.close()
        print("\n✓ Connection closed")


if __name__ == "__main__":
    asyncio.run(main())

