from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class VariantAttributes:
    color: Optional[str] = None
    finish: Optional[str] = None
    rating: Optional[str] = None


@dataclass
class Variant:
    variant_name: Optional[str]
    cat_no: str
    mrp_in: Optional[int]
    attributes: VariantAttributes = field(default_factory=VariantAttributes)
    confidence: float = 0.0
    raw_line: str = ""


@dataclass
class ImageRef:
    page: int
    filename: str
    role: str  # "packshot" | "hero" | "group"
    cloudinary_url: Optional[str] = None


@dataclass
class InlineImageRef:
    page: int
    note: str


@dataclass
class Item:
    name: str
    description: str
    primary_cat_no: Optional[str]
    mrp_in: Optional[int]
    std_pack: Optional[str]
    module_width: Optional[int]
    current_rating_a: Optional[int]
    poles: Optional[str]
    variants: List[Variant] = field(default_factory=list)
    images: List[ImageRef] = field(default_factory=list)
    image_refs: List[InlineImageRef] = field(default_factory=list)
    page_refs: List[int] = field(default_factory=list)
    confidence: float = 0.0
    raw_line: str = ""


@dataclass
class SubcategoryNode:
    subcategory: str
    items: List[Item] = field(default_factory=list)


@dataclass
class CategoryNode:
    category: str
    subcategories: List[SubcategoryNode] = field(default_factory=list)


@dataclass
class ImageIndexEntry:
    page: int
    filename: str
    ocr_text_summary: str


@dataclass
class CatalogSourceMeta:
    filename: str
    parsed_date: str


@dataclass
class CatalogRoot:
    source: CatalogSourceMeta
    catalog: List[CategoryNode]
    images_index: List[ImageIndexEntry]
    log: Dict[str, Any]


def _serialize_variant_attributes(attrs: VariantAttributes) -> Dict[str, Any]:
    return {
        "color": attrs.color,
        "finish": attrs.finish,
        "rating": attrs.rating,
    }


def _serialize_variant(v: Variant) -> Dict[str, Any]:
    return {
        "variant_name": v.variant_name,
        "cat_no": v.cat_no,
        "mrp_in": v.mrp_in,
        "attributes": _serialize_variant_attributes(v.attributes),
        "confidence": float(v.confidence),
        "raw_line": v.raw_line,
    }


def _serialize_image(img: ImageRef) -> Dict[str, Any]:
    return {
        "page": img.page,
        "filename": img.filename,
        "role": img.role,
        "cloudinary_url": img.cloudinary_url,
    }


def _serialize_inline_image_ref(ref: InlineImageRef) -> Dict[str, Any]:
    return {
        "page": ref.page,
        "note": ref.note,
    }


def _serialize_item(item: Item) -> Dict[str, Any]:
    return {
        "name": item.name,
        "description": item.description,
        "primary_cat_no": item.primary_cat_no,
        "mrp_in": item.mrp_in,
        "std_pack": item.std_pack,
        "module_width": item.module_width,
        "current_rating_a": item.current_rating_a,
        "poles": item.poles,
        "variants": [_serialize_variant(v) for v in item.variants],
        "images": [_serialize_image(img) for img in item.images],
        "image_refs": [_serialize_inline_image_ref(ref) for ref in item.image_refs],
        "page_refs": item.page_refs,
        "confidence": float(item.confidence),
        "raw_line": item.raw_line,
    }


def _serialize_subcategory(subcat: SubcategoryNode) -> Dict[str, Any]:
    return {
        "subcategory": subcat.subcategory,
        "items": [_serialize_item(item) for item in subcat.items],
    }


def _serialize_category(cat: CategoryNode) -> Dict[str, Any]:
    return {
        "category": cat.category,
        "subcategories": [_serialize_subcategory(sc) for sc in cat.subcategories],
    }


def _serialize_image_index_entry(entry: ImageIndexEntry) -> Dict[str, Any]:
    return {
        "page": entry.page,
        "filename": entry.filename,
        "ocr_text_summary": entry.ocr_text_summary,
    }


def serialize_catalog_root(root: CatalogRoot) -> Dict[str, Any]:
    """
    Convert CatalogRoot dataclass into a JSON-serializable dict that follows
    the required schema exactly.
    """
    return {
        "source": asdict(root.source),
        "catalog": [_serialize_category(cat) for cat in root.catalog],
        "images_index": [
            _serialize_image_index_entry(entry) for entry in root.images_index
        ],
        "log": root.log,
    }


def make_source_meta(filename: str) -> CatalogSourceMeta:
    return CatalogSourceMeta(
        filename=filename,
        parsed_date=datetime.utcnow().isoformat(timespec="seconds") + "Z",
    )



