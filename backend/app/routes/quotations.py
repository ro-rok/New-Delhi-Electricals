from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..quotation_filter_schema import ALL_CATEGORIES, get_filters_for_category
from ..db import get_db_dep
from ..schemas import AdminLog
from ..schemas.quotation import (
    FacetField,
    FacetOption,
    FacetsResponse,
    FrequentProductRow,
    GstMode,
    QuotationCategoryInfo,
    QuotationCreate,
    QuotationInDB,
    QuotationItem,
    QuotationListResponse,
    QuotationProductListResponse,
    QuotationProductRow,
    QuotationStatus,
    QuotationUpdate,
)
from ..schemas.product import ProductCategory
from ..security import get_current_admin
from ..services.quotation_db import (
    SEARCH_RELEVANCE_CAP,
    build_products_match,
    next_quotation_number,
    parse_object_id,
    record_product_usage,
    resolve_items_from_inputs,
    score_product_relevance,
)
from ..services.quotation_pdf import generate_quotation_pdf
from ..services.quotation_pricing import compute_pricing, extract_color_from_specs

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/quotations", tags=["quotations"])

FACET_LIMIT = 200


async def _log_admin_action(
    db: AsyncIOMotorDatabase,
    *,
    admin_email: str,
    action: str,
    entity_id: Optional[str],
    metadata: Dict[str, Any],
) -> None:
    log = AdminLog(
        action=action,
        entity="quotation",
        entity_id=entity_id,
        metadata=metadata,
        admin_email=admin_email,
        created_at=datetime.utcnow(),
    )
    await db.admin_logs.insert_one(log.model_dump(by_alias=True, exclude_none=True))


def _doc_to_quotation(doc: Dict[str, Any]) -> QuotationInDB:
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    return QuotationInDB.model_validate(doc)


def _parse_filters_from_request(request: Request, category: str) -> Dict[str, str]:
    allowed = {f.key for f in get_filters_for_category(category)}
    result: Dict[str, str] = {}
    for key in allowed:
        val = request.query_params.get(key)
        if val:
            result[key] = val
    return result


@router.get("/quotation-maker/categories", response_model=List[QuotationCategoryInfo])
async def list_quotation_categories(
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"status.is_active": True},
                    {"status.is_active": {"$exists": False}},
                ]
            }
        },
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    counts: Dict[str, int] = {}
    async for row in db.products.aggregate(pipeline):
        if row["_id"]:
            counts[row["_id"]] = row["count"]

    total_all = sum(counts.values())
    out: List[QuotationCategoryInfo] = [
        QuotationCategoryInfo(name=ALL_CATEGORIES, product_count=total_all),
    ]
    for cat in ProductCategory:
        out.append(QuotationCategoryInfo(name=cat.value, product_count=counts.get(cat.value, 0)))
    return out


