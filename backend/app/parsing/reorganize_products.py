"""
Script to reorganize product categories and subcategories according to the plan.
"""
import json
import re
from pathlib import Path
from typing import Dict, Any, Tuple, Optional


def create_slug(text: str) -> str:
    """Create a URL-friendly slug from text"""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug


def get_module_count(product: Dict[str, Any]) -> int:
    """Get module count from product specs"""
    if "specs" in product and "mw" in product["specs"]:
        mw = product["specs"]["mw"]
        if isinstance(mw, (int, float)):
            return int(mw)
    return 1  # Default to 1 module


def update_seo_metadata(product: Dict[str, Any], new_category: str, new_subcategory: str) -> None:
    """Update SEO slug and meta description based on new category and subcategory"""
    name = product.get("name", "")
    brand = product.get("brand", "")
    series = product.get("series", product.get("catalog_source", {}).get("product_family", ""))
    
    # Extract color from specs or name
    color = ""
    if "specs" in product and "color" in product["specs"]:
        color = product["specs"]["color"]
    elif " - " in name:
        color = name.split(" - ")[-1]
    
    # Generate new slug
    slug_parts = [name.lower()]
    if color:
        slug_parts.append(color.lower())
    
    new_slug = create_slug(" ".join(slug_parts))
    
    # Update SEO in catalog_source
    if "catalog_source" not in product:
        product["catalog_source"] = {}
    if "seo" not in product["catalog_source"]:
        product["catalog_source"]["seo"] = {}
    
    product["catalog_source"]["seo"]["slug"] = new_slug
    
    # Update meta description
    category_lower = new_category.lower()
    meta_desc = f"Buy {name} online at New Delhi Electricals. {brand} {category_lower}."
    product["catalog_source"]["seo"]["meta_description"] = meta_desc
    
    # Update top-level description
    product["description"] = meta_desc


def determine_data_socket_category(product: Dict[str, Any]) -> Tuple[str, str]:
    """
    Determine category and subcategory for data socket products.
    Returns (category, subcategory)
    """
    name = product.get("name", "").lower()
    type_detail = product.get("specs", {}).get("type_detail", "").lower()
    keywords = product.get("catalog_source", {}).get("seo", {}).get("keywords", [])
    keywords_str = " ".join([k.lower() for k in keywords])
    
    search_text = f"{name} {type_detail} {keywords_str}"
    
    # Check for specific socket types
    if "rj 11" in search_text or "rj11" in search_text or "telephone" in search_text:
        return "Data Sockets", "Telephone Sockets - 1 Module"
    elif "rj 45" in search_text or "rj45" in search_text or "lan" in search_text or "cat" in search_text:
        return "Data Sockets", "LAN Sockets - 1 Module"
    elif "tv socket" in search_text or "tv" in search_text:
        return "Data Sockets", "TV Sockets - 1 Module"
    else:
        # Default to Accessories
        return "Accessories", "Data Sockets & Accessories - 1 Module"


def determine_fan_dimmer_category(product: Dict[str, Any]) -> Tuple[str, str]:
    """
    Determine category and subcategory for fan regulator/dimmer products.
    Returns (category, subcategory)
    """
    name = product.get("name", "").lower()
    type_detail = product.get("specs", {}).get("type_detail", "").lower()
    
    search_text = f"{name} {type_detail}"
    mw = get_module_count(product)
    
    if "fan regulator" in search_text or "fan" in search_text:
        if mw == 1:
            return "Fan Controls", "Fan Regulators - 1 Module"
        else:
            return "Fan Controls", "Fan Regulators - 2 Module"
    elif "dimmer" in search_text:
        if mw == 1:
            return "Dimmers", "Dimmers - 1 Module"
        else:
            return "Dimmers", "Dimmers - 1 Module"  # Dimmers typically 1 module
    else:
        # Default to Fan Controls if unclear
        if mw == 1:
            return "Fan Controls", "Fan Regulators - 1 Module"
        else:
            return "Fan Controls", "Fan Regulators - 2 Module"


