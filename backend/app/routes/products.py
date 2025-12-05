from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db_dep
from ..schemas import ProductCreate, ProductUpdate, ProductInDB, ProductListResponse
from ..security import get_current_admin


router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
async def list_products(
    q: str | None = Query(default=None, description="Search query"),
    category: str | None = Query(default=None, description="Filter by category name"),
    brand: str | None = Query(default=None, description="Filter by brand name"),
    series: str | None = Query(default=None, description="Filter by product series/family"),
    min_price: float | None = Query(default=None, ge=0, description="Minimum price"),
    max_price: float | None = Query(default=None, ge=0, description="Maximum price"),
    sort_by: str | None = Query(default="name", description="Sort field: name or price"),
    sort_order: str | None = Query(default="asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=10000, alias="pageSize"),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
) -> Any:
    skip = (page - 1) * page_size
    query: dict[str, Any] = {}
    
    # Build MongoDB query dynamically based on filters
    if q:
        query["$text"] = {"$search": q}
    
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    
    if brand:
        query["brand"] = brand
    
    if series:
        # Check both series and product_family fields
        query["$or"] = [
            {"series": {"$regex": series, "$options": "i"}},
            {"product_family": {"$regex": series, "$options": "i"}}
        ]
    
    # Price range filtering
    if min_price is not None or max_price is not None:
        price_query: dict[str, Any] = {}
        if min_price is not None:
            price_query["$gte"] = min_price
        if max_price is not None:
            price_query["$lte"] = max_price
        query["list_price"] = price_query
    
    # Build sort query
    sort_field = "name" if sort_by == "name" else "list_price"
    sort_direction = 1 if sort_order == "asc" else -1
    sort_query = [(sort_field, sort_direction)]
    
    total = await db.products.count_documents(query)
    cursor = db.products.find(query).sort(sort_query).skip(skip).limit(page_size)
    items: List[ProductInDB] = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(ProductInDB(**doc))
    return ProductListResponse(items=items, total=total, page=page, pageSize=page_size)


@router.post("", response_model=ProductInDB, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    doc = payload.model_dump(by_alias=True)
    res = await db.products.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return ProductInDB(**doc)


@router.get("/categories", response_model=List[dict])
async def get_categories(
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
) -> Any:
    """Get all unique categories from products with product counts"""
    pipeline = [
        {
            "$group": {
                "_id": "$category",
                "count": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "name": "$_id",
                "productCount": "$count"
            }
        },
        {
            "$sort": {"name": 1}
        }
    ]
    
    categories = []
    async for doc in db.products.aggregate(pipeline):
        slug = doc["name"].lower().replace(" ", "-").replace("/", "-").replace("(", "").replace(")", "")
        categories.append({
            "id": slug,
            "name": doc["name"],
            "slug": slug,
            "description": f"{doc['name']} products",
            "icon": "Package",
            "image": f"/category-images/{slug}.jpg",
            "productCount": doc["productCount"]
        })
    
    return categories


@router.get("/brands", response_model=List[dict])
async def get_brands(
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
) -> Any:
    """Get all unique brands from products with product counts"""
    pipeline = [
        {
            "$group": {
                "_id": "$brand",
                "count": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "name": "$_id",
                "productCount": "$count"
            }
        },
        {
            "$sort": {"name": 1}
        }
    ]
    
    brands = []
    async for doc in db.products.aggregate(pipeline):
        slug = doc["name"].lower().replace(" ", "-").replace("/", "-").replace("(", "").replace(")", "")
        brands.append({
            "id": slug,
            "name": doc["name"],
            "slug": slug,
            "logo": f"/brands/{slug}.svg",
            "description": f"{doc['name']} products",
            "featured": False,
            "productCount": doc["productCount"]
        })
    
    return brands


@router.get("/slug/{slug}", response_model=ProductInDB)
async def get_product_by_slug(slug: str, db: AsyncIOMotorDatabase = Depends(get_db_dep)) -> Any:
    """Fetch product by SEO slug. Checks multiple possible locations for the slug"""
    # Try multiple possible locations for the slug
    # Based on how products are transformed, slug can be in:
    # - catalog_source.seo.slug (most common - from transform_product)
    # - catalog_source.slug (from upload_mcb_products)
    # - specs.slug (from upload_mcb_products)
    # - seo.slug (if stored at top level)
    # - slug (if stored at top level)
    doc = await db.products.find_one({
        "$or": [
            {"catalog_source.seo.slug": slug},
            {"catalog_source.slug": slug},
            {"specs.slug": slug},
            {"seo.slug": slug},
            {"slug": slug},
        ]
    })
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    doc["_id"] = str(doc["_id"])
    return ProductInDB(**doc)


@router.get("/{product_id}", response_model=ProductInDB)
async def get_product(product_id: str, db: AsyncIOMotorDatabase = Depends(get_db_dep)) -> Any:
    doc = await db.products.find_one({"_id": product_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    doc["_id"] = str(doc["_id"])
    return ProductInDB(**doc)


@router.patch("/{product_id}", response_model=ProductInDB)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    if not update:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    res = await db.products.find_one_and_update(
        {"_id": product_id},
        {"$set": update},
        return_document=True,
    )
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    res["_id"] = str(res["_id"])
    return ProductInDB(**res)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> None:
    await db.products.delete_one({"_id": product_id})
    return None

