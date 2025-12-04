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
    dimensions: Optional[str] = Field(
        default=None,
        description="Product dimensions as a string (e.g. '97 x 90 x 14 mm'). Used for cover plates."
    )

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


class CoverPlateSpecs(BaseModel):
    """
    Technical specifications for cover plates and grid frames.
    
    This model covers:
    - PVC Cover Plates with Grid Frame
    - Glass Cover Plates with Grid Frame
    - Cover Plates without grid frames
    - Various materials and finishes
    """

    # Visual / finish details (e.g. White, Onyx Black, Magnesium Grey)
    color: Optional[str] = None

    # Module width (1M, 2M, 3M, etc.) represented as numeric count
    mw: Optional[float] = None

    # Product dimensions as a string (e.g. '97 x 90 x 14 mm')
    dimensions: Optional[str] = Field(
        default=None,
        description="Product dimensions as a string (e.g. '97 x 90 x 14 mm')"
    )

    # Alternative dimension fields for structured data
    dimensions_mm: Optional[str] = None
    cutout_dimensions_mm: Optional[str] = None

    # Material type (e.g. PVC, Glass, etc.)
    material: Optional[str] = None

    # Material compatibility list
    material_compatibility: Optional[List[str]] = None

    # Short free‑form type detail (e.g. "1 Module Cover Plate with Grid Frame")
    type_detail: Optional[str] = None

    # Grid frame indicator (true if plate has grid frame, false otherwise)
    grid_frame: Optional[bool] = Field(
        default=None,
        alias="Grid frame",
        description="Indicates whether the cover plate includes a grid frame. True if product name contains 'Grid frame', false otherwise."
    )

    # Installation / mounting details (e.g. Furniture, Flush, Surface)
    installation: Optional[str] = None
    mounting_type: Optional[str] = None

    # Orientation where relevant (e.g. Horizontal, Vertical, Square)
    orientation: Optional[str] = None

    # Explicit module size label when provided in catalogs (e.g. "2M")
    module_size: Optional[str] = None


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
    specs: Union[SwitchSpecs, CircuitProtectionSpecs, CoverPlateSpecs]
    variant: List[str] = []
    pricing: ProductPricing
    media: ProductMedia
    seo: ProductSEO
    status: ProductStatus
