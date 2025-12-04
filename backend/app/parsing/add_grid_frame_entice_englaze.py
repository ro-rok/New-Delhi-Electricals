"""
Add "Grid frame" attribute to specs for products with category "Plates"
in entice and englaze JSON files.

- If product name contains "Grid frame" (case-insensitive): set "Grid frame": true
- Otherwise: set "Grid frame": false
"""

import json
from pathlib import Path


def add_grid_frame_attribute(json_path: Path):
    """Add Grid frame attribute to specs for products with category 'Plates'."""
    with open(json_path, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    updated_count = 0
    with_grid_frame = 0
    without_grid_frame = 0
    
    for product in products:
        if product.get("category") == "Plates":
            # Ensure specs object exists
            if "specs" not in product:
                product["specs"] = {}
            
            # Check if name contains "Grid frame" (case-insensitive)
            product_name = product.get("name", "").lower()
            has_grid_frame = "grid frame" in product_name
            
            # Set the Grid frame attribute
            product["specs"]["Grid frame"] = has_grid_frame
            
            updated_count += 1
            if has_grid_frame:
                with_grid_frame += 1
                print(f"  ✓ {product.get('sku')} - Grid frame: true (name contains 'Grid frame')")
            else:
                without_grid_frame += 1
                print(f"  ✓ {product.get('sku')} - Grid frame: false (name does not contain 'Grid frame')")
    
    # Write back to file
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    return updated_count, with_grid_frame, without_grid_frame


if __name__ == "__main__":
    script_dir = Path(__file__).parent
    
    # Find all entice and englaze JSON files
    entice_files = list(script_dir.glob("entice*.json"))
    englaze_files = list(script_dir.glob("englaze*.json"))
    all_files = sorted(entice_files + englaze_files)
    
    if not all_files:
        print("No entice or englaze JSON files found!")
        exit(1)
    
    print(f"Found {len(all_files)} file(s) to process")
    print("=" * 60)
    
    total_updated = 0
    total_with_grid = 0
    total_without_grid = 0
    
    for json_file in all_files:
        print(f"\nProcessing: {json_file.name}")
        updated, with_grid, without_grid = add_grid_frame_attribute(json_file)
        total_updated += updated
        total_with_grid += with_grid
        total_without_grid += without_grid
        print(f"  Summary: {updated} products updated ({with_grid} with Grid frame, {without_grid} without)")
    
    print("\n" + "=" * 60)
    print(f"Total products updated: {total_updated}")
    print(f"  - With Grid frame (true): {total_with_grid}")
    print(f"  - Without Grid frame (false): {total_without_grid}")
    print("Done!")

