"""
Script to update SEO for all products that have been re-categorized.
This will regenerate slugs, meta descriptions, and keywords to reflect the new categories.
"""
import json
import re
from pathlib import Path
from typing import Dict, Any


def create_slug(text: str) -> str:
    """Create a URL-friendly slug from text"""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug


def update_product_seo(product: Dict[str, Any]) -> bool:
    """
    Update SEO for a product based on its current category and subcategory.
    Returns True if SEO was updated, False otherwise.
    """
    name = product.get("name", "")
    brand = product.get("brand", "")
    category = product.get("category", "")
    subcategory = product.get("catalog_source", {}).get("subcategory", "")
    series = product.get("series", product.get("catalog_source", {}).get("product_family", ""))
    
    if not name or not category:
        return False
    
    # Generate new slug from product name
    new_slug = create_slug(name)
    
    # Ensure catalog_source structure exists
    if "catalog_source" not in product:
        product["catalog_source"] = {}
    if "seo" not in product["catalog_source"]:
        product["catalog_source"]["seo"] = {}
    
    # Update slug
    product["catalog_source"]["seo"]["slug"] = new_slug
    
    # Build keywords list
    keywords = []
    
    # Add category-specific keywords
    category_lower = category.lower()
    if category == "Accessories":
        keywords.append("Accessory")
    elif category == "Hospitality":
        keywords.append("Hospitality")
    elif category == "Switches":
        keywords.append("Switch")
    elif category == "Fan Controls":
        keywords.append("Fan Control")
    elif category == "Dimmers":
        keywords.append("Dimmer")
    elif category == "Data Sockets":
        keywords.append("Data Socket")
    elif category == "Power Sockets":
        keywords.append("Power Socket")
    
    # Extract key terms from product name
    name_parts = name.split(" - ")
    product_name = name_parts[0] if name_parts else name
    
    # Add product type keywords (extract from name)
    if "USB" in product_name:
        keywords.append("USB")
    if "Charger" in product_name:
        keywords.append("Charger")
    if "LED" in product_name:
        keywords.append("LED")
    if "Key Tag" in product_name or "Mech Key" in product_name:
        keywords.append("Key Tag")
    if "DND-MMR" in product_name or "DND MMR" in product_name:
        keywords.append("DND-MMR")
    
    # Add module count if available
    specs = product.get("specs", {})
    mw = specs.get("mw")
    if mw:
        keywords.append(f"{int(mw)}M")
    
    # Add color if available
    color = specs.get("color")
    if color:
        keywords.append(color)
    
    # Add subcategory to keywords
    if subcategory and subcategory not in keywords:
        keywords.append(subcategory)
    
    # Add series/brand
    if series and series not in keywords:
        keywords.append(series)
    if brand and brand not in keywords:
        keywords.append(brand)
    
    # Update keywords
    product["catalog_source"]["seo"]["keywords"] = keywords
    
    # Build meta description
    # Format: "Buy [Product Name] online at New Delhi Electricals. [Brand] [Category/Subcategory]."
    category_desc = subcategory.lower() if subcategory else category_lower
    meta_desc = f"Buy {name} online at New Delhi Electricals. {brand} {category_desc}."
    
    product["catalog_source"]["seo"]["meta_description"] = meta_desc
    
    # Update top-level description
    product["description"] = meta_desc
    
    return True


def main():
    """Main function to update SEO for all re-categorized products"""
    script_dir = Path(__file__).parent
    products_file = script_dir / "fetched_products" / "all_fetched_products.json"
    
    print("Loading products...")
    with open(products_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"Loaded {len(products)} products")
    print("\nUpdating SEO for all products...")
    
    # Update SEO for all products
    updated_count = 0
    for i, product in enumerate(products):
        if update_product_seo(product):
            updated_count += 1
        if (i + 1) % 50 == 0:
            print(f"  Processed {i + 1}/{len(products)} products...")
    
    print(f"\nUpdated SEO for {updated_count} products")
    
    # Save updated products
    print(f"\nSaving updated products to {products_file}...")
    with open(products_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    print("✓ Done!")


if __name__ == "__main__":
    main()

