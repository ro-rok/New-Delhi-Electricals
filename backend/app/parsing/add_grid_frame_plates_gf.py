"""
Script to add Grid Frame attribute to products in plates_gf.json.

Logic:
- If subcategory contains "without grid frames" (case-insensitive), set Grid Frame to false
- Otherwise, set Grid Frame to true
"""

import json
from pathlib import Path
from typing import Any, List, Dict

# File path
file_path = Path(__file__).parent / "plates_gf.json"

# Read the JSON file
print(f"Reading {file_path}...")
with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Track statistics
stats = {
    "with_grid_frame_true": 0,
    "with_grid_frame_false": 0,
    "already_has_attribute": 0,
    "total_processed": 0,
}

def process_product(product: Dict[str, Any], path: str = "") -> None:
    """Process a single product and add Grid Frame attribute if needed."""
    if not isinstance(product, dict):
        return
    
    stats["total_processed"] += 1
    
    # Check if product has specs
    if "specs" not in product:
        product["specs"] = {}
    elif not isinstance(product["specs"], dict):
        product["specs"] = {}
    
    # Check if Grid Frame attribute already exists
    if "Grid frame" in product["specs"]:
        stats["already_has_attribute"] += 1
        return
    
    # Get subcategory
    subcategory = product.get("subcategory", "").lower()
    
    # Determine Grid Frame value based on subcategory
    if "without grid frames" in subcategory:
        product["specs"]["Grid frame"] = False
        stats["with_grid_frame_false"] += 1
    else:
        product["specs"]["Grid frame"] = True
        stats["with_grid_frame_true"] += 1

def process_data(data: Any, path: str = "root") -> None:
    """Recursively process data structure to find all products."""
    if isinstance(data, dict):
        # Check if this is a product (has 'sku' key)
        if "sku" in data and "category" in data:
            process_product(data, path)
        else:
            # Recursively process dictionary values
            for key, value in data.items():
                process_data(value, f"{path}.{key}")
    elif isinstance(data, list):
        # Process each item in the list
        for i, item in enumerate(data):
            process_data(item, f"{path}[{i}]")

# Process the data structure
print("Processing products...")
process_data(data)

# Write back to file
print(f"\nWriting updated data to {file_path}...")
with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("\n" + "=" * 60)
print("Summary:")
print(f"  Products with Grid Frame = true: {stats['with_grid_frame_true']}")
print(f"  Products with Grid Frame = false: {stats['with_grid_frame_false']}")
print(f"  Products that already had the attribute: {stats['already_has_attribute']}")
print(f"  Total products processed: {stats['total_processed']}")
print("=" * 60)

# Verify examples - find products with "Cover Plates with grid frames"
print("\nVerification examples (Cover Plates with grid frames):")
count = 0
def find_examples(data: Any, count: int = 0) -> int:
    """Find example products with 'Cover Plates with grid frames'."""
    if isinstance(data, dict):
        if "sku" in data and "subcategory" in data:
            subcategory = data.get("subcategory", "")
            if "Cover Plates with grid frames" in subcategory and count < 3:
                grid_frame = data.get("specs", {}).get("Grid frame")
                print(f"  SKU: {data.get('sku')}")
                print(f"    Subcategory: {subcategory}")
                print(f"    Grid Frame: {grid_frame}")
                return count + 1
        else:
            for value in data.values():
                count = find_examples(value, count)
    elif isinstance(data, list):
        for item in data:
            count = find_examples(item, count)
    return count

find_examples(data)

print("\nDone!")

