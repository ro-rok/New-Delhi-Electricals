"""
Script to update product categories:
- Bell Push products: Change category from "Bell Push" to "Switches"
- MCB products: Change category from "Circuit Protection" to "Switches" with subcategory "Mini MCBs 3kA"
"""

import json
from pathlib import Path

# File paths
bell_push_file = Path(__file__).parent / "output" / "bell_push_products.json"
circuit_protection_file = Path(__file__).parent / "output" / "circuit_protection_penta_signia.json"

# Subcategory mappings
# Bell Push subcategories are already correct: "Bell Push - 1 Module" and "Bell Push - 2 Module"
# MCB subcategory should be "Mini MCBs 3kA" (from categories_with_subcategories.json)

def update_bell_push_products():
    """Update Bell Push products to category Switches."""
    with open(bell_push_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    updated_count = 0
    for product in products:
        # Update category
        if product.get('category') == 'Bell Push':
            product['category'] = 'Switches'
            updated_count += 1
        
        # Subcategory should already be correct (Bell Push - 1 Module or Bell Push - 2 Module)
        # But ensure it exists
        if not product.get('subcategory'):
            # Determine subcategory based on specs.mw
            mw = product.get('specs', {}).get('mw', 1)
            if mw == 2:
                product['subcategory'] = 'Bell Push - 2 Module'
            else:
                product['subcategory'] = 'Bell Push - 1 Module'
        
        # Update SEO meta description to reflect new category
        if 'catalog_source' in product and 'seo' in product['catalog_source']:
            seo = product['catalog_source']['seo']
            old_desc = seo.get('meta_description', '')
            # Replace "Bell Push" category references in description if needed
            # Most descriptions already say "Bell Push" as product name, which is fine
            # Just ensure it mentions it's a switch
            if 'switch' not in old_desc.lower() and 'bell push' in old_desc.lower():
                seo['meta_description'] = old_desc.replace(
                    'Buy Bell Push',
                    'Buy Bell Push Switch'
                ).replace(
                    'from the',
                    'from the'
                )
        
        # Update description field (top-level)
        if product.get('description'):
            old_desc = product['description']
            if 'switch' not in old_desc.lower() and 'bell push' in old_desc.lower():
                product['description'] = old_desc.replace(
                    'Buy Bell Push',
                    'Buy Bell Push Switch'
                )
    
    # Save updated file
    with open(bell_push_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Updated {updated_count} Bell Push products")
    return products


def update_mcb_products():
    """Update MCB products to category Switches with subcategory Mini MCBs 3kA."""
    with open(circuit_protection_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    updated_count = 0
    for product in products:
        # Update category from Circuit Protection to Switches
        if product.get('category') == 'Circuit Protection':
            product['category'] = 'Switches'
            updated_count += 1
        
        # Update subcategory to "Mini MCBs 3kA"
        # Check if it's an MCB product (has Mini MCB in name or subcategory)
        subcategory = product.get('catalog_source', {}).get('subcategory', '')
        name = product.get('name', '')
        
        if 'Mini MCB' in name or 'Mini MCBs' in subcategory or 'mini-mcb' in product.get('catalog_source', {}).get('seo', {}).get('slug', '').lower():
            product['subcategory'] = 'Mini MCBs 3kA'
            if 'catalog_source' in product:
                product['catalog_source']['subcategory'] = 'Mini MCBs 3kA'
        
        # Update SEO meta description to reflect new category
        if 'catalog_source' in product and 'seo' in product['catalog_source']:
            seo = product['catalog_source']['seo']
            old_desc = seo.get('meta_description', '')
            # Update description to mention it's in Switches category
            if 'Circuit Protection' in old_desc or 'circuit protection' in old_desc.lower():
                seo['meta_description'] = old_desc.replace(
                    'Circuit Protection',
                    'Switches'
                ).replace(
                    'circuit protection',
                    'switches'
                )
        
        # Update description field (top-level)
        if product.get('description'):
            old_desc = product['description']
            if 'Circuit Protection' in old_desc or 'circuit protection' in old_desc.lower():
                product['description'] = old_desc.replace(
                    'Circuit Protection',
                    'Switches'
                ).replace(
                    'circuit protection',
                    'switches'
                )
        
        # Update SEO slug if it contains circuit-protection
        if 'catalog_source' in product and 'seo' in product['catalog_source']:
            seo = product['catalog_source']['seo']
            old_slug = seo.get('slug', '')
            if 'circuit-protection' in old_slug:
                seo['slug'] = old_slug.replace('circuit-protection', 'switches')
    
    # Save updated file
    with open(circuit_protection_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Updated {updated_count} MCB products")
    return products


def main():
    print("="*80)
    print("Updating Product Categories")
    print("="*80)
    
    print("\n1. Updating Bell Push products...")
    bell_push_products = update_bell_push_products()
    
    print("\n2. Updating MCB products...")
    mcb_products = update_mcb_products()
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Bell Push products updated: {len(bell_push_products)}")
    print(f"MCB products updated: {len(mcb_products)}")
    print("="*80)
    print("\n✓ Files updated successfully!")
    print(f"  - {bell_push_file}")
    print(f"  - {circuit_protection_file}")


if __name__ == "__main__":
    main()
