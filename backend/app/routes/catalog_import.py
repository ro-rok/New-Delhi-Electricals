from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from collections import defaultdict
import io
import logging

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..cloudinary_client import generate_signed_upload_params, cloudinary_service
from ..db import get_db_dep
from ..parsing.catalog_parser import PageImage, ParsedRow, parse_catalog_pdf
from ..schemas import AdminLog, CatalogImport, CatalogImportRow
from ..security import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/catalogs", tags=["catalog-import"])

BASE_DIR = Path(__file__).resolve().parents[2]  # backend/
CATALOG_UPLOAD_DIR = BASE_DIR / "public" / "uploads" / "catalogs"

async def _log_admin_action(
    db: AsyncIOMotorDatabase,
    *,
    admin_email: str,
    action: str,
    entity: str,
    entity_id: Optional[str],
    metadata: Dict[str, Any],
) -> None:
    log = AdminLog(
        action=action,
        entity=entity,
        entity_id=entity_id,
        metadata=metadata,
        admin_email=admin_email,
        created_at=datetime.utcnow(),
    )
    # Let Mongo generate _id; don't send an explicit null _id
    await db.admin_logs.insert_one(log.model_dump(by_alias=True, exclude_none=True))

async def _save_parsed_rows(
    db: AsyncIOMotorDatabase,
    import_id: str,
    parsed_rows: List[ParsedRow],
    page_images: List[PageImage],
    *,
    upload_folder: str,
) -> None:
    """
    Persist parsed rows and save page images to local storage.
    """
    from ..parsing.catalog_parser import _clean_white_product_image
    from PIL import Image
    
    # Save images to disk with white product cleaning
    images_dir = CATALOG_UPLOAD_DIR / import_id / "catalog_images"
    images_dir.mkdir(parents=True, exist_ok=True)
    
    per_page_counter: Dict[int, int] = defaultdict(int)
    for img in page_images:
        per_page_counter[img.page_no] += 1
        counter = per_page_counter[img.page_no]
        
        # Detect format via Pillow
        try:
            image = Image.open(io.BytesIO(img.bytes))
            fmt = (image.format or "png").lower()
        except Exception:
            fmt = "png"
        filename = f"page{img.page_no:03d}_img_{counter:02d}.{fmt}"
        full_path = images_dir / filename
        
        # Process image bytes - clean up white product images
        processed_bytes = _clean_white_product_image(img.bytes)
        
        try:
            with open(full_path, "wb") as f:
                f.write(processed_bytes)
        except Exception as e:
            logger.warning(f"Failed to save image {filename}: {e}")
    
    # We no longer push images to Cloudinary; keep any image_candidates as-is
    # (typically with empty URLs) so the UI can still show that images exist if
    # we add local storage later.
    docs: List[Dict[str, Any]] = []
    for row in parsed_rows:
        candidates = [
            {
                "url": cand.url,
                "source": cand.source,
                "score": cand.score,
            }
            for cand in (row.image_candidates or [])
        ]
        doc = CatalogImportRow(
            import_id=import_id,
            row_id=row.row_id,
            sku=row.sku,
            name=row.name,
            brand=row.brand,
            category=row.category,
            series=row.series,
            list_price=row.list_price,
            currency=row.currency,
            page=row.page_no,
            confidence=row.confidence_score,
            raw_text=row.raw_text,
            specs=row.specs,
            image_candidates=candidates,
            chosen_image_urls=[],
            variant_group_key=row.variant_group_key,
        ).model_dump(by_alias=True, exclude_none=True)
        # Remove _id if it's None to let MongoDB auto-generate it
        if "_id" in doc and doc["_id"] is None:
            del doc["_id"]
        docs.append(doc)
    if docs:
        await db.catalog_import_rows.insert_many(docs)

