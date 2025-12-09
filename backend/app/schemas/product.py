from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, Field


# -------------------------------------------------
# Core shared models
# -------------------------------------------------

class ProductCategory(str, Enum):
    ACCESSORIES = "Accessories"
    BOXES = "Boxes"
    CIRCUIT_PROTECTION = "Circuit Protection"
    DATA_SOCKETS = "Data Sockets"
    DIMMERS = "Dimmers"
    FAN_CONTROLS = "Fan Controls"
    HOSPITALITY = "Hospitality"
    PLATES = "Plates"
    POWER_SOCKETS = "Power Sockets"
    SWITCHES = "Switches"


class ProductPricing(BaseModel):
    """
    Commercial pricing for a product.
    Mirrors Mongo fields: list_price → mrp, etc.
    """
    mrp: float
    discount: Optional[float] = None
    selling_price: Optional[float] = None
    std_pack: str
    note: Optional[str] = None


class MediaImage(BaseModel):
    """
    Single product image with an optional label.
    This is a normalized form over Mongo's `images: [string]`.
    """
    url: str
    label: str


class ProductMedia(BaseModel):
    """
    Media attached to the product.
    """
    images: List[MediaImage] = []
    documents: List[str] = []


class ProductSEO(BaseModel):
    """
    SEO / marketing metadata for the product.

    NOTE: slug is now a top-level field on Product, not inside SEO.
    """
    keywords: List[str] = []
    meta_description: str


class ProductStatus(BaseModel):
    """
    Flags to control product visibility and merchandising.
    """
    is_active: bool = True
    is_featured: bool = False
    coming_soon: bool = False


# -------------------------------------------------
# Category-wise Specs models
# -------------------------------------------------

class AccessoriesSpecs(BaseModel):
    """
    Specs for Category: Accessories

    Covers:
    - Blank off units
    - Buzzers
    - Cable outlets
    - Door bells
    - LED foot lights / phase indicators
    - USB chargers, Wi-Fi accessories, curtain controllers, etc.
    """

    ampere: Optional[float] = None          # e.g. USB charger current rating
    color: Optional[str] = None
    has_indicator: Optional[bool] = None
    mw: Optional[float] = None              # module width (1M, 2M, etc.)
    type_detail: Optional[str] = None       # free-form type (e.g. "Door bell", "Buzzer")

    # Lighting / electrical behavior
    wattage: Optional[float] = None
    frequency: Optional[str] = None         # e.g. "50Hz"
    light_type: Optional[str] = None        # e.g. "LED"
    voltage: Optional[str] = None           # e.g. "230V"

    # LED phase indicator specific
    indicator_color: Optional[str] = None   # e.g. "Red", "Green"

    # Remote / Wi-Fi accessories specific
    compatibility: Optional[str] = None     # e.g. "ENTICE series"
    control_type: Optional[str] = None      # e.g. "IR remote", "Smart Wi-Fi"

    # USB charger specific
    certification: Optional[str] = None     # e.g. "BIS"
    output: Optional[str] = None            # e.g. "5V DC"
    output_current_a: Optional[float] = None
    port_type: Optional[str] = None         # e.g. "Type A", "Type C"
    power_watt: Optional[float] = None
    usb_type: Optional[str] = None          # e.g. "USB-A", "USB-C"

    # Wi-Fi scene / accessories
    channels: Optional[int] = None
    packing: Optional[str] = None           # e.g. "1 pc / box"
    scenes: Optional[int] = None
    smart: Optional[bool] = None


class BoxesSpecs(BaseModel):
    """
    Specs for Category: Boxes

    Covers:
    - GI metal mounting boxes
    - Plastic surface mounting boxes
    """
    dimensions_mm: Optional[str] = None     # e.g. "75 x 75 x 35 mm"
    material: Optional[str] = None          # e.g. "GI", "Plastic"
    mounting_type: Optional[str] = None     # e.g. "Surface", "Flush"
    mw: Optional[Union[float, str]] = None  # some rows have "2", some numeric
    orientation: Optional[str] = None       # e.g. "Horizontal", "Vertical"


