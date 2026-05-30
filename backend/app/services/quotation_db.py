"""MongoDB helpers for quotations: counters, usage stats, query building."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..quotation_filter_schema import (
    FilterDefinition,
    db_category_scope,
    get_filter_by_key,
    get_filters_for_category,
)


def escape_regex(text: str) -> str:
    return re.escape(text)


def normalize_compact(text: str) -> str:
    """Lowercase and strip spaces/hyphens for spec-style matching (e.g. '6 AX' -> '6ax')."""
    return re.sub(r"[\s\-_]+", "", (text or "").lower())


def compact_to_boundary_pattern(q_compact: str) -> str:
    """
    Build a regex that matches q_compact without matching inside a longer token.
    E.g. query '6ax' must not match '16ax' (the '6' in '16').
    """
    if not q_compact:
        return ""

    m = re.fullmatch(r"(\d+)([a-zA-Z]+)", q_compact)
    if m:
        num, letters = m.group(1), m.group(2)
        return rf"(?<![0-9]){escape_regex(num)}\s*{escape_regex(letters)}(?![a-zA-Z0-9])"

    if q_compact.isdigit():
        return rf"(?<![0-9]){escape_regex(q_compact)}(?![0-9])"

    return rf"(?<![0-9a-zA-Z]){escape_regex(q_compact)}(?![0-9a-zA-Z])"


def word_to_boundary_pattern(word: str) -> str:
    word = word.strip()
    if not word:
        return ""
    compact = normalize_compact(word)
    if re.fullmatch(r"\d+[a-zA-Z]*", compact) or word.isdigit():
        return compact_to_boundary_pattern(compact)
    return escape_regex(word)


def build_text_search_conditions(q: str) -> Optional[Dict[str, Any]]:
    """Mongo clause for quotation-maker text search with spec-aware boundaries."""
    q = q.strip()
    if not q:
        return None

    q_compact = normalize_compact(q)
    search_fields = ["name", "sku", "brand", "series", "description", "subcategory"]
    words = [w.strip() for w in q.split() if w.strip()]

    # Spec queries like "6 ax" / "6ax" — single token only
    if len(words) == 1 and re.fullmatch(r"\d+[a-zA-Z]+", q_compact):
        regex = {"$regex": compact_to_boundary_pattern(q_compact), "$options": "i"}
        return {"$or": [{field: regex} for field in search_fields]}

    # Multi-word: each word must match (e.g. "Switch 6AX" → switch AND 6ax)
    # Do NOT also require the joined "switch6ax" — names contain spaces between words.
    if len(words) > 1:
        or_groups: List[Dict[str, Any]] = []
        for word in words:
            wp = word_to_boundary_pattern(word)
            if not wp:
                continue
            regex = {"$regex": wp, "$options": "i"}
            or_groups.append({"$or": [{field: regex} for field in search_fields]})
        if or_groups:
            return or_groups[0] if len(or_groups) == 1 else {"$and": or_groups}
        return None

    # Single word / phrase
    patterns: List[str] = []
    if len(q_compact) >= 2:
        patterns.append(compact_to_boundary_pattern(q_compact))
    if not patterns:
        patterns.append(escape_regex(q))

    regex = {"$regex": patterns[0], "$options": "i"}
    return {"$or": [{field: regex} for field in search_fields]}


def score_product_relevance(doc: Dict[str, Any], query: str) -> float:
    """Higher score = better match. Used to rank 6AX above 16AX for query '6ax'."""
    q_compact = normalize_compact(query)
    if not q_compact:
        return 0.0

    name = doc.get("name") or ""
    sku = doc.get("sku") or ""
    name_compact = normalize_compact(name)
    sku_compact = normalize_compact(sku)
    brand_compact = normalize_compact(doc.get("brand") or "")
    series_compact = normalize_compact(doc.get("series") or "")

    score = 0.0
    boundary_pat = compact_to_boundary_pattern(q_compact)
    isolated_name = bool(boundary_pat and re.search(boundary_pat, name, re.IGNORECASE))
    isolated_sku = bool(boundary_pat and re.search(boundary_pat, sku, re.IGNORECASE))

    if sku_compact == q_compact:
        score += 3000
    elif sku_compact.startswith(q_compact):
        score += 2200
    elif isolated_sku:
        score += 1800

    if isolated_name:
        pos = name_compact.find(q_compact)
        score += 1600 - min(pos, 300)
        if name_compact.startswith(q_compact):
            score += 400
    elif q_compact in name_compact:
        # Substring only (e.g. 6ax inside 16ax) — demote heavily
        score += 50

    if q_compact in brand_compact:
        score += 120
    if q_compact in series_compact:
        score += 120

    # Extra penalty: name has 16ax-style embedding when searching 6ax
    if q_compact and not isolated_name and q_compact in name_compact:
        score -= 2500

    return score


def parse_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise ValueError(f"Invalid id: {value}") from exc


async def next_quotation_number(db: AsyncIOMotorDatabase) -> str:
    year = datetime.utcnow().year
    key = f"quotation_{year}"
    result = await db.quotation_counters.find_one_and_update(
        {"_id": key},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = result.get("seq", 1) if result else 1
    return f"NDE-Q-{year}-{seq:05d}"


def base_product_match(*, category: Optional[str] = None, active_only: bool = True) -> Dict[str, Any]:
    match: Dict[str, Any] = {}
    if category:
        match["category"] = category
    if active_only:
        match["$or"] = [
            {"status.is_active": True},
            {"status.is_active": {"$exists": False}},
        ]
    return match


def apply_filter_to_match(match: Dict[str, Any], fdef: FilterDefinition, value: Any) -> None:
    path = fdef.mongo_path
    if fdef.filter_type == "number":
        try:
            match[path] = float(value) if "." in str(value) else int(value)
        except (TypeError, ValueError):
            match[path] = value
    elif fdef.filter_type == "bool":
        match[path] = str(value).lower() in ("true", "1", "yes")
    else:
        match[path] = {"$regex": f"^{escape_regex(str(value))}$", "$options": "i"}


def build_products_match(
    category: str,
    filters: Dict[str, str],
    q: Optional[str] = None,
) -> Dict[str, Any]:
    match = base_product_match(category=db_category_scope(category))
    for key, value in filters.items():
        if not value:
            continue
        fdef = get_filter_by_key(category, key)
        if fdef:
            apply_filter_to_match(match, fdef, value)

    text_search = build_text_search_conditions(q) if q else None
    if text_search:
        if "$and" in match:
            match["$and"].append(text_search)
        else:
            existing = {k: v for k, v in match.items()}
            match = {"$and": [existing, text_search]}

    return match


# Max candidates scored in Python when sorting search results by relevance
SEARCH_RELEVANCE_CAP = 800

MANUAL_PRODUCT_PREFIX = "manual-"


def is_manual_product_id(product_id: str) -> bool:
    return str(product_id).startswith(MANUAL_PRODUCT_PREFIX)


async def record_product_usage(db: AsyncIOMotorDatabase, items: List[Dict[str, Any]]) -> None:
    now = datetime.utcnow()
    for item in items:
        product_id = item.get("product_id") or item.get("productId")
        sku = item.get("sku")
        if not product_id or is_manual_product_id(str(product_id)):
            continue
        await db.quotation_product_usage.update_one(
            {"product_id": product_id},
            {
                "$inc": {"count": item.get("quantity", 1)},
                "$set": {"sku": sku, "last_used_at": now},
            },
            upsert=True,
        )


async def resolve_items_from_inputs(
    db: AsyncIOMotorDatabase,
    inputs: List[Any],
) -> List[Dict[str, Any]]:
    """Resolve QuotationItemInput list to full item dicts from products collection."""
    from .quotation_pricing import build_quotation_item, extract_color_from_specs

    resolved: List[Dict[str, Any]] = []
    for inp in inputs:
        if hasattr(inp, "model_dump"):
            data = inp.model_dump(by_alias=False)
        elif isinstance(inp, dict):
            data = inp
        else:
            data = dict(inp)

        product_id = data.get("product_id") or data.get("productId")
        is_manual = bool(data.get("is_manual") or data.get("isManual")) or is_manual_product_id(
            str(product_id or "")
        )

        if is_manual:
            name = (data.get("name") or "").strip() or "Custom item"
            list_price = int(
                round(float(data.get("list_price") or data.get("listPrice") or 0))
            )
            if list_price < 0:
                list_price = 0
            manual_id = str(product_id) if product_id else f"{MANUAL_PRODUCT_PREFIX}{ObjectId()}"
            if not is_manual_product_id(manual_id):
                manual_id = f"{MANUAL_PRODUCT_PREFIX}{manual_id}"

            item = build_quotation_item(
                product_id=manual_id,
                sku=(data.get("sku") or "MISC").strip() or "MISC",
                name=name,
                brand=(data.get("brand") or "Misc").strip() or "Misc",
                list_price=list_price,
                quantity=int(data.get("quantity", 1)),
                item_discount_pct=float(
                    data.get("item_discount_pct", data.get("itemDiscountPct", 0))
                ),
                manual_unit_price=data.get("manual_unit_price", data.get("manualUnitPrice")),
            )
            resolved.append(item.model_dump(by_alias=True))
            continue

        oid = parse_object_id(str(product_id))
        doc = await db.products.find_one({"_id": oid})
        if not doc:
            raise ValueError(f"Product not found: {product_id}")

        specs = doc.get("specs") or {}
        item = build_quotation_item(
            product_id=str(doc["_id"]),
            sku=doc.get("sku", ""),
            name=doc.get("name", ""),
            brand=doc.get("brand", ""),
            list_price=int(doc.get("list_price", 0)),
            quantity=int(data.get("quantity", 1)),
            item_discount_pct=float(data.get("item_discount_pct", data.get("itemDiscountPct", 0))),
            manual_unit_price=data.get("manual_unit_price", data.get("manualUnitPrice")),
            series=doc.get("series"),
            color=extract_color_from_specs(specs),
        )
        resolved.append(item.model_dump(by_alias=True))
    return resolved
