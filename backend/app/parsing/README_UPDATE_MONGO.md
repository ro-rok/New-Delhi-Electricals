# Update Products in MongoDB

This script updates product category, subcategory, and SEO fields in MongoDB from the updated JSON files.

## Files Updated

- `bell_push_products.json` - Bell Push products (category: Switches, subcategories: Bell Push - 1 Module, Bell Push - 2 Module)
- `circuit_protection_penta_signia.json` - MCB products (category: Switches, subcategory: Mini MCBs 3kA)

## What Gets Updated

For each product (matched by SKU), the following fields are updated:
- `category` - Changed to "Switches"
- `subcategory` - Set based on product type (Bell Push - 1 Module, Bell Push - 2 Module, or Mini MCBs 3kA)
- `description` - Top-level description field
- `catalog_source.subcategory` - Updated to match the new subcategory
- `catalog_source.seo.slug` - SEO slug (if changed)
- `catalog_source.seo.meta_description` - SEO meta description (if changed)
- `catalog_source.seo.keywords` - SEO keywords (if changed)

## How to Run

### Windows (PowerShell)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
cd app\parsing
python update_products_in_mongo.py
```

### Windows (CMD)
```cmd
cd backend
venv\Scripts\activate.bat
cd app\parsing
python update_products_in_mongo.py
```

### Linux/Mac
```bash
cd backend
source venv/bin/activate
cd app/parsing
python update_products_in_mongo.py
```

## Expected Output

The script will:
1. Read both JSON files from the `output/` directory
2. For each product, find it in MongoDB by SKU
3. Update the category, subcategory, and SEO fields
4. Report statistics:
   - Number of products processed
   - Number of products updated
   - Number of products not found (if any)
   - Number of errors (if any)

## Example Output

```
================================================================================
Updating Products in MongoDB
================================================================================
Found 2 file(s) to process

Processing: bell_push_products.json
--------------------------------------------------------------------------------
Reading file: bell_push_products.json
✓ Updated: ACWSBXG101 - Bell Push 10A 1M - Grey
✓ Updated: ACWSBXW101 - Bell Push 10A 1M - White
...
Completed bell_push_products.json: 10 processed, 10 updated, 0 not found, 0 errors

Processing: circuit_protection_penta_signia.json
--------------------------------------------------------------------------------
Reading file: circuit_protection_penta_signia.json
✓ Updated: 65990 - 10A DP 'C' Mini MCB
...
Completed circuit_protection_penta_signia.json: 38 processed, 38 updated, 0 not found, 0 errors

================================================================================
Update Summary:
================================================================================
  Files processed: 2
  Products processed: 48
  Products updated: 48
  Products not found: 0
  Errors: 0
================================================================================
MongoDB connection closed
```

## Notes

- The script uses **upsert=False**, meaning it only updates existing products. Products not found in MongoDB will be reported but not inserted.
- Products are matched by `sku` field.
- Only the specified fields are updated; other product fields remain unchanged.
- The script requires a valid `.env` file in the `backend/` directory with MongoDB connection settings.
