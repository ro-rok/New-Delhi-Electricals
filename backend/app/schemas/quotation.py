from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class QuotationStatus(str, Enum):
    DRAFT = "draft"
    FINAL = "final"
    VOID = "void"


class GstMode(str, Enum):
    INCLUSIVE = "inclusive"
    EXCLUSIVE = "exclusive"


class QuotationCustomer(BaseModel):
    name: str = ""
    phone: str = ""
    gst_number: str = Field(default="", alias="gstNumber")
    address: str = ""

    model_config = {"populate_by_name": True}


class QuotationLineTotals(BaseModel):
    lp_total: float = Field(0, alias="lpTotal")
    line_selling_unit: float = Field(0, alias="lineSellingUnit")
    line_amount: float = Field(0, alias="lineAmount")

    model_config = {"populate_by_name": True}


class QuotationItemInput(BaseModel):
    product_id: str = Field(..., alias="productId")
    quantity: int = Field(1, ge=1)
    item_discount_pct: float = Field(0, ge=0, le=100, alias="itemDiscountPct")
    manual_unit_price: Optional[float] = Field(None, ge=0, alias="manualUnitPrice")
    is_manual: bool = Field(False, alias="isManual")
    name: Optional[str] = None
    list_price: Optional[float] = Field(None, ge=0, alias="listPrice")
    brand: Optional[str] = None
    sku: Optional[str] = None

    model_config = {"populate_by_name": True}


class QuotationItem(BaseModel):
    product_id: str = Field(..., alias="productId")
    sku: str
    name: str
    brand: str
    series: Optional[str] = None
    color: Optional[str] = None
    list_price: int = Field(..., alias="listPrice")
    quantity: int = Field(1, ge=1)
    item_discount_pct: float = Field(0, ge=0, le=100, alias="itemDiscountPct")
    manual_unit_price: Optional[float] = Field(None, ge=0, alias="manualUnitPrice")
    is_manual: bool = Field(False, alias="isManual")
    line_totals: QuotationLineTotals = Field(default_factory=QuotationLineTotals, alias="lineTotals")

    model_config = {"populate_by_name": True}


class QuotationPricing(BaseModel):
    lp_subtotal: float = Field(0, alias="lpSubtotal")
    subtotal: float = 0
    overall_discount_pct: float = Field(0, ge=0, le=100, alias="overallDiscountPct")
    discounted_subtotal: float = Field(0, alias="discountedSubtotal")
    gst_mode: GstMode = Field(GstMode.EXCLUSIVE, alias="gstMode")
    gst_rate: float = Field(18.0, ge=0, le=100, alias="gstRate")
    gst_amount: float = Field(0, alias="gstAmount")
    grand_total: float = Field(0, alias="grandTotal")

    model_config = {"populate_by_name": True}


class QuotationBase(BaseModel):
    status: QuotationStatus = QuotationStatus.DRAFT
    customer: QuotationCustomer = Field(default_factory=QuotationCustomer)
    items: List[QuotationItem] = Field(default_factory=list)
    pricing: QuotationPricing = Field(default_factory=QuotationPricing)
    notes: Optional[str] = None

    model_config = {"populate_by_name": True}


class QuotationCreate(BaseModel):
    status: QuotationStatus = QuotationStatus.DRAFT
    customer: QuotationCustomer = Field(default_factory=QuotationCustomer)
    items: List[QuotationItemInput] = Field(default_factory=list)
    overall_discount_pct: float = Field(0, ge=0, le=100, alias="overallDiscountPct")
    gst_mode: GstMode = Field(GstMode.EXCLUSIVE, alias="gstMode")
    gst_rate: float = Field(18.0, ge=0, le=100, alias="gstRate")
    notes: Optional[str] = None

    model_config = {"populate_by_name": True}


class QuotationUpdate(BaseModel):
    status: Optional[QuotationStatus] = None
    customer: Optional[QuotationCustomer] = None
    items: Optional[List[QuotationItemInput]] = None
    overall_discount_pct: Optional[float] = Field(None, ge=0, le=100, alias="overallDiscountPct")
    gst_mode: Optional[GstMode] = Field(None, alias="gstMode")
    gst_rate: Optional[float] = Field(None, ge=0, le=100, alias="gstRate")
    notes: Optional[str] = None

    model_config = {"populate_by_name": True}


class QuotationInDB(QuotationBase):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    id: str = Field(..., alias="_id")
    quotation_number: str = Field(..., alias="quotationNumber")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    created_by: str = Field(..., alias="createdBy")


class QuotationListResponse(BaseModel):
    items: List[QuotationInDB]
    total: int
    page: int
    page_size: int = Field(..., alias="pageSize")

    model_config = {"populate_by_name": True}


class QuotationCategoryInfo(BaseModel):
    name: str
    product_count: int = Field(..., alias="productCount")

    model_config = {"populate_by_name": True}


class FacetOption(BaseModel):
    value: str
    count: int


class FacetField(BaseModel):
    key: str
    label: str
    options: List[FacetOption]


class FacetsResponse(BaseModel):
    category: str
    facets: List[FacetField]


class QuotationProductRow(BaseModel):
    id: str = Field(..., alias="_id")
    sku: str
    name: str
    brand: str
    category: Optional[str] = None
    series: Optional[str] = None
    list_price: int = Field(..., alias="listPrice")
    subcategory: Optional[str] = None
    specs: Dict[str, Any] = Field(default_factory=dict)
    color: Optional[str] = None

    model_config = {"populate_by_name": True}


class QuotationProductListResponse(BaseModel):
    items: List[QuotationProductRow]
    total: int
    page: int
    page_size: int = Field(..., alias="pageSize")

    model_config = {"populate_by_name": True}


class FrequentProductRow(BaseModel):
    product_id: str = Field(..., alias="productId")
    sku: str
    name: str
    brand: str
    list_price: int = Field(..., alias="listPrice")
    count: int = 0

    model_config = {"populate_by_name": True}
