from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId

from ..db import get_db_dep
from ..schemas import InquiryCreate, InquiryResponse, Inquiry
from ..security import get_current_admin
from ..services.email_service import email_service

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])

@router.post("", response_model=InquiryResponse, status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    payload: InquiryCreate,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
) -> Any:
    """
    Create a new inquiry from contact form submission.
    This endpoint is public (no authentication required).
    """
    # Create inquiry document
    inquiry_doc = Inquiry(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        subject=payload.subject,
        message=payload.message,
        status="new",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Convert to dict for MongoDB insertion
    doc = inquiry_doc.model_dump(by_alias=True, exclude_none=True)
    if "_id" in doc and doc["_id"] is None:
        del doc["_id"]
    
    # Insert into database
    result = await db.inquiries.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    
    # Send email notifications
    inquiry_dict = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "subject": payload.subject,
        "message": payload.message,
        "created_at": doc["created_at"].isoformat()
    }
    
    # Send notification to admin (non-blocking, don't fail if email fails)
    try:
        await email_service.send_inquiry_notification(inquiry_dict)
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send admin notification email: {e}")
    
    # Send confirmation to customer (non-blocking, don't fail if email fails)
    try:
        await email_service.send_inquiry_confirmation(inquiry_dict)
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send customer confirmation email: {e}")
    
    return InquiryResponse(**doc)

@router.get("", response_model=List[InquiryResponse])
async def get_inquiries(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: new, in-progress, or resolved"),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    """
    Get all inquiries (admin only).
    Optionally filter by status.
    """
    query = {}
    if status_filter:
        # Validate status
        if status_filter not in ["new", "in-progress", "resolved"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Must be one of: new, in-progress, resolved"
            )
        query["status"] = status_filter
    
    # Fetch inquiries sorted by created_at descending (newest first)
    cursor = db.inquiries.find(query).sort("created_at", -1)
    inquiries: List[InquiryResponse] = []
    
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        inquiries.append(InquiryResponse(**doc))
    
    return inquiries

@router.patch("/{inquiry_id}", response_model=InquiryResponse)
async def update_inquiry_status(
    inquiry_id: str,
    status_update: str = Query(..., alias="status", description="New status: new, in-progress, or resolved"),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    """
    Update inquiry status (admin only).
    """
    # Validate status
    if status_update not in ["new", "in-progress", "resolved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be one of: new, in-progress, resolved"
        )
    
    # Convert inquiry_id to ObjectId
    try:
        query_id = ObjectId(inquiry_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid inquiry ID format"
        )
    
    # Update inquiry
    result = await db.inquiries.find_one_and_update(
        {"_id": query_id},
        {
            "$set": {
                "status": status_update,
                "updated_at": datetime.utcnow()
            }
        },
        return_document=True
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    result["_id"] = str(result["_id"])
    return InquiryResponse(**result)