async def _run_parse_job(
    db: AsyncIOMotorDatabase,
    *,
    import_id: str,
    pdf_bytes: bytes,
    file_name: str,
    admin_email: str,
) -> None:
    """Background job wrapper to parse PDF and persist rows."""
    logger.info(
        "catalog_import: start parse job import_id=%s file=%s admin=%s bytes=%d",
        import_id,
        file_name,
        admin_email,
        len(pdf_bytes),
    )
    await db.catalog_imports.update_one(
        {"_id": import_id},
        {
            "$set": {
                "status": "processing",
                "updated_at": datetime.utcnow(),
                "parsing_progress": {
                    "current_page": 0,
                    "total_pages": 0,
                    "stage": "starting",
                    "message": "Initializing...",
                    "percentage": 0,
                },
            }
        },
    )
    
    # Progress callback to update database
    import asyncio
    
    async def update_progress(current_page: int, total_pages: int, stage: str, message: str):
        """Update progress in database."""
        percentage = int((current_page / total_pages * 100)) if total_pages > 0 else 0
        await db.catalog_imports.update_one(
            {"_id": import_id},
            {
                "$set": {
                    "parsing_progress": {
                        "current_page": current_page,
                        "total_pages": total_pages,
                        "stage": stage,
                        "message": message,
                        "percentage": percentage,
                    },
                    "updated_at": datetime.utcnow(),
                }
            },
        )
    
    # Synchronous wrapper for async callback
    def progress_callback(current_page: int, total_pages: int, stage: str, message: str):
        """Synchronous wrapper for async progress update."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Schedule the coroutine to run in the background
                asyncio.create_task(update_progress(current_page, total_pages, stage, message))
            else:
                loop.run_until_complete(update_progress(current_page, total_pages, stage, message))
        except RuntimeError:
            # If no event loop, create a new one (shouldn't happen in FastAPI background task)
            asyncio.run(update_progress(current_page, total_pages, stage, message))
    
    try:
        parsed_rows, page_images = parse_catalog_pdf(
            pdf_bytes, file_name, progress_callback=progress_callback
        )
        logger.info(
            "catalog_import: parse job import_id=%s finished parsing rows=%d page_images=%d",
            import_id,
            len(parsed_rows),
            len(page_images),
        )
        # Update progress for saving
        await update_progress(
            page_images[0].page_no if page_images else 0,
            len({r.page_no for r in parsed_rows}) if parsed_rows else 1,
            "saving",
            f"Saving {len(parsed_rows)} products to database...",
        )
        
        await _save_parsed_rows(
            db,
            import_id,
            parsed_rows,
            page_images,
            upload_folder=f"catalogs/{import_id}",
        )
        
        total_pages = len({r.page_no for r in parsed_rows}) if parsed_rows else 0
        await db.catalog_imports.update_one(
            {"_id": import_id},
            {
                "$set": {
                    "status": "done",
                    "updated_at": datetime.utcnow(),
                    "parsing_summary": {
                        "total_rows": len(parsed_rows),
                        "pages": total_pages,
                    },
                    "parsing_progress": {
                        "current_page": total_pages,
                        "total_pages": total_pages,
                        "stage": "complete",
                        "message": f"Completed! Extracted {len(parsed_rows)} products.",
                        "percentage": 100,
                    },
                }
            },
        )
        logger.info(
            "catalog_import: parse job import_id=%s completed, rows_saved=%d",
            import_id,
            len(parsed_rows),
        )
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("catalog_import: parse job import_id=%s failed: %s", import_id, exc)
        await db.catalog_imports.update_one(
            {"_id": import_id},
            {
                "$set": {
                    "status": "failed",
                    "updated_at": datetime.utcnow(),
                    "parsing_summary": {"error": str(exc)},
                }
            },
        )

@router.options("/upload")
async def upload_catalog_options():
    """Handle OPTIONS preflight requests for CORS."""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        },
    )

@router.post(
    "/upload",
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_catalog(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    """
    Accept a price-list PDF upload, save it locally, trigger parsing, and
    return a catalog_import_id.
    
    Note: PDFs are saved to local storage, not uploaded to Cloudinary.
    Only extracted images are processed and saved locally.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF uploads are supported",
        )

    pdf_bytes = await file.read()
    # Basic safeguard: avoid extremely large PDFs overwhelming the server
    max_size_bytes = 100 * 1024 * 1024  # 100 MB
    if len(pdf_bytes) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PDF too large; maximum supported size is {max_size_bytes // (1024 * 1024)} MB",
        )
    # If this file name has already been uploaded before, reuse that import
    existing = await db.catalog_imports.find_one({"file_name": file.filename})
    if existing:
        import_id = existing.get("_id")
        if not import_id:
            # Extremely unlikely but defensive
            import_id = f"import-{int(datetime.utcnow().timestamp())}"
        # Refresh local PDF on disk for this import
        CATALOG_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        pdf_path = CATALOG_UPLOAD_DIR / f"{import_id}.pdf"
        pdf_path.write_bytes(pdf_bytes)
        await db.catalog_imports.update_one(
            {"_id": import_id},
            {
                "$set": {
                    "local_pdf_path": str(pdf_path),
                    "updated_at": datetime.utcnow(),
                }
            },
        )
    else:
        import_id = f"import-{int(datetime.utcnow().timestamp())}"
        # Save raw PDF to local storage (not Cloudinary)
        CATALOG_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        pdf_path = CATALOG_UPLOAD_DIR / f"{import_id}.pdf"
        pdf_path.write_bytes(pdf_bytes)

        catalog = CatalogImport(
            _id=import_id,
            file_name=file.filename,
            cloudinary_pdf_url=None,
            local_pdf_path=str(pdf_path),
            status="pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            admin_id=admin["email"],
            parsing_summary={},
        )
        await db.catalog_imports.insert_one(catalog.model_dump(by_alias=True))

    await _log_admin_action(
        db,
        admin_email=admin["email"],
        action="catalog_upload" if not existing else "catalog_upload_duplicate",
        entity="catalog_import",
        entity_id=import_id,
        metadata={
            "file_name": file.filename,
        },
    )

    # Trigger parsing as a background task (can be synchronous for v1)
    background_tasks.add_task(
        _run_parse_job,
        db=db,
        import_id=import_id,
        pdf_bytes=pdf_bytes,
        file_name=file.filename,
        admin_email=admin["email"],
    )

    return {
        "catalog_import_id": import_id,
        "status": "pending",
        "existing": bool(existing),
    }

