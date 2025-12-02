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


class CatalogImportRow(BaseModel):
    sku: str
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    series: Optional[str] = None
    list_price: int
    currency: str = "INR"
    page: int
    confidence: float
    image_url: Optional[str] = None
    raw_text: Optional[str] = None


class CatalogImport(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    file_name: str
    brand: Optional[str] = None
    status: str = "pending"
    rows: List[CatalogImportRow] = []
    meta: Dict[str, Any] = {}
    created_at: datetime
    created_by: str


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


