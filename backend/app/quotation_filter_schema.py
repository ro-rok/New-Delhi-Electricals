"""
Schema-driven filter definitions for the Quotation Maker.
Maps each ProductCategory to facet fields backed by MongoDB paths.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Literal, Optional

FilterType = Literal["string", "number", "bool"]
FilterWidget = Literal["select", "multi", "range"]


@dataclass(frozen=True)
class FilterDefinition:
    key: str
    label: str
    mongo_path: str
    filter_type: FilterType = "string"
    widget: FilterWidget = "select"


# Sentinel value for cross-category product browse in quotation maker
ALL_CATEGORIES = "All"

# brand + series are always available via top-level fields
_BRAND = FilterDefinition("brand", "Brand", "brand")
_SERIES = FilterDefinition("series", "Series", "series")
_COLOR = FilterDefinition("color", "Color", "specs.color")
_SUBCATEGORY = FilterDefinition("subcategory", "Subcategory", "subcategory")
# Key must differ from sidebar scope query param "category" (All / Switches / …)
_CATEGORY = FilterDefinition("product_category", "Category", "category")


def is_all_categories(category: str) -> bool:
    return category == ALL_CATEGORIES


def db_category_scope(category: str) -> Optional[str]:
    """Mongo category field filter; None means all categories."""
    return None if is_all_categories(category) else category


CATEGORY_FILTERS: Dict[str, List[FilterDefinition]] = {
    ALL_CATEGORIES: [
        _CATEGORY,
        _BRAND,
        _SERIES,
        _COLOR,
    ],
    "Switches": [
        _BRAND,
        _SERIES,
        _COLOR,
        FilterDefinition("mw", "Module (M)", "specs.mw", "number"),
        FilterDefinition("type_detail", "Type", "specs.type_detail"),
    ],
    "Plates": [
        _BRAND,
        _SERIES,
        _COLOR,
        FilterDefinition("finish", "Finish", "specs.finish"),
        FilterDefinition("modules", "Modules", "specs.modules", "number"),
        FilterDefinition("material", "Material", "specs.material"),
        _SUBCATEGORY,
    ],
    "Circuit Protection": [
        _BRAND,
        _SERIES,
        FilterDefinition("poles", "Poles", "specs.poles", "number"),
        FilterDefinition("ampere", "Ampere", "specs.ampere", "number"),
        FilterDefinition("curve", "Curve", "specs.curve"),
    ],
    "Fan Controls": [
        _BRAND,
        _SERIES,
        _COLOR,
        FilterDefinition("wattage", "Wattage", "specs.wattage", "number"),
        FilterDefinition("type_detail", "Type", "specs.type_detail"),
    ],
    "Power Sockets": [
        _BRAND,
        _SERIES,
        _COLOR,
        FilterDefinition("ampere", "Ampere", "specs.ampere", "number"),
        FilterDefinition("socket_type", "Socket Type", "specs.socket_type"),
    ],
    "Dimmers": [
        _BRAND,
        _SERIES,
        _COLOR,
        FilterDefinition("wattage", "Wattage", "specs.wattage", "number"),
    ],
    "Data Sockets": [
        _BRAND,
        _SERIES,
        _COLOR,
    ],
    "Boxes": [
        _BRAND,
        _SUBCATEGORY,
        FilterDefinition("material", "Material", "specs.material"),
        FilterDefinition("modules", "Modules", "specs.modules", "number"),
    ],
    "Accessories": [
        _BRAND,
        _SERIES,
        _COLOR,
        FilterDefinition("type_detail", "Type", "specs.type_detail"),
    ],
    "Hospitality": [
        _BRAND,
        _SERIES,
        _COLOR,
    ],
}


def get_filters_for_category(category: str) -> List[FilterDefinition]:
    return CATEGORY_FILTERS.get(category, [_BRAND, _SERIES])


def get_filter_by_key(category: str, key: str) -> Optional[FilterDefinition]:
    for f in get_filters_for_category(category):
        if f.key == key:
            return f
    return None


def all_filter_keys(category: str) -> List[str]:
    return [f.key for f in get_filters_for_category(category)]
