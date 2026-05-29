"""Generate quotation PDF bytes using fpdf2."""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import Any, Dict, List

from fpdf import FPDF


COMPANY_NAME = "New Delhi Electricals"
COMPANY_TAGLINE = "Electrical Products & Solutions"


class QuotationPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.cell(0, 10, COMPANY_NAME, ln=True, align="C")
        self.set_font("Helvetica", "", 10)
        self.cell(0, 6, COMPANY_TAGLINE, ln=True, align="C")
        self.ln(4)


def _safe_text(text: str, max_len: int = 80) -> str:
    if not text:
        return ""
    # fpdf core fonts are latin-1; replace unsupported chars
    cleaned = str(text).encode("latin-1", errors="replace").decode("latin-1")
    return cleaned[:max_len]


def _get_line_totals(item: Dict[str, Any]) -> Dict[str, Any]:
    lt = item.get("line_totals") or item.get("lineTotals")
    return lt if isinstance(lt, dict) else {}


def _item_rate_and_amount(item: Dict[str, Any]) -> tuple[float, float]:
    lt = _get_line_totals(item)
    rate = lt.get("line_selling_unit", lt.get("lineSellingUnit"))
    amount = lt.get("line_amount", lt.get("lineAmount"))
    if rate is not None and amount is not None:
        return float(rate), float(amount)

    list_price = float(item.get("list_price") or item.get("listPrice") or 0)
    quantity = int(item.get("quantity") or 1)
    disc = float(item.get("item_discount_pct") or item.get("itemDiscountPct") or 0)
    manual = item.get("manual_unit_price", item.get("manualUnitPrice"))
    if manual is not None:
        rate_f = float(manual)
    else:
        rate_f = list_price * (1.0 - disc / 100.0)
    return rate_f, rate_f * quantity


def _item_field(item: Dict[str, Any], *keys: str, default: Any = "") -> Any:
    for key in keys:
        if key in item and item[key] is not None:
            return item[key]
    return default


def generate_quotation_pdf(quotation: Dict[str, Any]) -> bytes:
    pdf = QuotationPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    qnum = _safe_text(quotation.get("quotation_number", ""))
    status = _safe_text(quotation.get("status", "draft"))
    created = quotation.get("created_at")
    if isinstance(created, datetime):
        date_str = created.strftime("%d-%m-%Y")
    else:
        date_str = _safe_text(str(created or ""))[:10]

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, f"Quotation: {qnum}", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Date: {date_str}  |  Status: {status.upper()}", ln=True)
    pdf.ln(4)

    customer = quotation.get("customer") or {}
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "Customer Details", ln=True)
    pdf.set_font("Helvetica", "", 9)
    for label, key in [
        ("Name", "name"),
        ("Phone", "phone"),
        ("GST", "gst_number"),
        ("Address", "address"),
    ]:
        val = customer.get(key) or customer.get(key.replace("_", ""), "")
        if val:
            pdf.cell(0, 5, f"{label}: {_safe_text(str(val), 120)}", ln=True)
    pdf.ln(4)

    items: List[Dict[str, Any]] = quotation.get("items") or []
    # A4 usable width ~190mm
    col_widths = [20, 42, 16, 11, 16, 16, 20, 13]
    headers = ["SKU", "Product", "Brand", "Qty", "LP", "Rate", "Amount", "Disc%"]

    pdf.set_font("Helvetica", "B", 7)
    for i, h in enumerate(headers):
        pdf.cell(col_widths[i], 7, h, border=1, align="C")
    pdf.ln()

    pdf.set_font("Helvetica", "", 7)
    for item in items:
        rate, amount = _item_rate_and_amount(item)
        disc = float(_item_field(item, "item_discount_pct", "itemDiscountPct", default=0))
        list_price = float(_item_field(item, "list_price", "listPrice", default=0))
        row = [
            _safe_text(str(_item_field(item, "sku", default="")), 16),
            _safe_text(str(_item_field(item, "name", default="")), 36),
            _safe_text(str(_item_field(item, "brand", default="")), 12),
            str(_item_field(item, "quantity", default=1)),
            f"{list_price:.2f}",
            f"{rate:.2f}",
            f"{amount:.2f}",
            f"{disc:.0f}",
        ]
        for i, val in enumerate(row):
            pdf.cell(col_widths[i], 6, val, border=1)
        pdf.ln()

    pdf.ln(6)
    pricing = quotation.get("pricing") or {}
    pdf.set_font("Helvetica", "", 10)

    def line(label: str, value: float, bold: bool = False):
        pdf.set_font("Helvetica", "B" if bold else "", 10)
        pdf.cell(130, 7, label, align="R")
        pdf.cell(50, 7, f"INR {value:,.2f}", align="R", ln=True)

    line("LP Subtotal:", float(pricing.get("lp_subtotal") or pricing.get("lpSubtotal", 0)))
    line("Subtotal:", float(pricing.get("subtotal", 0)))
    odp = float(pricing.get("overall_discount_pct") or pricing.get("overallDiscountPct", 0))
    if odp > 0:
        line(f"Overall Discount ({odp:.1f}%):", float(pricing.get("discounted_subtotal") or pricing.get("discountedSubtotal", 0)))
    else:
        line("Discounted Subtotal:", float(pricing.get("discounted_subtotal") or pricing.get("discountedSubtotal", 0)))
    gst_mode = pricing.get("gst_mode") or pricing.get("gstMode", "exclusive")
    gst_rate = float(pricing.get("gst_rate") or pricing.get("gstRate", 18))
    line(f"GST ({gst_rate:.0f}% {gst_mode}):", float(pricing.get("gst_amount") or pricing.get("gstAmount", 0)))
    line("Grand Total:", float(pricing.get("grand_total") or pricing.get("grandTotal", 0)), bold=True)

    notes = quotation.get("notes")
    if notes:
        pdf.ln(6)
        pdf.set_font("Helvetica", "I", 9)
        pdf.multi_cell(0, 5, f"Notes: {_safe_text(str(notes), 500)}")

    pdf.ln(8)
    pdf.set_font("Helvetica", "I", 8)
    pdf.cell(0, 5, "Thank you for your business. Prices subject to stock availability.", ln=True)

    buf = BytesIO()
    pdf.output(buf)
    return buf.getvalue()