@router.get("/{import_id}/progress")
async def get_catalog_progress(
    import_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    """Return parsing progress for a given import."""
    catalog_doc = await db.catalog_imports.find_one({"_id": import_id})
    if not catalog_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import not found")
    
    progress = catalog_doc.get("parsing_progress", {})
    return {
        "import_id": import_id,
        "status": catalog_doc.get("status", "unknown"),
        "progress": {
            "current_page": progress.get("current_page", 0),
            "total_pages": progress.get("total_pages", 0),
            "stage": progress.get("stage", "unknown"),
            "message": progress.get("message", ""),
            "percentage": progress.get("percentage", 0),
        },
    }

@router.get("/{import_id}/preview")
async def get_catalog_preview(
    import_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    """Return parsed rows for a given import with image candidates and confidence."""
    catalog_doc = await db.catalog_imports.find_one({"_id": import_id})
    if not catalog_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import not found")

    rows_cursor = db.catalog_import_rows.find({"import_id": import_id})
    rows: List[Dict[str, Any]] = []
    async for row in rows_cursor:
        row["_id"] = str(row["_id"])
        rows.append(row)

    # Fetch recent admin logs related to this catalog import so the UI can
    # display parsing / apply history alongside the preview.
    logs_cursor = (
        db.admin_logs.find({"entity": "catalog_import", "entity_id": import_id})
        .sort("created_at", -1)
        .limit(50)
    )
    logs: List[Dict[str, Any]] = []
    async for log in logs_cursor:
        log["_id"] = str(log["_id"])
        logs.append(log)

    return {
        "import": {
            "id": catalog_doc.get("_id"),
            "file_name": catalog_doc.get("file_name"),
            "status": catalog_doc.get("status"),
            "parsing_summary": catalog_doc.get("parsing_summary", {}),
        },
        "rows": rows,
        "logs": logs,
    }

@router.post("/{import_id}/apply")
async def apply_catalog_import(
    import_id: str,
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    """
    Apply selected rows: create/update products based on dedupe strategy.
    """
    selected_rows = payload.get("selected_rows") or []
    create_if_missing = bool(payload.get("createIfMissing", True))
    dedupe_strategy = payload.get("dedupeStrategy", "sku")

    if not isinstance(selected_rows, list) or not selected_rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="selected_rows must be a non-empty list",
        )

    created: List[Dict[str, Any]] = []
    updated: List[Dict[str, Any]] = []
    failed: List[Dict[str, Any]] = []

    for row in selected_rows:
        sku = row.get("sku")
        if not sku:
            failed.append({"row_id": row.get("row_id"), "reason": "Missing SKU"})
            continue
        try:
            if dedupe_strategy == "sku":
                existing = await db.products.find_one({"sku": sku})
            else:
                key = {
                    "brand": (row.get("brand") or "").strip(),
                    "name": (row.get("name") or "").strip(),
                    "series": (row.get("series") or "").strip(),
                }
                matches = db.products.find(key)
                existing = None
                count = 0
                async for doc in matches:
                    existing = doc
                    count += 1
                    if count > 1:
                        break
                if count > 1:
                    failed.append(
                        {
                            "row_id": row.get("row_id"),
                            "sku": sku,
                            "reason": "Multiple fuzzy matches; resolve manually",
                        }
                    )
                    continue

            product_doc: Dict[str, Any] = {
                "sku": sku,
                "name": row.get("name"),
                "brand": row.get("brand"),
                "category": row.get("category"),
                "series": row.get("series"),
                "list_price": int(row.get("list_price") or row.get("listPrice") or 0),
                "currency": row.get("currency") or "INR",
                "images": row.get("chosen_image_urls") or row.get("images") or [],
                "datasheet_url": row.get("datasheet_url"),
                "specs": row.get("specs") or {},
                "_source_file": row.get("file_name"),
            }
            
            # Handle status.is_active if provided - use dot notation to preserve other status fields
            update_ops: Dict[str, Any] = {"$set": product_doc}
            if "is_active" in row:
                update_ops["$set"]["status.is_active"] = bool(row.get("is_active", True))
            elif "status" in row and isinstance(row.get("status"), dict):
                status_obj = row.get("status", {})
                if "is_active" in status_obj:
                    update_ops["$set"]["status.is_active"] = bool(status_obj["is_active"])

            if existing:
                await db.products.update_one(
                    {"_id": existing["_id"]},
                    update_ops,
                )
                updated.append({"sku": sku})
                decision = "updated"
            else:
                if not create_if_missing:
                    failed.append(
                        {"row_id": row.get("row_id"), "sku": sku, "reason": "No existing product"}
                    )
                    decision = "ignored"
                else:
                    # For new products, set status.is_active if provided
                    if "is_active" in row:
                        product_doc.setdefault("status", {})["is_active"] = bool(row.get("is_active", True))
                    elif "status" in row and isinstance(row.get("status"), dict):
                        status_obj = row.get("status", {})
                        if "is_active" in status_obj:
                            product_doc.setdefault("status", {})["is_active"] = bool(status_obj["is_active"])
                    
                    await db.products.insert_one(product_doc)
                    created.append({"sku": sku})
                    decision = "created"

            await db.catalog_import_rows.update_one(
                {"import_id": import_id, "row_id": row.get("row_id")},
                {"$set": {"last_decision": decision, "chosen_image_urls": product_doc["images"]}},
            )
        except Exception as exc:  # pragma: no cover - defensive
            failed.append({"row_id": row.get("row_id"), "sku": sku, "reason": str(exc)})

    await _log_admin_action(
        db,
        admin_email=admin["email"],
        action="catalog_apply",
        entity="catalog_import",
        entity_id=import_id,
        metadata={
            "items_created": len(created),
            "items_updated": len(updated),
            "items_failed": len(failed),
        },
    )

    return {
        "created": created,
        "updated": updated,
        "failed": failed,
    }

@router.post("/{import_id}/rerun")
async def rerun_catalog_parse(
    import_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    """
    Re-run parsing for an existing import using the original PDF from local storage.
    """
    catalog_doc = await db.catalog_imports.find_one({"_id": import_id})
    if not catalog_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import not found")

    local_path = catalog_doc.get("local_pdf_path")
    if not local_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Import does not have a stored local PDF path",
        )

    pdf_file = Path(local_path)
    if not pdf_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stored PDF file not found on server",
        )

    # In v1 we keep this simple and just mark status to processing and clear rows;
    # a more advanced implementation could compute diffs by SKU and page_no.
    await db.catalog_import_rows.delete_many({"import_id": import_id})
    await db.catalog_imports.update_one(
        {"_id": import_id},
        {"$set": {"status": "processing", "updated_at": datetime.utcnow()}},
    )

    pdf_bytes = pdf_file.read_bytes()

    background_tasks.add_task(
        _run_parse_job,
        db=db,
        import_id=import_id,
        pdf_bytes=pdf_bytes,
        file_name=catalog_doc.get("file_name") or "catalog.pdf",
        admin_email=admin["email"],
    )

    await _log_admin_action(
        db,
        admin_email=admin["email"],
        action="catalog_rerun",
        entity="catalog_import",
        entity_id=import_id,
        metadata={},
    )

    return {"status": "processing"}

cloudinary_router = APIRouter(prefix="/api/admin/cloudinary", tags=["cloudinary"])

@cloudinary_router.get("/signature")
async def get_cloudinary_signature(
    db: AsyncIOMotorDatabase = Depends(get_db_dep),  # noqa: ARG001 - reserved for auditing
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    """
    Return short-lived signed parameters for direct browser uploads to Cloudinary.

    Security notes:
    - This endpoint is admin-only and relies on JWT auth.
    - The signature is time-limited and scoped to a folder and resource type.
    """
    params = generate_signed_upload_params()
    return params

@cloudinary_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = "products",
    db: AsyncIOMotorDatabase = Depends(get_db_dep),  # noqa: ARG001 - reserved for auditing
    admin=Depends(get_current_admin),
) -> Dict[str, Any]:
    """
    Upload an image to Cloudinary (admin only).
    
    Returns:
        Dictionary with url, public_id, width, height
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are supported"
        )
    
    # Read file bytes
    file_bytes = await file.read()
    
    # Upload to Cloudinary
    try:
        result = await cloudinary_service.upload_image(
            file_bytes=file_bytes,
            folder=folder
        )
        return result
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to upload image: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image to storage service"
        )

