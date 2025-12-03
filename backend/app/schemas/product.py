from typing import List, Optional, Union
from pydantic import BaseModel, Field


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


class SwitchSpecs(BaseModel):
    ampere: Optional[float] = None
    color: Optional[str] = None
    mw: Optional[float] = None
    has_indicator: Optional[bool] = None
    type_detail: Optional[str] = None


class CircuitProtectionSpecs(BaseModel):
    ampere: Optional[float] = None
    curve: Optional[str] = None
    poles: Optional[int] = None
    mw: Optional[float] = None


class Product(BaseModel):
    sku: str = Field(..., description="Primary key - unique product identifier")
    name: str
    product_family: str
    category: str
    subcategory: str
    brand: str
    specs: Union[SwitchSpecs, CircuitProtectionSpecs]
    variant: List[str] = []
    pricing: ProductPricing
    media: ProductMedia
    seo: ProductSEO
    status: ProductStatus
