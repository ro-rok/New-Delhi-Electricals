"""Admin price-list PDF upload: match SKUs to brand products and update list prices."""

from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db_dep
from ..parsing.price_list_parser import (
    PriceListRow,
    _normalize_sku,
    parse_price_list_pdf,
    refine_price_with_reference,
)
from ..security import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/price-updates", tags=["price-update"])

BASE_DIR = Path(__file__).resolve().parents[2]
PRICE_UPLOAD_DIR = BASE_DIR / "public" / "uploads" / "price_lists"


def _normalize_brand(brand: str) -> str:
    return (brand or "").strip()


async def _fetch_brand_products(db: AsyncIOMotorDatabase, brand: str) -> List[Dict[str, Any]]:
    escaped = re.escape(_normalize_brand(brand))
    cursor = db.products.find(
        {"brand": {"$regex": f"^{escaped}$", "$options": "i"}},
        {"sku": 1, "name": 1, "brand": 1, "list_price": 1, "catalog_source": 1},
    )
    return [doc async for doc in cursor]


def _build_match_rows(
    pdf_rows: List[PriceListRow],
    brand_products: List[Dict[str, Any]],
) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Return (update_rows, db_only_rows)."""
    product_by_sku: Dict[str, Dict[str, Any]] = {}
    for doc in brand_products:
        sku = doc.get("sku")
        if not sku:
            continue
        product_by_sku[_normalize_sku(sku)] = doc

    update_rows: List[Dict[str, Any]] = []
    matched_skus: set[str] = set()

    for row in pdf_rows:
        norm = _normalize_sku(row.sku)
        product = product_by_sku.get(norm)
        if product:
            matched_skus.add(norm)
            old_price = int(product.get("list_price") or 0)
            # Re-pick price using DB anchor — avoids module counts / SKU digits
            refined = refine_price_with_reference(row, old_price) if old_price > 0 else None
            new_price = int(refined if refined is not None else row.list_price)
            if old_price > 0 and refined is None:
                # Parsed price too far from current MRP — treat as parse failure
                update_rows.append(
                    {
                        "sku": product.get("sku") or row.sku,
                        "name": product.get("name") or row.name,
                        "product_id": str(product["_id"]),
                        "old_price": old_price,
                        "new_price": None,
                        "page": row.page_no,
                        "status": "matched",
                        "match_status": "parse_failed",
                        "selected": False,
                    }
                )
                continue
            match_status = "unchanged" if old_price == new_price else "changed"
            update_rows.append(
                {
                    "sku": product.get("sku") or row.sku,
                    "name": product.get("name") or row.name,
                    "product_id": str(product["_id"]),
                    "old_price": old_price,
                    "new_price": new_price,
                    "page": row.page_no,
                    "status": "matched",
                    "match_status": match_status,
                    "selected": match_status == "changed",
                }
            )
        else:
            update_rows.append(
                {
                    "sku": row.sku,
                    "name": row.name,
                    "product_id": None,
                    "old_price": None,
                    "new_price": int(row.list_price),
                    "page": row.page_no,
                    "status": "pdf_only",
                    "match_status": "not_in_db",
                    "selected": False,
                }
            )

    db_only_rows: List[Dict[str, Any]] = []
    for norm, product in product_by_sku.items():
        if norm in matched_skus:
            continue
        db_only_rows.append(
            {
                "sku": product.get("sku"),
                "name": product.get("name"),
                "product_id": str(product["_id"]),
                "old_price": int(product.get("list_price") or 0),
                "new_price": None,
                "status": "db_only",
            }
        )

    update_rows.sort(key=lambda r: (r["status"] != "matched", r.get("sku") or ""))
    db_only_rows.sort(key=lambda r: r.get("sku") or "")
    return update_rows, db_only_rows


async def _run_price_update_job(
    db: AsyncIOMotorDatabase,
    *,
    job_id: str,
    pdf_bytes: bytes,
    brand: str,
    file_name: str,
) -> None:
    await db.price_update_jobs.update_one(
        {"_id": job_id},
        {
            "$set": {
                "status": "processing",
                "updated_at": datetime.utcnow(),
                "progress": {"percentage": 0, "message": "Parsing PDF...", "stage": "parsing"},
            }
        },
    )

    try:
        await db.price_update_jobs.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "progress": {"percentage": 10, "message": "Parsing PDF...", "stage": "parsing"},
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        loop = asyncio.get_event_loop()
        pdf_rows: List[PriceListRow] = await loop.run_in_executor(
            None, lambda: parse_price_list_pdf(pdf_bytes)
        )

        await db.price_update_jobs.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "progress": {"percentage": 90, "message": "Matching SKUs...", "stage": "matching"},
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        brand_products = await _fetch_brand_products(db, brand)
        update_rows, db_only_rows = _build_match_rows(pdf_rows, brand_products)

        changed = sum(1 for r in update_rows if r.get("match_status") == "changed")
        matched = sum(1 for r in update_rows if r.get("status") == "matched")
        pdf_only = sum(1 for r in update_rows if r.get("status") == "pdf_only")

        await db.price_update_jobs.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": "done",
                    "updated_at": datetime.utcnow(),
                    "rows": update_rows,
                    "db_only_rows": db_only_rows,
                    "summary": {
                        "pdf_skus": len(pdf_rows),
                        "brand_products": len(brand_products),
                        "matched": matched,
                        "price_changed": changed,
                        "unchanged": matched - changed,
                        "pdf_only": pdf_only,
                        "db_only": len(db_only_rows),
                    },
                    "progress": {
                        "percentage": 100,
                        "message": f"Ready — {changed} prices to update",
                        "stage": "complete",
                    },
                }
            },
        )
    except Exception as exc:
        logger.exception("price_update job %s failed: %s", job_id, exc)
        await db.price_update_jobs.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": "failed",
                    "updated_at": datetime.utcnow(),
                    "summary": {"error": str(exc)},
                    "progress": {"percentage": 0, "message": str(exc), "stage": "failed"},
                }
            },
        )


@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_price_list(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    brand: str = Form(...),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    """Upload a brand price-list PDF and start SKU/price matching."""
    brand_name = _normalize_brand(brand)
    if not brand_name:
        raise HTTPException(status_code=400, detail="Brand is required")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported")

    pdf_bytes = await file.read()
    max_size = 100 * 1024 * 1024
    if len(pdf_bytes) > max_size:
        raise HTTPException(status_code=400, detail="PDF too large (max 100 MB)")

    product_count = await db.products.count_documents(
        {"brand": {"$regex": f"^{re.escape(brand_name)}$", "$options": "i"}}
    )
    if product_count == 0:
        raise HTTPException(
            status_code=400,
            detail=f"No products found for brand '{brand_name}'. Check the brand name.",
        )

    job_id = f"price-{int(datetime.utcnow().timestamp())}"
    PRICE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    pdf_path = PRICE_UPLOAD_DIR / f"{job_id}.pdf"
    pdf_path.write_bytes(pdf_bytes)

    await db.price_update_jobs.insert_one(
        {
            "_id": job_id,
            "brand": brand_name,
            "file_name": file.filename,
            "local_pdf_path": str(pdf_path),
            "status": "pending",
            "admin_id": admin["email"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "rows": [],
            "db_only_rows": [],
            "summary": {},
            "progress": {"percentage": 0, "message": "Queued...", "stage": "pending"},
        }
    )

    background_tasks.add_task(
        _run_price_update_job,
        db=db,
        job_id=job_id,
        pdf_bytes=pdf_bytes,
        brand=brand_name,
        file_name=file.filename,
    )

    return {
        "job_id": job_id,
        "brand": brand_name,
        "brand_product_count": product_count,
        "status": "pending",
    }


@router.get("/{job_id}/progress")
async def get_price_update_progress(
    job_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    doc = await db.price_update_jobs.find_one({"_id": job_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job_id,
        "status": doc.get("status"),
        "brand": doc.get("brand"),
        "file_name": doc.get("file_name"),
        "progress": doc.get("progress", {}),
        "summary": doc.get("summary", {}),
    }


@router.get("/{job_id}/preview")
async def get_price_update_preview(
    job_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    doc = await db.price_update_jobs.find_one({"_id": job_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job_id,
        "brand": doc.get("brand"),
        "file_name": doc.get("file_name"),
        "status": doc.get("status"),
        "summary": doc.get("summary", {}),
        "rows": doc.get("rows", []),
        "db_only_rows": doc.get("db_only_rows", []),
    }


@router.post("/{job_id}/apply")
async def apply_price_updates(
    job_id: str,
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    """Apply selected price updates to products in the database."""
    doc = await db.price_update_jobs.find_one({"_id": job_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    if doc.get("status") != "done":
        raise HTTPException(status_code=400, detail="Job is not ready for apply")

    rows: List[Dict[str, Any]] = doc.get("rows") or []
    overrides: Dict[str, Any] = payload.get("price_overrides") or {}

    def _override_price(row: Dict[str, Any]) -> Any:
        sku = row.get("sku") or ""
        norm = _normalize_sku(sku)
        if sku in overrides:
            return overrides[sku]
        if norm in overrides:
            return overrides[norm]
        return row.get("new_price")

    selected_skus = payload.get("selected_skus")
    if selected_skus is not None:
        selected_set = {_normalize_sku(s) for s in selected_skus}
        rows_to_apply = [
            r
            for r in rows
            if r.get("status") == "matched"
            and r.get("product_id")
            and _normalize_sku(r.get("sku", "")) in selected_set
        ]
    else:
        rows_to_apply = [
            r
            for r in rows
            if r.get("selected") and r.get("status") == "matched" and r.get("product_id")
        ]

    updated: List[Dict[str, Any]] = []
    skipped: List[Dict[str, Any]] = []
    failed: List[Dict[str, Any]] = []

    for row in rows_to_apply:
        sku = row.get("sku")
        product_id = row.get("product_id")
        new_price = _override_price(row)
        old_price = row.get("old_price")
        if new_price is None or product_id is None:
            skipped.append({"sku": sku, "reason": "Missing price or product"})
            continue
        if old_price == new_price:
            skipped.append({"sku": sku, "reason": "Price unchanged"})
            continue
        try:
            from bson import ObjectId

            oid = ObjectId(product_id)
            product = await db.products.find_one({"_id": oid}, {"catalog_source": 1})
            set_fields: Dict[str, Any] = {
                "list_price": int(new_price),
                "price_updated_at": datetime.utcnow(),
                "price_update_source": doc.get("file_name"),
            }
            if product and isinstance(product.get("catalog_source"), dict):
                cs = dict(product["catalog_source"])
                pricing = dict(cs.get("pricing") or {})
                pricing["mrp"] = int(new_price)
                cs["pricing"] = pricing
                set_fields["catalog_source"] = cs

            await db.products.update_one({"_id": oid}, {"$set": set_fields})
            updated.append({"sku": sku, "old_price": old_price, "new_price": new_price})
        except Exception as exc:
            failed.append({"sku": sku, "reason": str(exc)})

    await db.price_update_jobs.update_one(
        {"_id": job_id},
        {
            "$set": {
                "apply_result": {
                    "updated": len(updated),
                    "skipped": len(skipped),
                    "failed": len(failed),
                    "applied_at": datetime.utcnow(),
                    "admin_id": admin["email"],
                },
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {"updated": updated, "skipped": skipped, "failed": failed}
