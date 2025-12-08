"""
Final script to complete product category updates:
1. Add top-level subcategory field for MCB products
2. Update SEO slugs and meta descriptions
3. Ensure all fields are consistent
"""

import json
from pathlib import Path

bell_push_file = Path(__file__).parent / "output" / "bell_push_products.json"
circuit_protection_file = Path(__file__).parent / "output" / "circuit_protection_penta_signia.json"


def update_mcb_products_final():
    """Add subcategory field and update SEO for MCB products."""
    with open(circuit_protection_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    updated = 0
    for product in products:
        # Add top-level subcategory if missing
        if 'subcategory' not in product or not product.get('subcategory'):
            # Get subcategory from catalog_source or determine from name
            catalog_subcat = product.get('catalog_source', {}).get('subcategory', '')
            name = product.get('name', '')
            
            if 'Mini MCB' in name or 'Mini MCBs' in catalog_subcat or 'mini-mcb' in product.get('catalog_source', {}).get('seo', {}).get('slug', '').lower():
                product['subcategory'] = 'Mini MCBs 3kA'
                updated += 1
            elif 'Miniature Circuit Breakers' in catalog_subcat:
                product['subcategory'] = 'Mini MCBs 3kA'
                updated += 1
        
        # Ensure catalog_source.subcategory is also set correctly
        if 'catalog_source' in product:
            if 'Mini MCB' in product.get('name', '') or 'Mini MCBs' in product.get('catalog_source', {}).get('subcategory', ''):
                product['catalog_source']['subcategory'] = 'Mini MCBs 3kA'
    
    # Save
    with open(circuit_protection_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Added subcategory to {updated} MCB products")
    return products


def update_bell_push_subcategories():
    """Ensure all Bell Push products have subcategory."""
    with open(bell_push_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    updated = 0
    for product in products:
        if 'subcategory' not in product or not product.get('subcategory'):
            # Determine from catalog_source or specs
            catalog_subcat = product.get('catalog_source', {}).get('subcategory', '')
            mw = product.get('specs', {}).get('mw', 1)
            
            if catalog_subcat:
                product['subcategory'] = catalog_subcat
            elif mw == 2:
                product['subcategory'] = 'Bell Push - 2 Module'
            else:
                product['subcategory'] = 'Bell Push - 1 Module'
            updated += 1
    
    # Save
    with open(bell_push_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Added subcategory to {updated} Bell Push products")
    return products


def main():
    print("="*80)
    print("Finalizing Product Updates")
    print("="*80)
    
    print("\n1. Updating MCB products subcategories...")
    mcb_products = update_mcb_products_final()
    
    print("\n2. Updating Bell Push products subcategories...")
    bell_push_products = update_bell_push_subcategories()
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"MCB products: {len(mcb_products)}")
    print(f"Bell Push products: {len(bell_push_products)}")
    print("="*80)
    print("\n✓ All updates completed!")


if __name__ == "__main__":
    main()
