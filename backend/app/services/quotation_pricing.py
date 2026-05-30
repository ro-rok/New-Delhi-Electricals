"""
Quotation pricing calculations (server source of truth on save).

Rules:
1. Line LP total = list_price * quantity
2. Line selling unit = manual_unit_price ?? list_price * (1 - item_discount_pct/100)
3. Line amount = line_selling_unit * quantity
4. Subtotal = sum(line amounts); LP subtotal = sum(LP totals)
5. Discounted subtotal = subtotal * (1 - overall_discount_pct/100)
6. GST exclusive: gst = discounted * rate/100; grand = discounted + gst
7. GST inclusive: grand = discounted; gst extracted from grand
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ..schemas.quotation import (
    GstMode,
    QuotationItem,
    QuotationItemInput,
    QuotationLineTotals,
    QuotationPricing,
)


def _effective_unit_price(
    list_price: float,
    item_discount_pct: float,
    manual_unit_price: Optional[float],
) -> float:
    if manual_unit_price is not None:
        return float(manual_unit_price)
    return list_price * (1.0 - item_discount_pct / 100.0)


def compute_line_totals(
    list_price: float,
    quantity: int,
    item_discount_pct: float,
    manual_unit_price: Optional[float],
) -> QuotationLineTotals:
    lp_total = list_price * quantity
    line_selling_unit = _effective_unit_price(list_price, item_discount_pct, manual_unit_price)
    line_amount = line_selling_unit * quantity
    return QuotationLineTotals(
        lp_total=round(lp_total, 2),
        line_selling_unit=round(line_selling_unit, 2),
        line_amount=round(line_amount, 2),
    )


def build_quotation_item(
    *,
    product_id: str,
    sku: str,
    name: str,
    brand: str,
    list_price: int,
    quantity: int,
    item_discount_pct: float = 0,
    manual_unit_price: Optional[float] = None,
    series: Optional[str] = None,
    color: Optional[str] = None,
    is_manual: bool = False,
) -> QuotationItem:
    line_totals = compute_line_totals(
        float(list_price), quantity, item_discount_pct, manual_unit_price
    )
    return QuotationItem(
        product_id=product_id,
        sku=sku,
        name=name,
        brand=brand,
        series=series,
        color=color,
        list_price=list_price,
        quantity=quantity,
        item_discount_pct=item_discount_pct,
        manual_unit_price=manual_unit_price,
        is_manual=is_manual,
        line_totals=line_totals,
    )


def compute_pricing(
    items: List[QuotationItem],
    overall_discount_pct: float,
    gst_mode: GstMode,
    gst_rate: float,
) -> QuotationPricing:
    lp_subtotal = sum(i.line_totals.lp_total for i in items)
    subtotal = sum(i.line_totals.line_amount for i in items)
    discounted_subtotal = subtotal * (1.0 - overall_discount_pct / 100.0)
    discounted_subtotal = round(discounted_subtotal, 2)

    if gst_mode == GstMode.EXCLUSIVE:
        gst_amount = round(discounted_subtotal * gst_rate / 100.0, 2)
        grand_total = round(discounted_subtotal + gst_amount, 2)
    else:
        # Inclusive: discounted_subtotal is tax-inclusive grand total
        grand_total = discounted_subtotal
        if gst_rate > 0:
            gst_amount = round(grand_total - grand_total / (1.0 + gst_rate / 100.0), 2)
        else:
            gst_amount = 0.0

    return QuotationPricing(
        lp_subtotal=round(lp_subtotal, 2),
        subtotal=round(subtotal, 2),
        overall_discount_pct=overall_discount_pct,
        discounted_subtotal=discounted_subtotal,
        gst_mode=gst_mode,
        gst_rate=gst_rate,
        gst_amount=gst_amount,
        grand_total=grand_total,
    )


def extract_color_from_specs(specs: Dict[str, Any]) -> Optional[str]:
    if not specs:
        return None
    color = specs.get("color")
    if color is not None:
        return str(color)
    return None
