"""Analytics endpoints for the NDE admin dashboard."""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db_dep
from ..security import get_current_admin

router = APIRouter(prefix="/api/admin/analytics", tags=["analytics"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _date_range(preset: str, custom_start: Optional[str], custom_end: Optional[str]):
    """Return (start, end, prev_start, prev_end) datetimes for the requested range."""
    end = _now()
    if preset == "custom" and custom_start and custom_end:
        try:
            start = datetime.fromisoformat(custom_start.replace("Z", "+00:00"))
            end = datetime.fromisoformat(custom_end.replace("Z", "+00:00"))
        except ValueError:
            start = end - timedelta(days=7)
    elif preset == "30d":
        start = end - timedelta(days=30)
    elif preset == "14d":
        start = end - timedelta(days=14)
    else:  # default 7d
        start = end - timedelta(days=7)

    span = end - start
    prev_end = start
    prev_start = prev_end - span
    return start, end, prev_start, prev_end


def _pct_change(current: int, previous: int) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round((current - previous) / previous * 100, 1)


def _trend(change: float) -> str:
    if change > 0:
        return "up"
    if change < 0:
        return "down"
    return "neutral"


def _period_comparison(current: int, previous: int) -> Dict[str, Any]:
    change = _pct_change(current, previous)
    return {
        "current": current,
        "previous": previous,
        "change": change,
        "trend": _trend(change),
    }


# ---------------------------------------------------------------------------
# /overview
# ---------------------------------------------------------------------------

@router.get("/overview")
async def get_overview(
    range: str = Query("7d"),
    customStart: Optional[str] = Query(None),
    customEnd: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    """
    KPI overview with period-over-period comparison.
    Returns counts for: products, inquiries (total/new/resolved), quotations,
    page views (from admin_logs), and WhatsApp/call clicks if tracked.
    """
    start, end, prev_start, prev_end = _date_range(range, customStart, customEnd)

    async def count(collection: str, query: Dict) -> int:
        return await db[collection].count_documents(query)

    # ── current period ──────────────────────────────────────────────────────
    curr_inquiries = await count("inquiries", {"created_at": {"$gte": start, "$lte": end}})
    curr_new_inq = await count("inquiries", {"created_at": {"$gte": start, "$lte": end}, "status": "new"})
    curr_resolved_inq = await count("inquiries", {"created_at": {"$gte": start, "$lte": end}, "status": "resolved"})
    curr_quotations = await count("quotations", {"created_at": {"$gte": start, "$lte": end}})
    curr_products = await count("products", {})  # cumulative — no time filter
    curr_active = await count("products", {"$or": [{"status.is_active": True}, {"status.is_active": {"$exists": False}}]})

    # Count admin log actions in current period (proxy for admin activity)
    curr_logs = await count("admin_logs", {"created_at": {"$gte": start, "$lte": end}})

    # ── previous period ─────────────────────────────────────────────────────
    prev_inquiries = await count("inquiries", {"created_at": {"$gte": prev_start, "$lte": prev_end}})
    prev_new_inq = await count("inquiries", {"created_at": {"$gte": prev_start, "$lte": prev_end}, "status": "new"})
    prev_resolved_inq = await count("inquiries", {"created_at": {"$gte": prev_start, "$lte": prev_end}, "status": "resolved"})
    prev_quotations = await count("quotations", {"created_at": {"$gte": prev_start, "$lte": prev_end}})
    prev_logs = await count("admin_logs", {"created_at": {"$gte": prev_start, "$lte": prev_end}})

    # Conversion rate: resolved / total inquiries in period
    curr_conversion = round(curr_resolved_inq / curr_inquiries * 100, 1) if curr_inquiries else 0.0
    prev_conversion = round(prev_resolved_inq / prev_inquiries * 100, 1) if prev_inquiries else 0.0
    conv_change = _pct_change(int(curr_conversion * 10), int(prev_conversion * 10))

    return {
        "inquiries": _period_comparison(curr_inquiries, prev_inquiries),
        "newInquiries": _period_comparison(curr_new_inq, prev_new_inq),
        "resolvedInquiries": _period_comparison(curr_resolved_inq, prev_resolved_inq),
        "quotations": _period_comparison(curr_quotations, prev_quotations),
        "adminActions": _period_comparison(curr_logs, prev_logs),
        "totalProducts": curr_products,
        "activeProducts": curr_active,
        "conversionRate": {
            "current": curr_conversion,
            "previous": prev_conversion,
            "change": conv_change,
            "trend": _trend(conv_change),
        },
        "periodStart": start.isoformat(),
        "periodEnd": end.isoformat(),
    }


# ---------------------------------------------------------------------------
# /timeseries
# ---------------------------------------------------------------------------

@router.get("/timeseries")
async def get_timeseries(
    range: str = Query("7d"),
    customStart: Optional[str] = Query(None),
    customEnd: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    """
    Daily time-series data for inquiries and quotations over the selected period.
    """
    start, end, _, _ = _date_range(range, customStart, customEnd)

    # Inquiries per day
    inq_pipeline = [
        {"$match": {"created_at": {"$gte": start, "$lte": end}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at",
                        "timezone": "Asia/Kolkata",
                    }
                },
                "inquiries": {"$sum": 1},
                "resolved": {
                    "$sum": {"$cond": [{"$eq": ["$status", "resolved"]}, 1, 0]}
                },
            }
        },
        {"$sort": {"_id": 1}},
    ]

    # Quotations per day
    quot_pipeline = [
        {"$match": {"created_at": {"$gte": start, "$lte": end}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at",
                        "timezone": "Asia/Kolkata",
                    }
                },
                "quotations": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    inq_by_day: Dict[str, Dict] = {}
    async for row in db.inquiries.aggregate(inq_pipeline):
        inq_by_day[row["_id"]] = {
            "inquiries": row["inquiries"],
            "resolved": row["resolved"],
        }

    quot_by_day: Dict[str, int] = {}
    async for row in db.quotations.aggregate(quot_pipeline):
        quot_by_day[row["_id"]] = row["quotations"]

    # Build complete date list so gaps show as zero
    data_points = []
    current = start
    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        inq = inq_by_day.get(date_str, {"inquiries": 0, "resolved": 0})
        data_points.append(
            {
                "date": date_str,
                "inquiries": inq["inquiries"],
                "resolved": inq["resolved"],
                "quotations": quot_by_day.get(date_str, 0),
            }
        )
        current += timedelta(days=1)

    return {"dataPoints": data_points, "startDate": start.isoformat(), "endDate": end.isoformat()}


# ---------------------------------------------------------------------------
# /top-products
# ---------------------------------------------------------------------------

@router.get("/top-products")
async def get_top_products(
    range: str = Query("7d"),
    customStart: Optional[str] = Query(None),
    customEnd: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    """
    Top products by how frequently they appear in quotations within the period.
    Falls back to overall usage counts when no quotations exist in the period.
    """
    start, end, _, _ = _date_range(range, customStart, customEnd)

    # Unwind quotation items for products used in quotations within the period
    pipeline = [
        {"$match": {"created_at": {"$gte": start, "$lte": end}}},
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.product_id",
                "name": {"$first": "$items.name"},
                "brand": {"$first": "$items.brand"},
                "category": {"$first": "$items.category"},
                "timesQuoted": {"$sum": 1},
                "totalQty": {"$sum": "$items.qty"},
            }
        },
        {"$sort": {"timesQuoted": -1}},
        {"$limit": limit},
    ]

    rows = []
    async for row in db.quotations.aggregate(pipeline):
        rows.append(
            {
                "id": str(row["_id"]),
                "name": row.get("name") or f"Product {str(row['_id'])[:8]}",
                "brand": row.get("brand", ""),
                "category": row.get("category", ""),
                "timesQuoted": row["timesQuoted"],
                "totalQty": int(row.get("totalQty") or 0),
            }
        )

    # If no period data, fall back to all-time usage tracking
    if not rows:
        async for usage in db.quotation_product_usage.find().sort("count", -1).limit(limit):
            from bson import ObjectId
            try:
                oid = ObjectId(usage["product_id"])
            except Exception:
                continue
            doc = await db.products.find_one(
                {"_id": oid}, {"name": 1, "brand": 1, "category": 1}
            )
            if doc:
                rows.append(
                    {
                        "id": str(doc["_id"]),
                        "name": doc.get("name", ""),
                        "brand": doc.get("brand", ""),
                        "category": doc.get("category", ""),
                        "timesQuoted": int(usage.get("count", 0)),
                        "totalQty": 0,
                    }
                )

    return rows


# ---------------------------------------------------------------------------
# /top-categories
# ---------------------------------------------------------------------------

@router.get("/top-categories")
async def get_top_categories(
    range: str = Query("7d"),
    customStart: Optional[str] = Query(None),
    customEnd: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    """
    Top product categories by quotation frequency within the period.
    """
    start, end, _, _ = _date_range(range, customStart, customEnd)

    pipeline = [
        {"$match": {"created_at": {"$gte": start, "$lte": end}}},
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.category",
                "timesQuoted": {"$sum": 1},
                "totalQty": {"$sum": "$items.qty"},
                "uniqueProducts": {"$addToSet": "$items.product_id"},
            }
        },
        {
            "$project": {
                "category": "$_id",
                "timesQuoted": 1,
                "totalQty": 1,
                "uniqueProducts": {"$size": "$uniqueProducts"},
            }
        },
        {"$sort": {"timesQuoted": -1}},
        {"$limit": 10},
    ]

    rows = []
    async for row in db.quotations.aggregate(pipeline):
        rows.append(
            {
                "id": str(row.get("_id") or row.get("category") or ""),
                "name": str(row.get("_id") or row.get("category") or "Unknown"),
                "timesQuoted": row["timesQuoted"],
                "totalQty": int(row.get("totalQty") or 0),
                "uniqueProducts": row.get("uniqueProducts", 0),
            }
        )

    # Fallback: product counts by category
    if not rows:
        cat_pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        async for row in db.products.aggregate(cat_pipeline):
            if row["_id"]:
                rows.append(
                    {
                        "id": str(row["_id"]),
                        "name": str(row["_id"]),
                        "timesQuoted": 0,
                        "totalQty": 0,
                        "uniqueProducts": row["count"],
                    }
                )

    return rows


# ---------------------------------------------------------------------------
# /funnel
# ---------------------------------------------------------------------------

@router.get("/funnel")
async def get_funnel(
    range: str = Query("7d"),
    customStart: Optional[str] = Query(None),
    customEnd: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    """
    Inquiry → Quotation conversion funnel for the selected period.
    Stages: Inquiries Received → In Progress → Quotations Created → Resolved
    """
    start, end, _, _ = _date_range(range, customStart, customEnd)

    async def count(collection: str, query: Dict) -> int:
        return await db[collection].count_documents(query)

    total_inq = await count("inquiries", {"created_at": {"$gte": start, "$lte": end}})
    in_progress = await count(
        "inquiries",
        {"created_at": {"$gte": start, "$lte": end}, "status": "in-progress"},
    )
    resolved = await count(
        "inquiries",
        {"created_at": {"$gte": start, "$lte": end}, "status": "resolved"},
    )
    quotations = await count("quotations", {"created_at": {"$gte": start, "$lte": end}})

    def conv(a: int, b: int) -> float:
        return round(a / b * 100, 1) if b > 0 else 0.0

    stages = [
        {
            "stage": "Inquiries Received",
            "count": total_inq,
            "conversionRate": 100.0,
            "dropOff": 0.0,
        },
        {
            "stage": "In Progress",
            "count": in_progress,
            "conversionRate": conv(in_progress, total_inq),
            "dropOff": round(100 - conv(in_progress, total_inq), 1),
        },
        {
            "stage": "Quotations Created",
            "count": quotations,
            "conversionRate": conv(quotations, total_inq),
            "dropOff": round(100 - conv(quotations, total_inq), 1),
        },
        {
            "stage": "Resolved",
            "count": resolved,
            "conversionRate": conv(resolved, total_inq),
            "dropOff": round(100 - conv(resolved, total_inq), 1),
        },
    ]

    return {"stages": stages}


# ---------------------------------------------------------------------------
# /brands-breakdown
# ---------------------------------------------------------------------------

@router.get("/brands-breakdown")
async def get_brands_breakdown(
    range: str = Query("7d"),
    customStart: Optional[str] = Query(None),
    customEnd: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db_dep),
    admin=Depends(get_current_admin),
) -> Any:
    """
    Brand breakdown by quotation frequency within the period.
    """
    start, end, _, _ = _date_range(range, customStart, customEnd)

    pipeline = [
        {"$match": {"created_at": {"$gte": start, "$lte": end}}},
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.brand",
                "timesQuoted": {"$sum": 1},
                "totalQty": {"$sum": "$items.qty"},
                "uniqueProducts": {"$addToSet": "$items.product_id"},
            }
        },
        {
            "$project": {
                "brand": "$_id",
                "timesQuoted": 1,
                "totalQty": 1,
                "uniqueProducts": {"$size": "$uniqueProducts"},
            }
        },
        {"$sort": {"timesQuoted": -1}},
        {"$limit": 10},
    ]

    rows = []
    async for row in db.quotations.aggregate(pipeline):
        rows.append(
            {
                "id": str(row.get("_id") or ""),
                "name": str(row.get("_id") or "Unknown"),
                "timesQuoted": row["timesQuoted"],
                "totalQty": int(row.get("totalQty") or 0),
                "uniqueProducts": row.get("uniqueProducts", 0),
            }
        )

    # Fallback: product counts by brand
    if not rows:
        brand_pipeline = [
            {"$group": {"_id": "$brand", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        async for row in db.products.aggregate(brand_pipeline):
            if row["_id"]:
                rows.append(
                    {
                        "id": str(row["_id"]),
                        "name": str(row["_id"]),
                        "timesQuoted": 0,
                        "totalQty": 0,
                        "uniqueProducts": row["count"],
                    }
                )

    return rows
