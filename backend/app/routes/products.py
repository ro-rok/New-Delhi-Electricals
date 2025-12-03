from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db_dep
from ..schemas import ProductCreate, ProductUpdate, ProductInDB, ProductListResponse
from ..security import get_current_admin


router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
async def list_products(
    q: str | None = Query(default=None, description="Search query"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
) -> Any:
    skip = (page - 1) * page_size
    query: dict[str, Any] = {}
    if q:
        query["$text"] = {"$search": q}
    total = await db.products.count_documents(query)
    cursor = db.products.find(query).skip(skip).limit(page_size)
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

