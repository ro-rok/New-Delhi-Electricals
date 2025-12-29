import re
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db_dep
from ..schemas import ProductCreate, ProductUpdate, ProductInDB, ProductListResponse
from ..security import get_current_admin
from ..utils.search_parser import SearchParser
from ..services.search_engine import SearchEngine


def escape_regex(text: str) -> str:
    """Escape special regex characters in text."""
    return re.escape(text)


router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
async def list_products(
    q: str | None = Query(default=None, description="Search query"),
    category: str | None = Query(default=None, description="Filter by category name"),
    brand: str | None = Query(default=None, description="Filter by brand name"),
    series: str | None = Query(default=None, description="Filter by product series/family"),
    wire_size: float | None = Query(default=None, alias="wireSize", description="Filter wires by size_sqmm"),
    core_count: int | None = Query(default=None, alias="coreCount", description="Filter wires by core_count"),
    min_price: float | None = Query(default=None, ge=0, description="Minimum price"),
    max_price: float | None = Query(default=None, ge=0, description="Maximum price"),
    sort_by: str | None = Query(default="name", description="Sort field: name or price"),
    sort_order: str | None = Query(default="asc", description="Sort order: asc or desc"),
    is_active: bool | None = Query(default=None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=10000, alias="pageSize"),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    request: Request = None,
) -> Any:
    # Use new search engine if query is provided
    import logging
    logger = logging.getLogger(__name__)
    
    # Log at the very start to verify function is being called
    print(f"\n{'='*70}")
    print(f"=== LIST_PRODUCTS CALLED ===")
    print(f"Query parameter 'q': {q}")
    print(f"Query type: {type(q)}")
    print(f"Category: {category}, Brand: {brand}, Series: {series}")
    print(f"{'='*70}\n")
    
    logger.info(f"=== LIST_PRODUCTS CALLED ===")
    logger.info(f"Query parameter 'q': {q}")
    logger.info(f"Query type: {type(q)}")
    logger.info(f"Category: {category}, Brand: {brand}, Series: {series}")
    
    original_q = q  # Keep original for fallback
    search_engine_used = False
    
    if q:
        print(f"Query is not None, entering search engine path...")
        logger.info(f"Query is not None, entering search engine path...")
        # Strip quotes and whitespace from query (handle both single and double quotes)
        clean_query = q.strip()
        # Remove surrounding quotes (both single and double)
        if (clean_query.startswith('"') and clean_query.endswith('"')) or \
           (clean_query.startswith("'") and clean_query.endswith("'")):
            clean_query = clean_query[1:-1].strip()
        if clean_query:
            q = clean_query
            logger.info(f"Cleaned query: '{q}'")
            try:
                logger.info(f"🔍 SEARCH ENGINE: Query='{q}', Category={category}, Brand={brand}, Series={series}")
                print(f"🔍 SEARCH ENGINE: Query='{q}'")  # Also print to console
                
                search_engine = SearchEngine(db)
                result = await search_engine.search(
                    query=q,
                    category=category,
                    brand=brand,
                    series=series,
                    page=page,
                    page_size=page_size,
                    sort_by=sort_by or "name",
                    sort_order=sort_order or "asc"
                )
                
                # Log search results with parsed data
                parsed = result.get("metadata", {}).get("parsed", {})
                parsed_category = parsed.get("category")
                parsed_brand = parsed.get("brand")
                parsed_series = parsed.get("series")
                total = result.get("total", 0)
                items_count = len(result.get("items", []))
                
                logger.info(f"✅ SEARCH RESULTS: Found {total} total products, returning {items_count} items")
                logger.info(f"   📦 Parsed Category: {parsed_category}")
                logger.info(f"   🏷️  Parsed Brand: {parsed_brand}")
                logger.info(f"   🔖 Parsed Series: {parsed_series}")
                logger.info(f"   ⏱️  Execution Time: {result.get('metadata', {}).get('execution_time_ms', 0):.2f}ms")
                
                if total > 0 and result.get("items"):
                    logger.info(f"   📋 Sample products (first 3):")
                    for i, item in enumerate(result["items"][:3], 1):
                        name = item.get("name", "N/A")
                        item_category = item.get("category", "N/A")
                        item_brand = item.get("brand", "N/A")
                        item_series = item.get("series") or item.get("catalog_source", {}).get("product_family", "N/A")
                        logger.info(f"     {i}. {name}")
                        logger.info(f"        Category: {item_category}, Brand: {item_brand}, Series: {item_series}")
                else:
                    logger.warning(f"   ⚠️  No products found for query: '{q}'")
                
                # Convert MongoDB documents to ProductInDB objects
                items: List[ProductInDB] = []
                for doc in result["items"]:
                    try:
                        # Ensure _id is a string
                        if "_id" in doc:
                            doc["_id"] = str(doc["_id"])
                        items.append(ProductInDB(**doc))
                    except Exception as item_error:
                        logger.warning(f"Failed to convert product to ProductInDB: {item_error}")
                        logger.debug(f"Problematic doc: {doc}")
                        # Skip invalid items
                        continue
                
                logger.info(f"✅ Converted {len(items)} items to ProductInDB (from {len(result['items'])} raw docs)")
                
                search_engine_used = True
                return ProductListResponse(
                    items=items,
                    total=result["total"],
                    page=result["page"],
                    pageSize=result["page_size"]  # Use alias 'pageSize' as expected by schema
                )
            except Exception as e:
                # Log error but don't fail completely - fall back to original search
                logger.error(f"❌ Search engine failed for query '{q}': {e}", exc_info=True)
                logger.error(f"❌ Exception type: {type(e).__name__}")
                logger.error(f"❌ Exception message: {str(e)}")
                print(f"ERROR: Search engine failed: {e}")  # Also print for debugging
                import traceback
                traceback.print_exc()
                # Restore original q for fallback
                q = original_q
                # Continue to fallback logic below
        else:
            # Empty after cleaning, treat as no query
            q = None
            logger.info("🔍 SEARCH: Query was empty after cleaning")
    
    # If search engine wasn't used, use original search logic
    # Original search logic for non-query requests or fallback
    if not search_engine_used:
        print(f"\n{'='*70}")
        print("=== USING FALLBACK SEARCH LOGIC ===")
        print(f"search_engine_used = {search_engine_used}")
        print(f"{'='*70}\n")
        logger.info("=== USING FALLBACK SEARCH LOGIC ===")
    
    skip = (page - 1) * page_size
    query: dict[str, Any] = {}
    
    logger.info(f"🔍 FALLBACK SEARCH: Using original search logic for query='{q}'")

    # Re-structuring query to handle multiple $or conditions safely
    and_conditions = []
    
    # Smart search parsing: extract category, brand, and series from query
    parsed_category = category
    parsed_brand = brand
    parsed_series = series
    
    if q:
        parser = SearchParser(db)
        parsed = await parser.parse(q)
        
        # Use parsed values if explicit filters are not provided
        if not category and parsed['category']:
            parsed_category = parsed['category']
        if not brand and parsed['brand']:
            parsed_brand = parsed['brand']
        if not series and parsed['series']:
            parsed_series = parsed['series']
        
        # Always search the full query text across all fields (flexible search)
        escaped_query = escape_regex(q)
        search_pattern = {"$regex": escaped_query, "$options": "i"}
        
        # Extract numeric values from query for module size matching
        numeric_values = []
        for word in q.split():
            # Extract numbers (e.g., "12" from "12", "12M", "12-module")
            num_match = re.search(r'\d+', word)
            if num_match:
                try:
                    numeric_values.append(int(num_match.group()))
                except ValueError:
                    pass
        
        # Build comprehensive search across all relevant fields including specs
        search_conditions = [
            {"name": search_pattern},
            {"sku": search_pattern},
            {"description": search_pattern},
            {"brand": search_pattern},
            {"category": search_pattern},
            {"series": search_pattern},
            {"catalog_source.product_family": search_pattern},
            # Search in specs fields (color, module size, etc.)
            {"specs.color": search_pattern},
            {"specs.module_size": search_pattern},
            {"specs.type_detail": search_pattern},
        ]
        
        # Search numeric module fields if numbers found in query
        for num_val in numeric_values:
            search_conditions.extend([
                {"specs.module": num_val},
                {"specs.modules": num_val},
                {"specs.mw": num_val},
            ])
        
        # Also search individual words for better partial matching (include words 2+ chars)
        # This ensures products match if they contain ANY of the search words
        query_words = [w.strip() for w in q.split() if len(w.strip()) >= 2]
        for word in query_words:
            word_pattern = {"$regex": escape_regex(word), "$options": "i"}
            search_conditions.extend([
                {"name": word_pattern},
                {"sku": word_pattern},
                {"description": word_pattern},
                {"brand": word_pattern},
                {"category": word_pattern},
                {"series": word_pattern},
                {"catalog_source.product_family": word_pattern},
                {"specs.color": word_pattern},
                {"specs.module_size": word_pattern},
                {"specs.type_detail": word_pattern},
            ])
        
        # Also search for word combinations (e.g., "plate engem" as a phrase)
        # This helps find products that have both words together
        if len(query_words) >= 2:
            # Create phrase searches for adjacent word pairs
            for i in range(len(query_words) - 1):
                phrase = f"{query_words[i]} {query_words[i+1]}"
                phrase_pattern = {"$regex": escape_regex(phrase), "$options": "i"}
                search_conditions.extend([
                    {"name": phrase_pattern},
                    {"description": phrase_pattern},
                ])
            
            # Also search for numeric module fields if word contains a number
            num_match = re.search(r'\d+', word)
            if num_match:
                try:
                    num_val = int(num_match.group())
                    search_conditions.extend([
                        {"specs.module": num_val},
                        {"specs.modules": num_val},
                        {"specs.mw": num_val},
                    ])
                except ValueError:
                    pass
        
        # Search for common phrases like "12 module", "12M", etc.
        # Extract number + "module" pattern
        module_phrase_match = re.search(r'(\d+)\s*module', q, re.IGNORECASE)
        if module_phrase_match:
            module_num = int(module_phrase_match.group(1))
            module_phrase = f"{module_num} module"
            phrase_pattern = {"$regex": escape_regex(module_phrase), "$options": "i"}
            search_conditions.extend([
                {"name": phrase_pattern},
                {"description": phrase_pattern},
                {"specs.module_size": phrase_pattern},
            ])
            # Also match numeric fields
            search_conditions.extend([
                {"specs.module": module_num},
                {"specs.modules": module_num},
                {"specs.mw": module_num},
            ])
        
        # Add filter conditions from parsed/extracted filters (as optional boosts)
        # These are added as additional OR conditions so products match if they match filters OR query text
        if parsed_category:
            escaped_category = escape_regex(parsed_category)
            # Add category match as additional search condition
            search_conditions.append({"category": {"$regex": escaped_category, "$options": "i"}})
            # Also search for category in name/description
            search_conditions.append({"name": {"$regex": escaped_category, "$options": "i"}})
            search_conditions.append({"description": {"$regex": escaped_category, "$options": "i"}})
        
        if parsed_brand:
            escaped_brand = escape_regex(parsed_brand)
            # Add brand match as additional search condition
            search_conditions.append({"brand": {"$regex": escaped_brand, "$options": "i"}})
            # Also search for brand in name/description
            search_conditions.append({"name": {"$regex": escaped_brand, "$options": "i"}})
            search_conditions.append({"description": {"$regex": escaped_brand, "$options": "i"}})
        
        if parsed_series:
            escaped_series = escape_regex(parsed_series)
            # Add series match as additional search condition
            search_conditions.append({"series": {"$regex": escaped_series, "$options": "i"}})
            search_conditions.append({"catalog_source.product_family": {"$regex": escaped_series, "$options": "i"}})
            # Also search for series in name/description
            search_conditions.append({"name": {"$regex": escaped_series, "$options": "i"}})
            search_conditions.append({"description": {"$regex": escaped_series, "$options": "i"}})
        
        # Products must match at least one search criteria (query text OR filters)
        # This ensures maximum flexibility - products match if ANY condition is true
        # Remove duplicates from search_conditions to avoid redundant queries
        unique_conditions = []
        seen_conditions = set()
        for cond in search_conditions:
            # Create a hashable representation for deduplication
            cond_str = str(sorted(cond.items()))
            if cond_str not in seen_conditions:
                seen_conditions.add(cond_str)
                unique_conditions.append(cond)
        
        and_conditions.append({"$or": unique_conditions})
    
    # Apply explicit filters only if provided directly (not from query parsing)
    if category and not q:
        escaped_category = escape_regex(category)
        and_conditions.append({"category": {"$regex": escaped_category, "$options": "i"}})
    
    if brand and not q:
        escaped_brand = escape_regex(brand)
        and_conditions.append({"brand": {"$regex": escaped_brand, "$options": "i"}})
    
    if series and not q:
        escaped_series = escape_regex(series)
        and_conditions.append({
            "$or": [
                {"series": {"$regex": escaped_series, "$options": "i"}},
                {"catalog_source.product_family": {"$regex": escaped_series, "$options": "i"}}
            ]
        })

    # Wires & Cables specific filters
    if wire_size is not None:
        and_conditions.append({"specs.size_sqmm": wire_size})

    if core_count is not None:
        and_conditions.append({"specs.core_count": core_count})
        
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
    
    # Log fallback search results
    logger.info(f"✅ FALLBACK SEARCH RESULTS: Found {total} total products, returning {len(items)} items")
    if q:
        logger.info(f"   Query: '{q}'")
    if parsed_category or parsed_brand or parsed_series:
        logger.info(f"   📦 Parsed Category: {parsed_category}")
        logger.info(f"   🏷️  Parsed Brand: {parsed_brand}")
        logger.info(f"   🔖 Parsed Series: {parsed_series}")
    if items:
        logger.info(f"   📋 Sample products (first 3):")
        for i, item in enumerate(items[:3], 1):
            logger.info(f"     {i}. {item.name} (Category: {item.category}, Brand: {item.brand}, Series: {item.series or 'N/A'})")
    else:
        logger.warning(f"   ⚠️  No products found!")
        if q:
            logger.warning(f"   Query: '{q}'")
        logger.info(f"   🔍 MongoDB Query: {query}")
        logger.info(f"   Query has {len(and_conditions)} AND conditions")
    
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

