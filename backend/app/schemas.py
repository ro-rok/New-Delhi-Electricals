from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


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
    category: str
    series: str | None = None
    list_price: int = Field(..., description="List price in INR as integer rupees")
    currency: str = "INR"
    images: List[str] = []
    datasheet_url: Optional[str] = None
    specs: Dict[str, Any] = {}
    description: Optional[str] = None
    # Free-form source metadata so we can store file/page/confidence/import ids
    catalog_source: Optional[Dict[str, Any]] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    series: Optional[str] = None
    list_price: Optional[int] = None
    currency: Optional[str] = None
    images: Optional[List[str]] = None
    datasheet_url: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    description: Optional[str] = None


class ProductInDB(ProductBase):
    id: str = Field(..., alias="_id")


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
    name: str
    company: Optional[str] = None
    email: str
    phone: str
    product_sku: Optional[str] = None
    message: str
    source: str = "form"
    status: str = "new"
    created_at: datetime


class AdminLog(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    action: str
    entity: str
    entity_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    admin_email: str
    created_at: datetime