class CircuitProtectionSpecs(BaseModel):
    """
    Specs for Category: Circuit Protection

    Covers:
    - MCBs
    - RCCBs / ELCBs
    - RCBOs
    - Modular changeover switches, isolators, ACCLs
    """

    ampere: Optional[float] = None          # rated current
    curve: Optional[str] = None             # B/C/D curve (MCB)
    poles: Optional[int] = None             # 1, 2, 3, 4
    mw: Optional[float] = None              # module width
    sensitivity_ma: Optional[float] = None  # RCCB/RCBO residual current

    # ACCL / 3Ph ACCL specific
    dg_current_limit_ampere: Optional[float] = None
    eb_current_ampere: Optional[float] = None

    # Extra fields used by some 'mini MCB' type rows
    packing: Optional[str] = None
    voltage: Optional[str] = None


class DataSocketSpecs(BaseModel):
    """
    Specs for Category: Data Sockets

    Covers:
    - LAN sockets
    - TV sockets
    - Telephone sockets
    """

    ampere: Optional[float] = None          # mostly null, but kept for completeness
    category: Optional[str] = None          # e.g. "CAT6"
    color: Optional[str] = None
    has_indicator: Optional[bool] = None
    mw: Optional[float] = None
    type_detail: Optional[str] = None       # e.g. "RJ45 LAN", "TV socket"
    with_shutter: Optional[bool] = None


class DimmerSpecs(BaseModel):
    """
    Specs for Category: Dimmers

    Covers:
    - Dimmers (1M / 2M)
    - Fan regulators & dimmers (1M)
    - Modular IR dimmers
    """

    ampere: Optional[float] = None
    color: Optional[str] = None
    has_indicator: Optional[bool] = None
    mw: Optional[float] = None
    type_detail: Optional[str] = None       # e.g. "Fan regulator", "Light dimmer"

    # Power-related fields
    rating_watt: Optional[float] = None
    wattage: Optional[float] = None

    # IR dimmer specific
    control_type: Optional[str] = None      # e.g. "IR remote dimmer"
    module_size: Optional[str] = None       # e.g. "1M", "2M"


class FanControlSpecs(BaseModel):
    """
    Specs for Category: Fan Controls

    Covers:
    - Fan regulators (1M / 2M)
    - Fan regulators & dimmers
    - Modular IR fan regulators
    - Wi-Fi fan regulators
    """

    ampere: Optional[float] = None
    color: Optional[str] = None
    has_indicator: Optional[bool] = None
    mw: Optional[float] = None
    type_detail: Optional[str] = None

    # Regulator behavior
    rating_watt: Optional[float] = None
    wattage: Optional[float] = None
    steps: Optional[int] = None             # e.g. 4-step regulator

    # Compliance / markings
    isi_marked: Optional[bool] = None

    # IR / Wi-Fi variants
    control_type: Optional[str] = None      # e.g. "IR", "Wi-Fi"
    module_size: Optional[str] = None
    packing: Optional[str] = None
    smart: Optional[bool] = None


class HospitalitySpecs(BaseModel):
    """
    Specs for Category: Hospitality

    Covers:
    - DND switches
    - DND-MMR units
    - Key tag switches & accessories
    - Shaver sockets
    - LED foot lights, MMR switches
    """

    ampere: Optional[float] = None
    color: Optional[str] = None
    has_indicator: Optional[bool] = None
    mw: Optional[float] = None
    type_detail: Optional[str] = None
    voltage: Optional[str] = None           # e.g. "230V", shaver socket voltage


class PowerSocketSpecs(BaseModel):
    """
    Specs for Category: Power Sockets

    Covers:
    - 2M universal / heavy-duty sockets, etc.
    """

    ampere: Optional[float] = None
    min_ampere: Optional[float] = None      # lower end of range (e.g. 6/16A)
    color: Optional[str] = None
    has_indicator: Optional[bool] = None
    heavy_duty: Optional[bool] = None
    isi_marked: Optional[bool] = None
    mw: Optional[float] = None
    pins: Optional[int] = None              # e.g. 2 pin, 3 pin, 5 pin
    raised: Optional[bool] = None
    socket_type: Optional[str] = None       # e.g. "Universal"
    type_detail: Optional[str] = None
    with_shutter: Optional[bool] = None