@router.get("/quotation-maker/facets", response_model=FacetsResponse)
async def get_quotation_facets(
    request: Request,
    category: str = Query(..., description="Product category"),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    filters = _parse_filters_from_request(request, category)

    facet_fields: List[FacetField] = []
    for fdef in get_filters_for_category(category):
        # Exclude current field from cross-filter so options stay meaningful
        partial_filters = {k: v for k, v in filters.items() if k != fdef.key}
        match = build_products_match(category, partial_filters, q=None)

        pipeline = [
            {"$match": match},
            {"$group": {"_id": f"${fdef.mongo_path}", "count": {"$sum": 1}}},
            {"$match": {"_id": {"$nin": [None, ""]}}},
            {"$sort": {"count": -1}},
            {"$limit": FACET_LIMIT},
        ]
        options: List[FacetOption] = []
        async for row in db.products.aggregate(pipeline):
            val = row["_id"]
            if isinstance(val, bool):
                val_str = "true" if val else "false"
            elif isinstance(val, (int, float)):
                val_str = str(val)
            else:
                val_str = str(val)
            options.append(FacetOption(value=val_str, count=row["count"]))
        facet_fields.append(FacetField(key=fdef.key, label=fdef.label, options=options))

    return FacetsResponse(category=category, facets=facet_fields)


@router.get("/quotation-maker/products", response_model=QuotationProductListResponse)
async def list_quotation_products(
    request: Request,
    category: str = Query(...),
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200, alias="pageSize"),
    sort_by: str = Query("name", alias="sortBy"),
    sort_order: str = Query("asc", alias="sortOrder"),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    filters = _parse_filters_from_request(request, category)
    match = build_products_match(category, filters, q=q)
    projection = {
        "sku": 1,
        "name": 1,
        "brand": 1,
        "category": 1,
        "series": 1,
        "list_price": 1,
        "subcategory": 1,
        "specs": 1,
    }
    sort_field = "list_price" if sort_by == "price" else "name"
    direction = -1 if sort_order == "desc" else 1
    clean_q = (q or "").strip()

    total = await db.products.count_documents(match)

    if clean_q:
        # Relevance-ranked search (6AX before 16AX for "6 ax")
        cursor = db.products.find(match, projection).limit(SEARCH_RELEVANCE_CAP)
        docs = await cursor.to_list(length=SEARCH_RELEVANCE_CAP)
        def _search_sort_key(d: Dict[str, Any]) -> tuple:
            rel = -score_product_relevance(d, clean_q)
            if sort_by == "price":
                secondary = d.get("list_price", 0)
            else:
                secondary = str(d.get("name", "")).lower()
            if sort_order == "desc":
                secondary = -secondary if isinstance(secondary, (int, float)) else secondary[::-1]
            return (rel, secondary)

        docs.sort(key=_search_sort_key)
        page_docs = docs[(page - 1) * page_size : page * page_size]
    else:
        cursor = (
            db.products.find(match, projection)
            .sort(sort_field, direction)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        page_docs = await cursor.to_list(length=page_size)

    items: List[QuotationProductRow] = []
    for doc in page_docs:
        specs = doc.get("specs") or {}
        items.append(
            QuotationProductRow(
                _id=str(doc["_id"]),
                sku=doc.get("sku", ""),
                name=doc.get("name", ""),
                brand=doc.get("brand", ""),
                category=doc.get("category"),
                series=doc.get("series"),
                list_price=int(doc.get("list_price", 0)),
                subcategory=doc.get("subcategory"),
                specs=specs,
                color=extract_color_from_specs(specs),
            )
        )

    return QuotationProductListResponse(items=items, total=total, page=page, pageSize=page_size)


@router.get("/quotation-maker/frequent", response_model=List[FrequentProductRow])
async def frequent_products(
    limit: int = Query(12, ge=1, le=50),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    cursor = db.quotation_product_usage.find().sort("count", -1).limit(limit)
    rows: List[FrequentProductRow] = []
    async for usage in cursor:
        try:
            oid = ObjectId(usage["product_id"])
        except (InvalidId, KeyError):
            continue
        doc = await db.products.find_one({"_id": oid}, {"sku": 1, "name": 1, "brand": 1, "list_price": 1})
        if not doc:
            continue
        rows.append(
            FrequentProductRow(
                product_id=str(doc["_id"]),
                sku=doc.get("sku", ""),
                name=doc.get("name", ""),
                brand=doc.get("brand", ""),
                list_price=int(doc.get("list_price", 0)),
                count=int(usage.get("count", 0)),
            )
        )
    return rows


@router.get("/quotation-maker/recent", response_model=List[QuotationProductRow])
async def recent_products(
    limit: int = Query(12, ge=1, le=50),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    seen: set[str] = set()
    rows: List[QuotationProductRow] = []
    cursor = db.quotations.find().sort("updated_at", -1).limit(20)
    async for quot in cursor:
        for item in quot.get("items") or []:
            pid = item.get("product_id")
            if not pid or pid in seen:
                continue
            seen.add(pid)
            try:
                oid = ObjectId(pid)
            except InvalidId:
                continue
            doc = await db.products.find_one(
                {"_id": oid},
                {"sku": 1, "name": 1, "brand": 1, "series": 1, "list_price": 1, "subcategory": 1, "specs": 1},
            )
            if doc:
                specs = doc.get("specs") or {}
                rows.append(
                    QuotationProductRow(
                        _id=str(doc["_id"]),
                        sku=doc.get("sku", ""),
                        name=doc.get("name", ""),
                        brand=doc.get("brand", ""),
                        series=doc.get("series"),
                        list_price=int(doc.get("list_price", 0)),
                        subcategory=doc.get("subcategory"),
                        specs=specs,
                        color=extract_color_from_specs(specs),
                    )
                )
            if len(rows) >= limit:
                return rows
    return rows


@router.get("", response_model=QuotationListResponse)
async def list_quotations(
    status_filter: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    match: Dict[str, Any] = {}
    if status_filter:
        match["status"] = status_filter
    if q and q.strip():
        pattern = {"$regex": q.strip(), "$options": "i"}
        match["$or"] = [
            {"quotation_number": pattern},
            {"customer.name": pattern},
            {"customer.phone": pattern},
        ]

    total = await db.quotations.count_documents(match)
    cursor = (
        db.quotations.find(match)
        .sort("updated_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = [_doc_to_quotation(doc) async for doc in cursor]
    return QuotationListResponse(items=items, total=total, page=page, pageSize=page_size)


@router.get("/{quotation_id}", response_model=QuotationInDB)
async def get_quotation(
    quotation_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    try:
        oid = parse_object_id(quotation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Quotation not found")
    doc = await db.quotations.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return _doc_to_quotation(doc)


@router.post("", response_model=QuotationInDB, status_code=status.HTTP_201_CREATED)
async def create_quotation(
    payload: QuotationCreate,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    try:
        item_dicts = await resolve_items_from_inputs(db, payload.items)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    items = [QuotationItem.model_validate(d) for d in item_dicts]
    pricing = compute_pricing(
        items,
        payload.overall_discount_pct,
        payload.gst_mode,
        payload.gst_rate,
    )

    now = datetime.utcnow()
    qnum = await next_quotation_number(db)
    doc = {
        "quotation_number": qnum,
        "status": payload.status.value,
        "customer": payload.customer.model_dump(by_alias=True),
        "items": [i.model_dump(by_alias=True) for i in items],
        "pricing": pricing.model_dump(by_alias=True),
        "notes": payload.notes,
        "created_at": now,
        "updated_at": now,
        "created_by": admin.get("email", "admin"),
    }
    result = await db.quotations.insert_one(doc)
    doc["_id"] = result.inserted_id
    await record_product_usage(db, item_dicts)
    await _log_admin_action(
        db,
        admin_email=admin.get("email", "admin"),
        action="quotation_created",
        entity_id=str(result.inserted_id),
        metadata={"quotation_number": qnum, "status": payload.status.value},
    )
    return _doc_to_quotation(doc)


@router.patch("/{quotation_id}", response_model=QuotationInDB)
async def update_quotation(
    quotation_id: str,
    payload: QuotationUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    try:
        oid = parse_object_id(quotation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Quotation not found")

    existing = await db.quotations.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Quotation not found")

    update: Dict[str, Any] = {"updated_at": datetime.utcnow()}

    if payload.customer is not None:
        update["customer"] = payload.customer.model_dump(by_alias=True)
    if payload.status is not None:
        update["status"] = payload.status.value
    if payload.notes is not None:
        update["notes"] = payload.notes

    overall_discount = float(
        existing.get("pricing", {}).get("overall_discount_pct", 0)
        if payload.overall_discount_pct is None
        else payload.overall_discount_pct
    )
    gst_mode = GstMode(
        existing.get("pricing", {}).get("gst_mode", GstMode.EXCLUSIVE.value)
        if payload.gst_mode is None
        else payload.gst_mode
    )
    gst_rate = float(
        existing.get("pricing", {}).get("gst_rate", 18.0)
        if payload.gst_rate is None
        else payload.gst_rate
    )

    if payload.items is not None:
        try:
            item_dicts = await resolve_items_from_inputs(db, payload.items)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        items = [QuotationItem.model_validate(d) for d in item_dicts]
        update["items"] = [i.model_dump(by_alias=True) for i in items]
        await record_product_usage(db, item_dicts)
    else:
        items = [QuotationItem.model_validate(i) for i in existing.get("items", [])]

    pricing = compute_pricing(items, overall_discount, gst_mode, gst_rate)
    update["pricing"] = pricing.model_dump(by_alias=True)

    await db.quotations.update_one({"_id": oid}, {"$set": update})
    doc = await db.quotations.find_one({"_id": oid})
    await _log_admin_action(
        db,
        admin_email=admin.get("email", "admin"),
        action="quotation_updated",
        entity_id=quotation_id,
        metadata={"status": doc.get("status")},
    )
    return _doc_to_quotation(doc)


@router.post("/{quotation_id}/duplicate", response_model=QuotationInDB, status_code=status.HTTP_201_CREATED)
async def duplicate_quotation(
    quotation_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    try:
        oid = parse_object_id(quotation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Quotation not found")

    existing = await db.quotations.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Quotation not found")

    now = datetime.utcnow()
    qnum = await next_quotation_number(db)
    doc = {
        "quotation_number": qnum,
        "status": QuotationStatus.DRAFT.value,
        "customer": existing.get("customer", {}),
        "items": existing.get("items", []),
        "pricing": existing.get("pricing", {}),
        "notes": existing.get("notes"),
        "created_at": now,
        "updated_at": now,
        "created_by": admin.get("email", "admin"),
    }
    # Recompute pricing from items
    items = [QuotationItem.model_validate(i) for i in doc["items"]]
    pricing = existing.get("pricing", {})
    doc["pricing"] = compute_pricing(
        items,
        float(pricing.get("overall_discount_pct", 0)),
        GstMode(pricing.get("gst_mode", GstMode.EXCLUSIVE.value)),
        float(pricing.get("gst_rate", 18.0)),
    ).model_dump(by_alias=True)

    result = await db.quotations.insert_one(doc)
    doc["_id"] = result.inserted_id
    await _log_admin_action(
        db,
        admin_email=admin.get("email", "admin"),
        action="quotation_duplicated",
        entity_id=str(result.inserted_id),
        metadata={"source_id": quotation_id, "quotation_number": qnum},
    )
    return _doc_to_quotation(doc)


@router.delete("/{quotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quotation(
    quotation_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> None:
    try:
        oid = parse_object_id(quotation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Quotation not found")

    existing = await db.quotations.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if existing.get("status") != QuotationStatus.DRAFT.value:
        raise HTTPException(status_code=400, detail="Only draft quotations can be deleted")

    await db.quotations.delete_one({"_id": oid})
    await _log_admin_action(
        db,
        admin_email=admin.get("email", "admin"),
        action="quotation_deleted",
        entity_id=quotation_id,
        metadata={"quotation_number": existing.get("quotation_number")},
    )


@router.get("/{quotation_id}/pdf")
async def download_quotation_pdf(
    quotation_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Response:
    try:
        oid = parse_object_id(quotation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Quotation not found")

    doc = await db.quotations.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Quotation not found")

    doc_export = dict(doc)
    doc_export["_id"] = str(doc["_id"])
    pdf_bytes = generate_quotation_pdf(doc_export)
    filename = f"{doc.get('quotation_number', 'quotation')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
