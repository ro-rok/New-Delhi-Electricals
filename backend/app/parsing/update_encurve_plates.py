"""
Update encurve JSON files: Set subcategory to "PVC Cover Plates with Grid Frame"
for all products where category is "Plates".
"""

import json
from pathlib import Path


def update_plates_subcategory(json_path: Path):
    """Update subcategory for products with category 'Plates'."""
    with open(json_path, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    updated_count = 0
    for product in products:
        if product.get("category") == "Plates":
            old_subcategory = product.get("subcategory", "")
            product["subcategory"] = "PVC Cover Plates with Grid Frame"
            if old_subcategory != product["subcategory"]:
                updated_count += 1
                print(f"  Updated: {product.get('sku')} - {product.get('name')}")
                print(f"    Old subcategory: {old_subcategory}")
                print(f"    New subcategory: {product['subcategory']}")
    
    # Write back to file
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    return updated_count


if __name__ == "__main__":
    script_dir = Path(__file__).parent
    
    # Find all encurve JSON files
    encurve_files = list(script_dir.glob("encurve*.json"))
    
    if not encurve_files:
        print("No encurve JSON files found!")
        exit(1)
    
    print(f"Found {len(encurve_files)} encurve JSON file(s)")
    print("=" * 60)
    
    total_updated = 0
    for json_file in sorted(encurve_files):
        print(f"\nProcessing: {json_file.name}")
        updated = update_plates_subcategory(json_file)
        total_updated += updated
        print(f"  ✓ Updated {updated} products")
    
    print("\n" + "=" * 60)
    print(f"Total products updated: {total_updated}")
    print("Done!")