def process_product(product: Dict[str, Any]) -> bool:
    """
    Process a single product and update its category/subcategory.
    Returns True if product was modified, False otherwise.
    """
    modified = False
    category = product.get("category", "")
    subcategory = product.get("catalog_source", {}).get("subcategory", "")
    
    # 1. Switches & Bell Push Products
    if category == "Switches" and subcategory in ["Switches & Bell Push - 1 Module", "Switches & Bell Push - 2 Module"]:
        mw = get_module_count(product)
        new_subcategory = f"Bell Push - {mw} Module"
        product["catalog_source"]["subcategory"] = new_subcategory
        update_seo_metadata(product, "Switches", new_subcategory)
        modified = True
    
    # 2. Bell Push Category Products
    elif category == "Bell Push":
        mw = get_module_count(product)
        new_subcategory = f"Bell Push - {mw} Module"
        product["category"] = "Switches"
        product["catalog_source"]["subcategory"] = new_subcategory
        update_seo_metadata(product, "Switches", new_subcategory)
        modified = True
    
    # 3. Motor Starter Category Products
    elif category == "Motor Starter":
        product["category"] = "Switches"
        product["catalog_source"]["subcategory"] = "Motor Starters - 2 Module"
        update_seo_metadata(product, "Switches", "Motor Starters - 2 Module")
        modified = True
    
    # 4. Wi-fi Products (Curtain Controller, Light Dimmer, Scene Controller)
    elif category == "Switches" and subcategory in ["Wi-fi Curtain Controller", "Wi-fi Light Dimmer", "Wi-fi Scene Controller"]:
        product["category"] = "Accessories"
        product["catalog_source"]["subcategory"] = "Wi-fi Accessories"
        update_seo_metadata(product, "Accessories", "Wi-fi Accessories")
        modified = True
    
    # 5. Data Sockets Products
    elif category == "Switches" and subcategory in ["Data Sockets & Accessories - 1 Module", "Data Sockets - 1 Module"]:
        new_category, new_subcategory = determine_data_socket_category(product)
        product["category"] = new_category
        product["catalog_source"]["subcategory"] = new_subcategory
        update_seo_metadata(product, new_category, new_subcategory)
        modified = True
    
    # 6. Fan Regulators & Dimmers Products
    elif category == "Switches" and subcategory in ["Fan Regulators & Dimmers - 1 Module", "Fan Regulators & Dimmers - 2 Module"]:
        new_category, new_subcategory = determine_fan_dimmer_category(product)
        product["category"] = new_category
        product["catalog_source"]["subcategory"] = new_subcategory
        update_seo_metadata(product, new_category, new_subcategory)
        modified = True
    
    # 7. Wi-fi Fan Regulator Products
    elif category == "Switches" and subcategory == "Wi-fi Fan Regulator":
        product["category"] = "Fan Controls"
        product["catalog_source"]["subcategory"] = "Modular IR Fan Regulators"
        update_seo_metadata(product, "Fan Controls", "Modular IR Fan Regulators")
        modified = True
    
    # 8. Power Sockets Products
    elif category == "Switches" and subcategory == "Power Sockets - 2 Module":
        product["category"] = "Power Sockets"
        # subcategory stays the same
        update_seo_metadata(product, "Power Sockets", subcategory)
        modified = True
    
    return modified


def update_categories_file(categories_file: Path) -> None:
    """Update categories_with_subcategories.json with new subcategories if needed"""
    with open(categories_file, 'r', encoding='utf-8') as f:
        categories = json.load(f)
    
    # Find Accessories category and add Wi-fi Accessories subcategory if needed
    accessories_cat = None
    for cat in categories:
        if cat.get("name") == "Accessories":
            accessories_cat = cat
            break
    
    if accessories_cat:
        # Check if Wi-fi Accessories subcategory exists
        subcat_exists = False
        for subcat in accessories_cat.get("subcategories", []):
            if subcat.get("slug") == "wi-fi-accessories":
                subcat_exists = True
                break
        
        if not subcat_exists:
            # Add Wi-fi Accessories subcategory
            if "subcategories" not in accessories_cat:
                accessories_cat["subcategories"] = []
            
            accessories_cat["subcategories"].append({
                "id": "wi-fi-accessories",
                "name": "Wi-fi Accessories",
                "slug": "wi-fi-accessories",
                "productCount": 0  # Will be updated when products are re-fetched
            })
            
            # Sort subcategories by name
            accessories_cat["subcategories"].sort(key=lambda x: x.get("name", ""))
    
    # Check if Data Sockets & Accessories - 1 Module exists in Accessories
    if accessories_cat:
        data_socket_subcat_exists = False
        for subcat in accessories_cat.get("subcategories", []):
            if subcat.get("slug") == "data-sockets-and-accessories---1-module":
                data_socket_subcat_exists = True
                break
        
        if not data_socket_subcat_exists:
            if "subcategories" not in accessories_cat:
                accessories_cat["subcategories"] = []
            
            accessories_cat["subcategories"].append({
                "id": "data-sockets-and-accessories---1-module",
                "name": "Data Sockets & Accessories - 1 Module",
                "slug": "data-sockets-and-accessories---1-module",
                "productCount": 0
            })
            
            accessories_cat["subcategories"].sort(key=lambda x: x.get("name", ""))
    
    # Save updated categories file
    with open(categories_file, 'w', encoding='utf-8') as f:
        json.dump(categories, f, indent=2, ensure_ascii=False)


def main():
    """Main function to reorganize products"""
    script_dir = Path(__file__).parent
    products_file = script_dir / "fetched_products" / "all_fetched_products.json"
    categories_file = script_dir / "categories_with_subcategories.json"
    
    print("Loading products...")
    with open(products_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"Loaded {len(products)} products")
    
    # Process each product
    modified_count = 0
    for i, product in enumerate(products):
        if process_product(product):
            modified_count += 1
        if (i + 1) % 50 == 0:
            print(f"Processed {i + 1}/{len(products)} products...")
    
    print(f"\nModified {modified_count} products")
    
    # Update categories file
    print("\nUpdating categories_with_subcategories.json...")
    update_categories_file(categories_file)
    
    # Save updated products
    print(f"\nSaving updated products to {products_file}...")
    with open(products_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    print("✓ Done!")


if __name__ == "__main__":
    main()

