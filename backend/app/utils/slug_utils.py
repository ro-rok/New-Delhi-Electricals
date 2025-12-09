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
    Pull the most reliable product slug from common locations.
    Order of preference:
    - doc["slug"]
    - doc["seo"]["slug"]
    - doc["catalog_source"]["seo"]["slug"]
    - doc["catalog_source"]["slug"]
    - doc["specs"]["slug"]
    """
    slug = doc.get("slug")
    if slug:
        return slug

    seo = doc.get("seo") or {}
    if isinstance(seo, Mapping):
        slug = seo.get("slug")
        if slug:
            return slug

    catalog_source = doc.get("catalog_source") or {}
    if isinstance(catalog_source, Mapping):
        seo_cs = catalog_source.get("seo") or {}
        if isinstance(seo_cs, Mapping):
            slug = seo_cs.get("slug")
            if slug:
                return slug
        slug = catalog_source.get("slug")
        if slug:
            return slug

    specs = doc.get("specs") or {}
    if isinstance(specs, Mapping):
        slug = specs.get("slug")
        if slug:
            return slug

    return None


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