class CoverPlateSpecs(BaseModel):
    """
    Specs for Category: Plates

    Unifies:
    - PVC cover plates with grid frames
    - Cover plates without grid frames (vibrant / vivid / wooden finishes)
    - Glass plates (with / without grid frames)
    - Grid frames
    - Metal / PC / Plexi / Wood plates, etc.
    """

    # Visual / finish details
    color: Optional[str] = None
    finish: Optional[str] = None            # e.g. "Matt", "Glossy", "Marble"

    # Module / size information
    mw: Optional[float] = None              # nods to existing "mw" field
    module: Optional[int] = None            # singular "module" (some rows)
    modules: Optional[int] = None           # "modules" used in Grid Frames etc.
    module_size: Optional[str] = None       # explicit "1M", "2M" where present

    # Dimensions
    dimensions: Optional[str] = Field(
        default=None,
        description="Product dimensions as a string (e.g. '97 x 90 x 14 mm')."
    )
    dimensions_mm: Optional[str] = None
    cutout_dimensions_mm: Optional[str] = None

    # Materials + compatibility
    material: Optional[str] = None          # e.g. "PVC", "Glass", "Aluminium", "Wood"
    material_compatibility: Optional[List[str]] = None

    # Type / usage hints
    type_detail: Optional[str] = None
    bezel: Optional[str] = None             # used for some cover plates with grid frames
    suitable_for: Optional[str] = None      # e.g. "ENTICE, ENGLAZE"
    design: Optional[str] = None            # used in "Cover plates without grid frames"

    # Grid frame indicators
    grid_frame: Optional[bool] = Field(
        default=None,
        alias="Grid frame",
        description="True if the product is or includes a grid frame."
    )
    cover_included: Optional[bool] = None
    grid_frame_included: Optional[bool] = None
    with_pillar: Optional[bool] = None

    # Installation / mounting
    installation: Optional[str] = None      # e.g. "Surface", "Flush"
    mounting_type: Optional[str] = None
    orientation: Optional[str] = None       # e.g. "Horizontal", "Vertical", "Square"

    # Packaging
    packing: Optional[str] = None           # e.g. "10 pcs / box"


class SwitchSpecs(BaseModel):
    """
    Specs for Category: Switches

    Covers:
    - Regular switches (soft feel, bell push, mega switches, etc.)
    - Wi-Fi / IR switches
    - Mini MCB/MCB-like rows that live under the 'Switches' category in Mongo
    """

    ampere: Optional[float] = None
    color: Optional[str] = None
    has_indicator: Optional[bool] = None
    mw: Optional[float] = None
    type_detail: Optional[str] = None       # "10AX 1-way", "Bell push", etc.

    # Extra attributes used in some switch series
    load: Optional[str] = None              # e.g. "Motor", "Lamp"
    packing: Optional[str] = None
    voltage: Optional[str] = None
    rating_watt: Optional[float] = None
    wattage: Optional[float] = None

    # MCB-like data for Mini-MCB entries that live under 'Switches'
    poles: Optional[Union[int, str]] = None
    curve: Optional[str] = None
    sensitivity_ma: Optional[float] = None

    # Smart / modular variants
    channels: Optional[int] = None
    control_type: Optional[str] = None      # e.g. "Touch IR Switch", "Wi-Fi Switch"
    module_size: Optional[str] = None


# -------------------------------------------------
# Final Product model
# -------------------------------------------------

class Product(BaseModel):
    """
    Normalized product record used by the application.

    Mongo source fields (sku, name, brand, category, subcategory, slug, series,
    pricing.*, specs.*, seo.*, status.*) are transformed into this schema.
    """

    sku: str = Field(..., description="Primary key - unique product identifier")
    name: str
    product_family: str
    category: ProductCategory
    subcategory: str
    brand: str

    # Slug is now at the same level as brand/category, mirroring Mongo.
    slug: str = Field(..., description="SEO-friendly URL slug for this product")

    # Category-wise technical specification
    specs: Union[
        AccessoriesSpecs,
        BoxesSpecs,
        CircuitProtectionSpecs,
        DataSocketSpecs,
        DimmerSpecs,
        FanControlSpecs,
        HospitalitySpecs,
        PowerSocketSpecs,
        CoverPlateSpecs,
        SwitchSpecs,
    ]

    # Variant map: sibling SKU -> label (e.g. colour)
    variant: dict[str, str] = {}

    # Commerce & merchandising information
    pricing: ProductPricing
    media: ProductMedia
    seo: ProductSEO
    status: ProductStatus
