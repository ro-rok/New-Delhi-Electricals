# Product Upload Script

This script uploads products from JSON files in the parsing folder to MongoDB.

## Prerequisites

1. MongoDB connection credentials must be set in `.env` file:
   - `MONGODB_URI`: MongoDB connection string
   - `MONGODB_DB_NAME`: Database name (default: `nde_catalog`)

2. Python virtual environment should be activated with required dependencies installed.

## Usage

### From the project root:

```bash
# Activate virtual environment (Windows)
backend\venv\Scripts\activate

# Activate virtual environment (Linux/Mac)
source backend/venv/bin/activate

# Run the upload script
python backend/app/parsing/upload_products_to_db.py
```

### From the backend directory:

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

# Run the upload script
python app/parsing/upload_products_to_db.py
```

## What the Script Does

1. **Reads all JSON files** from the `backend/app/parsing/` folder
2. **Transforms product data** from Product schema format to ProductBase format:
   - Maps `product_family` → `series`
   - Maps `pricing.mrp` → `list_price` (as integer)
   - Extracts image URLs from `media.images`
   - Maps `seo.meta_description` → `description`
   - Stores additional fields in `catalog_source`
3. **Uses upsert operation**: Updates existing products (matched by SKU) or inserts new ones
4. **Provides progress tracking**: Shows progress every 100 products and summary at the end

## Output

The script provides detailed logging:
- Progress updates every 100 products
- Summary per file (processed, inserted, updated, errors)
- Overall summary at the end
- Error details for any failed products

## Example Output

```
2024-01-15 10:30:00 - INFO - Starting product upload to MongoDB...
2024-01-15 10:30:00 - INFO - MongoDB URI: mongodb://localhost:27017
2024-01-15 10:30:00 - INFO - Database: nde_catalog
2024-01-15 10:30:00 - INFO - Found 23 JSON file(s) to process
2024-01-15 10:30:00 - INFO - Reading file: encurve 1.json
2024-01-15 10:30:05 - INFO - Processed 100 products from encurve 1.json
...
2024-01-15 10:35:00 - INFO - Completed encurve 1.json: 1836 processed, 1836 inserted, 0 updated, 0 errors
...
2024-01-15 10:40:00 - INFO - ============================================================
2024-01-15 10:40:00 - INFO - Upload Summary:
2024-01-15 10:40:00 - INFO -   Files processed: 23
2024-01-15 10:40:00 - INFO -   Products processed: 50000
2024-01-15 10:40:00 - INFO -   Products inserted: 45000
2024-01-15 10:40:00 - INFO -   Products updated: 5000
2024-01-15 10:40:00 - INFO -   Errors: 0
2024-01-15 10:40:00 - INFO - ============================================================
```

## Data Transformation

The script transforms the Product schema format to ProductBase format:

| Product Schema Field | ProductBase Field | Notes |
|---------------------|-------------------|-------|
| `sku` | `sku` | Direct mapping |
| `name` | `name` | Direct mapping |
| `brand` | `brand` | Direct mapping |
| `category` | `category` | Direct mapping |
| `product_family` | `series` | Renamed |
| `pricing.mrp` | `list_price` | Converted to integer |
| `currency` | `currency` | Default: "INR" |
| `media.images[].url` | `images[]` | Extracted URLs |
| `media.documents[0]` | `datasheet_url` | First document URL |
| `specs` | `specs` | Kept as dict |
| `seo.meta_description` | `description` | Direct mapping |
| Other fields | `catalog_source` | Stored in metadata |

## Error Handling

- Invalid JSON files are skipped with error logging
- Individual product errors are logged but don't stop the upload
- The script continues processing remaining files even if one fails
- Error summary is provided at the end

## Notes

- The script uses **upsert** operations: if a product with the same SKU exists, it will be updated; otherwise, it will be inserted
- All products are processed asynchronously for better performance
- The MongoDB client connection is reused across all files for efficiency

