from typing import List, Optional
from pydantic import BaseModel, Field


class ProductSpecs(BaseModel):
    ampere: Optional[float] = None
    voltage: Optional[float] = None
    curve: Optional[str] = None
    poles: Optional[int] = None
    modules: Optional[int] = None
    color: Optional[str] = None
    color_code: Optional[str] = None
    mw: Optional[float] = None
    has_indicator: Optional[bool] = None
    contact_form: Optional[str] = None
    type_detail: Optional[str] = None
    highlights: Optional[List[str]] = Field(
        default=None,
        description="Product highlights/features list"
    )


class ProductPricing(BaseModel):
    mrp: float
    discount: Optional[float] = None
    selling_price: Optional[float] = None
    std_pack: str


class MediaImage(BaseModel):
    url: str
    label: str


class ProductMedia(BaseModel):
    images: List[MediaImage] = []
    documents: List[str] = []


class ProductSEO(BaseModel):
    slug: str
    keywords: List[str] = []
    meta_description: str


class ProductStatus(BaseModel):
    is_active: bool = True
    is_featured: bool = False


class ProductVariant(BaseModel):
    variant_name: Optional[str] = None
    sku: Optional[str] = None
    specs: Optional[ProductSpecs] = None
    pricing: Optional[ProductPricing] = None


class Product(BaseModel):
    sku: str = Field(..., description="Primary key - unique product identifier")
    name: str
    product_family: str
    category: str
    subcategory: str
    specs: ProductSpecs
    variant: List[ProductVariant] = []
    pricing: ProductPricing
    media: ProductMedia
    seo: ProductSEO
    status: ProductStatus
    highlights: Optional[List[str]] = Field(
        default=None,
        description="Product highlights/features. Common highlights for MCBs include: Conforms to IS/IEC 60898 - 6 kA, Higher life with heavy duty contacts, Breathing channels for cooler operation, Energy saving with 50% lower watt loss, Fire retardant material, True contact indication"
    )
    slug: Optional[str] = Field(
        default=None,
        description="URL-friendly slug generated from product name"
    )

