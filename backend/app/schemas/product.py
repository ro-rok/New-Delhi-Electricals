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
    """
    Technical specifications for switches and related wiring accessories.

    This model is intentionally broad so it can cover:
    - Classic modular switches (e.g. ENGLAZE soft feel)
    - Touch / IR / smart switches (e.g. ENTICE)
    - Cover plates that reuse the same basic attributes (color, modules, etc.)
    """

    # Electrical rating (e.g. 6, 10, 16A)
    ampere: Optional[float] = None

    # Visual / finish details (e.g. Snow White, Mocha Wood)
    color: Optional[str] = None

    # Module width (1M, 2M, 3M, etc.) represented as numeric count where available
    mw: Optional[float] = None

    # For grid frames / plates and boxes: material and cut-out / overall dimensions
    material: Optional[str] = None
    material_compatibility: Optional[List[str]] = None
    cutout_dimensions_mm: Optional[str] = None
    dimensions_mm: Optional[str] = None

    # Installation / mounting details (e.g. Furniture, Flush, Surface)
    installation: Optional[str] = None
    mounting_type: Optional[str] = None

    # Orientation where relevant (e.g. Horizontal, Vertical, Square)
    orientation: Optional[str] = None

    # Whether the device has an indicator / locator LED
    has_indicator: Optional[bool] = None

    # Short free‑form type detail (e.g. \"10AX 1‑way\", \"Bell push\")
    type_detail: Optional[str] = None

    # Explicit module size label when provided in catalogs (e.g. \"2M\")
    module_size: Optional[str] = None

    # Number of channels / gangs for multi‑channel touch or smart switches
    channels: Optional[int] = None

    # High‑level control type (e.g. \"Touch IR Switch\", \"Smart Wi‑Fi Switch\")
    control_type: Optional[str] = None


class CircuitProtectionSpecs(BaseModel):
    """
    Technical specifications for circuit protection devices:
    - MCBs
    - RCCBs / ELCBs
    - RCBOs
    - Modular changeover switches, isolators, etc.
    """

    # Rated current (A)
    ampere: Optional[float] = None

    # Trip curve for MCBs (e.g. B, C, D)
    curve: Optional[str] = None

    # Number of poles (1, 2, 3, 4)
    poles: Optional[int] = None

    # Module width (1M, 2M, 3M, 4M, etc.)
    mw: Optional[float] = None

    # Residual current sensitivity in mA (e.g. 30, 100, 300) for RCCB / RCBO
    sensitivity_ma: Optional[float] = None


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
