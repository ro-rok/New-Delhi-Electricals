# Product Query Results

This document contains the queries to retrieve:
1. All products from "Bell Push" category
2. Circuit Protection products with product_family "Penta" or "Signia"

## Query Script

A Python script `query_products.py` has been created to execute these queries. Run it with:

### Windows (PowerShell):
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python app\parsing\query_products.py
```

### Windows (Command Prompt):
```cmd
cd backend
venv\Scripts\activate.bat
python app\parsing\query_products.py
```

### Linux/Mac:
```bash
cd backend
source venv/bin/activate
python app/parsing/query_products.py
```

### One-liner (Windows PowerShell):
```powershell
cd backend; .\venv\Scripts\Activate.ps1; python app\parsing\query_products.py
```

### One-liner (Windows CMD):
```cmd
cd backend && venv\Scripts\activate.bat && python app\parsing\query_products.py
```

## API Endpoints

Alternatively, you can use the API endpoints directly:

### 1. Bell Push Products

```bash
GET /api/products?category=Bell%20Push&pageSize=1000
```

Or using curl:
```bash
curl "http://localhost:8000/api/products?category=Bell%20Push&pageSize=1000"
```

### 2. Circuit Protection with Penta/Signia

The API currently supports filtering by a single `product_family` at a time. You'll need to make two separate requests:

**For Penta:**
```bash
GET /api/products?category=Circuit%20Protection&product_family=Penta&pageSize=1000
```

**For Signia:**
```bash
GET /api/products?category=Circuit%20Protection&product_family=Signia&pageSize=1000
```

Or combine them in the script which queries both and merges results.

## MongoDB Queries

If querying MongoDB directly:

### Query 1: Bell Push Products
```javascript
db.products.find({
  $or: [
    { category: { $regex: "Bell Push", $options: "i" } },
    { subcategory: { $regex: "Bell Push", $options: "i" } }
  ]
}).sort({ name: 1 })
```

### Query 2: Circuit Protection with Penta or Signia
```javascript
db.products.find({
  $and: [
    { category: { $regex: "Circuit Protection", $options: "i" } },
    {
      $or: [
        { product_family: { $regex: "^Penta$", $options: "i" } },
        { product_family: { $regex: "^Signia$", $options: "i" } }
      ]
    }
  ]
}).sort({ name: 1 })
```

## Output Files

The script will create the following files in `backend/app/parsing/output/`:

1. `bell_push_products.json` - All Bell Push products
2. `circuit_protection_penta_signia.json` - Circuit Protection products with Penta or Signia families
3. `query_results_YYYYMMDD_HHMMSS.txt` - Full query log with all output

## Notes

- The script uses case-insensitive regex matching for categories and product families
- Bell Push products may be found in both the `category` field (if "Bell Push" is a top-level category) or in the `subcategory` field (if it's a subcategory under "Switches")
- For Circuit Protection, the script will show available product families if Penta/Signia are not found

