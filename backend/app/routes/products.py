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
    product_family: str | None = Query(default=None, description="Filter by exact product_family match"),
    color: str | None = Query(default=None, description="Filter by color from specs"),
    module_size: str | None = Query(default=None, alias="moduleSize", description="Filter by module_size from specs"),
    min_price: float | None = Query(default=None, ge=0, description="Minimum price"),
    max_price: float | None = Query(default=None, ge=0, description="Maximum price"),
    sort_by: str | None = Query(default="name", description="Sort field: name or price"),
    sort_order: str | None = Query(default="asc", description="Sort order: asc or desc"),
    is_active: bool | None = Query(default=None, description="Filter by active status"),
    missing_images: bool | None = Query(
        default=None,
        alias="missingImages",
        description="When true, only return products without images",
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=10000, alias="pageSize"),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
) -> Any:
    skip = (page - 1) * page_size
    query: dict[str, Any] = {}
    


    # Re-structuring query to handle multiple $or conditions safely
    and_conditions = []
    
    if q:
        # Use regex search across multiple fields instead of $text (which requires text index)
        search_pattern = {"$regex": q, "$options": "i"}
        and_conditions.append({
            "$or": [
                {"name": search_pattern},
                {"sku": search_pattern},
                {"description": search_pattern},
                {"brand": search_pattern},
                {"category": search_pattern},
                {"series": search_pattern},
            ]
        })
    
    if category:
        and_conditions.append({"category": {"$regex": category, "$options": "i"}})
        
    if brand:
        and_conditions.append({"brand": {"$regex": brand, "$options": "i"}})
        
    if series:
        and_conditions.append({
            "$or": [
                {"series": {"$regex": series, "$options": "i"}},
                {"product_family": {"$regex": series, "$options": "i"}}
            ]
        })
    
    if product_family:
        and_conditions.append({"product_family": {"$regex": product_family, "$options": "i"}})
    
    if color:
        and_conditions.append({"specs.color": {"$regex": color, "$options": "i"}})
    
    if module_size:
        and_conditions.append({"specs.module_size": {"$regex": module_size, "$options": "i"}})
        
    if min_price is not None or max_price is not None:
        price_query = {}
        if min_price is not None: price_query["$gte"] = min_price
        if max_price is not None: price_query["$lte"] = max_price
        and_conditions.append({"list_price": price_query})

    if is_active is not None:
        if is_active:
            and_conditions.append({
                "$or": [
                    {"status.is_active": True},
                    {"status.is_active": {"$exists": False}}
                ]
            })
        else:
            and_conditions.append({"status.is_active": False})

    if missing_images:
        # Products where images is missing or empty
        and_conditions.append({
            "$or": [
                {"images": {"$exists": False}},
                {"images": {"$size": 0}},
            ]
        })
            
    if and_conditions:
        query = {"$and": and_conditions}
    else:
        query = {}
    
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
    # Fallback: try matching name-derived slug or SKU
    if not doc:
        # Replace dashes with spaces and match name loosely (case-insensitive)
        loose = slug.replace("-", " ")
        # Token-based regex: require all tokens to appear (order flexible)
        tokens = [t for t in slug.split("-") if t]
        token_regex = [{"name": {"$regex": t, "$options": "i"}} for t in tokens]
        loose_query = {
            "$or": [
                {"name": {"$regex": f"^{loose}$", "$options": "i"}},
                {"name": {"$regex": loose, "$options": "i"}},
                {"sku": {"$regex": f"^{slug}$", "$options": "i"}},
                {"sku": {"$regex": slug, "$options": "i"}},
                {"$and": token_regex} if token_regex else {},
            ]
        }
        doc = await db.products.find_one(loose_query)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    doc["_id"] = str(doc["_id"])
    return ProductInDB(**doc)


from bson import ObjectId
from bson.errors import InvalidId

# ... existing imports ...

@router.get("/{product_id}", response_model=ProductInDB)
async def get_product(product_id: str, db: AsyncIOMotorDatabase = Depends(get_db_dep)) -> Any:
    try:
        query_id = ObjectId(product_id)
    except InvalidId:
        query_id = product_id
        
    doc = await db.products.find_one({"_id": query_id})
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
    

    
    try:
        query_id = ObjectId(product_id)
    except InvalidId:
        query_id = product_id

    res = await db.products.find_one_and_update(
        {"_id": query_id},
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
    try:
        query_id = ObjectId(product_id)
    except InvalidId:
        query_id = product_id
        
    await db.products.delete_one({"_id": query_id})
    return None

