# Quotations API (Admin)

Base path: `/api/admin/quotations`  
Authentication: `Authorization: Bearer <admin_token>` from `POST /auth/login`

## Quotation Maker

### List categories with counts
```
GET /api/admin/quotations/quotation-maker/categories
```

### Facets for filters
```
GET /api/admin/quotations/quotation-maker/facets?category=Switches&brand=Anchor
```

### Products (paginated)
```
GET /api/admin/quotations/quotation-maker/products?category=Switches&page=1&pageSize=50&q=entice
```

Optional filter query params depend on category (e.g. `brand`, `series`, `color`, `mw`).

### Frequent / recent products
```
GET /api/admin/quotations/quotation-maker/frequent?limit=12
GET /api/admin/quotations/quotation-maker/recent?limit=12
```

## CRUD

### Create
```json
POST /api/admin/quotations
{
  "status": "draft",
  "customer": { "name": "Acme", "phone": "9999999999", "gstNumber": "", "address": "" },
  "items": [
    { "productId": "<mongo_id>", "quantity": 2, "itemDiscountPct": 5 }
  ],
  "overallDiscountPct": 0,
  "gstMode": "exclusive",
  "gstRate": 18
}
```

### Update
```
PATCH /api/admin/quotations/{id}
```

### Duplicate
```
POST /api/admin/quotations/{id}/duplicate
```

### PDF
```
GET /api/admin/quotations/{id}/pdf
```

### Delete (draft only)
```
DELETE /api/admin/quotations/{id}
```

Interactive docs: `/docs` (OpenAPI).
