"""
Upload MCB products from products.json to MongoDB database.

This script:
1. Reads products from products.json
2. Maps them to the ProductBase schema
3. Adds MCB highlights/features
4. Uploads to MongoDB products collection
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, Any, List

# Add parent directories to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


# MCB Product Highlights
MCB_HIGHLIGHTS = [
    "Conforms to IS/IEC 60898 - 6 kA",
    "Higher life with use of heavy duty contacts",
    "Innovatively designed breathing channels between poles ensure cooler operation",
    "Energy saving - watt loss approximately 50% lower than those prescribed by IEC standard",
    "Manufactured with high quality fire retardant material",
    "True contact indication for enhanced safety"
]


def load_products(json_path: Path) -> List[Dict[str, Any]]:
    """Load products from JSON file."""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def map_product_to_db_schema(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map product from products.json format to ProductBase schema format.
    
    products.json structure:
    - sku, name, product_family, category, subcategory
    - specs, variant, pricing, media, seo, status
    
    ProductBase schema expects:
    - sku, name, brand, category, series
    - list_price, currency, images, datasheet_url
    - specs, description, catalog_source
    """
    # Extract images from media.images array
    images = []
    if product.get("media") and product["media"].get("images"):
        images = [img.get("url", "") for img in product["media"]["images"] if img.get("url")]
    
    # Build description with highlights
    description_parts = [
        product["name"],
        "",
        "Features:",
        *[f"• {highlight}" for highlight in MCB_HIGHLIGHTS],
        "",
        f"Product Family: {product.get('product_family', '')}",
        f"Category: {product.get('category', '')}",
        f"Subcategory: {product.get('subcategory', '')}",
    ]
    
    # Add SEO meta description if available
    if product.get("seo") and product["seo"].get("meta_description"):
        description_parts.append("")
        description_parts.append(product["seo"]["meta_description"])
    
    description = "\n".join(description_parts)
    
    # Merge specs with additional product information
    specs = product.get("specs", {}).copy()
    
    # Add highlights to specs
    specs["highlights"] = MCB_HIGHLIGHTS
    
    # Add pricing info to specs
    if product.get("pricing"):
        specs["pricing"] = product["pricing"]
    
    # Add variant info if available
    if product.get("variant"):
        specs["variants"] = product["variant"]
    
    # Add SEO info to specs
    if product.get("seo"):
        specs["seo"] = product["seo"]
    
    # Add status info
    if product.get("status"):
        specs["status"] = product["status"]
    
    # Extract slug from product (either top-level or from seo)
    slug = product.get("slug") or (product.get("seo", {}).get("slug") if product.get("seo") else None)
    
    # Map to ProductBase schema
    db_product = {
        "sku": product["sku"],
        "name": product["name"],
        "brand": "L&T",  # Assuming L&T based on the catalog file name
        "category": product.get("category", "Circuit Protection"),
        "series": product.get("subcategory", "MCBs - C CURVE"),
        "list_price": int(product.get("pricing", {}).get("mrp", 0)),
        "currency": "INR",
        "images": images,
        "datasheet_url": None,
        "specs": specs,
        "description": description,
        "catalog_source": {
            "source": "products.json",
            "product_family": product.get("product_family"),
            "subcategory": product.get("subcategory"),
            "slug": slug,  # Include slug in catalog_source for reference
        }
    }
    
    # Add slug to specs if available
    if slug:
        specs["slug"] = slug
    
    return db_product


async def upload_products(
    client: AsyncIOMotorClient,
    db_name: str,
    products: List[Dict[str, Any]],
    upsert: bool = True
) -> Dict[str, Any]:
    """
    Upload products to MongoDB.
    
    Args:
        client: MongoDB async client
        db_name: Database name
        products: List of products to upload
        upsert: If True, update existing products by SKU, else skip duplicates
    
    Returns:
        Dictionary with upload statistics
    """
    db = client[db_name]
    collection = db.products
    
    stats = {
        "total": len(products),
        "inserted": 0,
        "updated": 0,
        "skipped": 0,
        "errors": 0,
        "error_details": []
    }
    
    for product in products:
        try:
            sku = product["sku"]
            
            if upsert:
                # Use upsert: update if exists, insert if not
                result = await collection.update_one(
                    {"sku": sku},
                    {"$set": product},
                    upsert=True
                )
                
                if result.upserted_id:
                    stats["inserted"] += 1
                    print(f"✓ Inserted: {sku} - {product['name']}")
                else:
                    stats["updated"] += 1
                    print(f"↻ Updated: {sku} - {product['name']}")
            else:
                # Check if exists first
                existing = await collection.find_one({"sku": sku})
                if existing:
                    stats["skipped"] += 1
                    print(f"⊘ Skipped (exists): {sku} - {product['name']}")
                else:
                    await collection.insert_one(product)
                    stats["inserted"] += 1
                    print(f"✓ Inserted: {sku} - {product['name']}")
                    
        except Exception as e:
            stats["errors"] += 1
            error_msg = f"Error uploading {product.get('sku', 'unknown')}: {str(e)}"
            stats["error_details"].append(error_msg)
            print(f"✗ {error_msg}")
    
    return stats


async def main():
    """Main function to run the uploader."""
    # Path to products.json
    script_dir = Path(__file__).parent
    products_json_path = script_dir / "products.json"
    
    if not products_json_path.exists():
        print(f"Error: products.json not found at {products_json_path}")
        sys.exit(1)
    
    print(f"Loading products from {products_json_path}...")
    products_json = load_products(products_json_path)
    print(f"Loaded {len(products_json)} products from JSON")
    
    print("\nMapping products to database schema...")
    db_products = []
    for product_json in products_json:
        try:
            db_product = map_product_to_db_schema(product_json)
            db_products.append(db_product)
        except Exception as e:
            print(f"Error mapping product {product_json.get('sku', 'unknown')}: {e}")
            continue
    
    print(f"Mapped {len(db_products)} products")
    
    # Connect to MongoDB
    print(f"\nConnecting to MongoDB: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}")
    
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB")
        
        # Upload products
        print(f"\nUploading {len(db_products)} products...")
        print("-" * 60)
        
        stats = await upload_products(
            client=client,
            db_name=settings.MONGODB_DB_NAME,
            products=db_products,
            upsert=True  # Update existing products by SKU
        )
        
        print("-" * 60)
        print("\nUpload Summary:")
        print(f"  Total products: {stats['total']}")
        print(f"  Inserted: {stats['inserted']}")
        print(f"  Updated: {stats['updated']}")
        print(f"  Skipped: {stats['skipped']}")
        print(f"  Errors: {stats['errors']}")
        
        if stats['error_details']:
            print("\nErrors:")
            for error in stats['error_details']:
                print(f"  - {error}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
    finally:
        client.close()
        print("\n✓ Connection closed")


if __name__ == "__main__":
    asyncio.run(main())

