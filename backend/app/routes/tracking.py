"""Public tracking endpoints — record visitor events (page views, product views, WhatsApp clicks)."""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db_dep

router = APIRouter(prefix="/api/tracking", tags=["tracking"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


@router.post("/event")
async def track_event(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
) -> Any:
    """
    Record a tracking event. Body:
    {
      "type": "page_view" | "product_view" | "whatsapp_click" | "search",
      "path": "/category/switches-sockets",
      "productId": "...",        // optional
      "productName": "...",      // optional
      "brand": "...",            // optional
      "category": "...",         // optional
      "query": "...",            // optional (for search events)
    }
    """
    import json
    try:
        body = json.loads(await request.body()) if (await request.body()) else {}
    except Exception:
        body = {}

    event_type = body.get("type", "page_view")
    if event_type not in ("page_view", "product_view", "whatsapp_click", "search"):
        event_type = "page_view"

    # Get IP and user-agent for deduplication
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "unknown")[:200]

    doc = {
        "type": event_type,
        "path": body.get("path", ""),
        "product_id": body.get("productId"),
        "product_name": body.get("productName"),
        "brand": body.get("brand"),
        "category": body.get("category"),
        "query": body.get("query"),
        "ip": ip,
        "user_agent": ua,
        "created_at": _now(),
    }

    await db.tracking_events.insert_one(doc)
    return {"ok": True}


@router.get("/summary")
async def get_summary(
    range: str = "7d",
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
) -> Any:
    """
    Public summary for the admin dashboard — counts of page views,
    product views, and WhatsApp clicks in the given period.
    """
    now = _now()
    if range == "30d":
        start = now - timedelta(days=30)
    elif range == "14d":
        start = now - timedelta(days=14)
    else:
        start = now - timedelta(days=7)

    match = {"created_at": {"$gte": start, "$lte": now}}

    # Aggregate counts by event type
    pipeline = [
        {"$match": match},
        {"$group": {"_id": "$type", "count": {"$sum": 1}}},
    ]

    counts = {"page_views": 0, "product_views": 0, "whatsapp_clicks": 0, "searches": 0}
    async for row in db.tracking_events.aggregate(pipeline):
        key = row["_id"]
        if key == "page_view":
            counts["page_views"] = row["count"]
        elif key == "product_view":
            counts["product_views"] = row["count"]
        elif key == "whatsapp_click":
            counts["whatsapp_clicks"] = row["count"]
        elif key == "search":
            counts["searches"] = row["count"]

    # Top viewed products
    product_pipeline = [
        {"$match": {**match, "type": "product_view", "product_id": {"$ne": None}}},
        {"$group": {"_id": "$product_id", "name": {"$first": "$product_name"}, "views": {"$sum": 1}}},
        {"$sort": {"views": -1}},
        {"$limit": 10},
    ]
    top_products = []
    async for row in db.tracking_events.aggregate(product_pipeline):
        top_products.append({
            "productId": row["_id"],
            "name": row.get("name") or "Unknown",
            "views": row["views"],
        })

    # Top pages
    page_pipeline = [
        {"$match": {**match, "type": "page_view", "path": {"$ne": ""}}},
        {"$group": {"_id": "$path", "views": {"$sum": 1}}},
        {"$sort": {"views": -1}},
        {"$limit": 10},
    ]
    top_pages = []
    async for row in db.tracking_events.aggregate(page_pipeline):
        top_pages.append({"path": row["_id"], "views": row["views"]})

    # Daily time series
    daily_pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at", "timezone": "Asia/Kolkata"}},
                    "type": "$type",
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id.date": 1}},
    ]

    daily: dict[str, dict] = {}
    async for row in db.tracking_events.aggregate(daily_pipeline):
        date = row["_id"]["date"]
        typ = row["_id"]["type"]
        if date not in daily:
            daily[date] = {"date": date, "pageViews": 0, "productViews": 0, "whatsappClicks": 0}
        if typ == "page_view":
            daily[date]["pageViews"] = row["count"]
        elif typ == "product_view":
            daily[date]["productViews"] = row["count"]
        elif typ == "whatsapp_click":
            daily[date]["whatsappClicks"] = row["count"]

    return {
        "pageViews": counts["page_views"],
        "productViews": counts["product_views"],
        "whatsappClicks": counts["whatsapp_clicks"],
        "searches": counts["searches"],
        "topProducts": top_products,
        "topPages": top_pages,
        "daily": list(daily.values()),
        "period": {"start": start.isoformat(), "end": now.isoformat()},
    }
