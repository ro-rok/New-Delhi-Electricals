from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, computed_field

from .product import ProductStatus

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AdminUser(BaseModel):
    id: str | None = None
    email: str
    hashed_password: str
    twofa_secret: str | None = Field(default=None, alias="twofaSecret")
    last_login: Optional[datetime] = Field(default=None, alias="lastLogin")

class ProductBase(BaseModel):
    sku: str
    name: str
    brand: str
    brand_slug: str | None = None
    source_file: Optional[str] = Field(default=None, alias="_source_file")
    category: str
    subcategory: str | None = None
    series: str | None = None
    list_price: int = Field(..., description="List price in INR as integer rupees")
    currency: str = "INR"
    images: List[str] = Field(default_factory=list)
    datasheet_url: Optional[str] = None
    specs: Dict[str, Any] = Field(default_factory=dict)
    description: str = ""
    status: ProductStatus = Field(default_factory=ProductStatus)
    slug: Optional[str] = None
    url_path: str | None = None
    highlights: Optional[List[Any]] = Field(default=None, description="Product highlights/features")
    variant: Optional[Dict[str, str]] = Field(default=None, description="Variant map: SKU -> Color Name")
    catalog_source: Optional[Dict[str, Any]] = Field(default=None, description="Catalog source metadata")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    series: Optional[str] = None
    list_price: Optional[int] = None
    discount: Optional[float] = None  # No default - will be included in model_dump if explicitly provided
    currency: Optional[str] = None
    images: Optional[List[str]] = None
    datasheet_url: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    status: Optional[ProductStatus | Dict[str, Any]] = None
    slug: Optional[str] = None
    highlights: Optional[List[Any]] = None

class ProductInDB(ProductBase):
    id: str = Field(..., alias="_id")
    
    @computed_field
    @property
    def discount(self) -> Optional[float]:
        """Extract discount from catalog_source.pricing.discount"""
        if self.catalog_source and isinstance(self.catalog_source, dict):
            pricing = self.catalog_source.get("pricing")
            if pricing and isinstance(pricing, dict):
                return pricing.get("discount")
        return None

class ProductListResponse(BaseModel):
    items: List[ProductInDB]
    total: int
    page: int
    page_size: int = Field(..., alias="pageSize")

class ImageCandidate(BaseModel):
    url: str
    source: str = Field(
        ...,
        description="pdf_page | pdf_inline | web_stub | manual | upload",
    )
    score: float = 0.0

class CatalogImportRow(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    import_id: str
    row_id: str
    sku: str
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    series: Optional[str] = None
    list_price: int
    currency: str = "INR"
    page_no: int = Field(..., alias="page")
    confidence_score: float = Field(..., alias="confidence")
    raw_text: Optional[str] = None
    specs: Dict[str, Any] = {}
    image_candidates: List[ImageCandidate] = []
    chosen_image_urls: List[str] = []
    variant_group_key: Optional[str] = None
    last_decision: Optional[str] = Field(
        default=None, description="created | updated | ignored | failed"
    )

class CatalogImport(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    file_name: str
    cloudinary_pdf_url: Optional[str] = None
    local_pdf_path: Optional[str] = None
    brand: Optional[str] = None
    status: str = Field(
        default="pending", description="pending | processing | done | failed"
    )
    created_at: datetime
    updated_at: Optional[datetime] = None
    admin_id: str
    parsing_summary: Dict[str, Any] = {}

class Inquiry(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    name: str = Field(..., min_length=1, max_length=100)
    email: str
    phone: str
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)
    status: str = Field(default="new", pattern=r'^(new|in-progress|resolved)$')
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class InquiryCreate(BaseModel):
    """Schema for creating a new inquiry"""
    name: str = Field(..., min_length=1, max_length=100)
    email: str
    phone: str
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)

class InquiryResponse(BaseModel):
    """Schema for inquiry response"""
    id: str = Field(..., alias="_id")
    name: str
    email: str
    phone: str
    subject: str
    message: str
    status: str
    created_at: datetime
    updated_at: datetime

class AdminLog(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    action: str
    entity: str
    entity_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    admin_email: str
    created_at: datetime

class ErrorResponse(BaseModel):
    """Consistent error response format for all API endpoints"""
    message: str
    code: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

