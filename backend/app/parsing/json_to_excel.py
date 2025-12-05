"""
Script to convert all_fetched_products.json to Excel format
"""
import json
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List


def flatten_dict(d: Dict[str, Any], parent_key: str = '', sep: str = '.') -> Dict[str, Any]:
    """Flatten a nested dictionary"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            # Convert lists to comma-separated strings or JSON strings
            if len(v) > 0 and isinstance(v[0], dict):
                items.append((new_key, json.dumps(v, ensure_ascii=False)))
            else:
                items.append((new_key, ', '.join(str(item) for item in v)))
        else:
            items.append((new_key, v))
    return dict(items)


def main():
    """Convert JSON to Excel"""
    script_dir = Path(__file__).parent
    json_file = script_dir / "fetched_products" / "all_fetched_products.json"
    excel_file = script_dir / "fetched_products" / "all_fetched_products.xlsx"
    
    print(f"Loading JSON file: {json_file}")
    with open(json_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"Loaded {len(products)} products")
    
    # Flatten each product
    print("Flattening product data...")
    flattened_products = []
    for product in products:
        flattened = flatten_dict(product)
        flattened_products.append(flattened)
    
    # Create DataFrame
    print("Creating DataFrame...")
    df = pd.DataFrame(flattened_products)
    
    # Reorder columns to put important ones first
    important_cols = [
        '_id', 'sku', 'name', 'brand', 'category', 
        'catalog_source.subcategory', 'series', 'list_price', 'currency',
        'description', 'catalog_source.seo.slug', 'catalog_source.seo.meta_description'
    ]
    
    # Get columns that exist
    ordered_cols = [col for col in important_cols if col in df.columns]
    # Add remaining columns
    remaining_cols = [col for col in df.columns if col not in ordered_cols]
    final_cols = ordered_cols + remaining_cols
    
    df = df[final_cols]
    
    # Write to Excel
    print(f"Writing to Excel file: {excel_file}")
    with pd.ExcelWriter(excel_file, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Products', index=False)
        
        # Auto-adjust column widths
        worksheet = writer.sheets['Products']
        for idx, col in enumerate(df.columns):
            max_length = max(
                df[col].astype(str).map(len).max(),
                len(str(col))
            )
            # Limit max width to 50
            max_length = min(max_length, 50)
            # Get Excel column letter (A, B, C, ..., Z, AA, AB, etc.)
            col_letter = ''
            temp_idx = idx
            while temp_idx >= 0:
                col_letter = chr(65 + (temp_idx % 26)) + col_letter
                temp_idx = temp_idx // 26 - 1
            worksheet.column_dimensions[col_letter].width = max_length + 2
    
    print(f"✓ Successfully converted {len(products)} products to Excel")
    print(f"  Output file: {excel_file}")


if __name__ == "__main__":
    main()

