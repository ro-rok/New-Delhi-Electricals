from __future__ import annotations

import re
from typing import Any, Mapping, Optional

def slugify_brand(brand: Optional[str]) -> Optional[str]:
    """
    Normalize brand to lowercase, dash-separated slug.
    Keeps alphanumerics, replaces other chars with a single dash.
    """
    if not brand:
        return None
    slug = re.sub(r"[^a-z0-9]+", "-", brand.lower())
    return slug.strip("-") or None

def extract_primary_slug(doc: Mapping[str, Any]) -> Optional[str]:
    """
    Extract the product slug from the top-level field only.
    Returns doc["slug"] or None if not present.
    """
    return doc.get("slug")

def inject_brand_and_url(doc: dict[str, Any]) -> dict[str, Any]:
    """
    Enrich a product document with brand_slug and url_path (/:brand/:slug).
    Does not mutate storage logic; intended for API responses only.
    """
    brand_slug = slugify_brand(doc.get("brand"))
    slug = extract_primary_slug(doc)

    if brand_slug:
        doc["brand_slug"] = brand_slug
    if slug and brand_slug:
        doc["url_path"] = f"/{brand_slug}/{slug}"
    return doc

