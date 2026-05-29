"""Lightweight PDF parser for price-list updates (SKU + MRP only, no images)."""

from __future__ import annotations

import io
import logging
import re
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional

import pdfplumber

logger = logging.getLogger(__name__)

SKU_REGEX = re.compile(r"[A-Z]{1,3}\d{3,}[A-Z0-9]*")

MIN_PLAUSIBLE_PRICE = 50
MAX_PLAUSIBLE_PRICE = 500_000

# Cell must be essentially just a price (no product name / SKU mixed in)
PRICE_ONLY_CELL = re.compile(
    r"^\s*₹?\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(?:\.\d{1,2})?\s*$"
)
LINE_NUMBER = re.compile(r"(?<![\d,/])(\d{1,3}(?:,\d{3})*|\d+)(?![\d,/])")

PRICE_HEADER_KEYS = ("mrp", "price", "rate", "list", "inr", "amount", "dp", "distributor")


def _normalize_sku(sku: str) -> str:
    return (sku or "").strip().upper()


def _parse_price_token(text: str) -> Optional[int]:
    """Parse a cell/token that should contain only a price."""
    s = (text or "").strip()
    if not s or "/" in s:
        return None
    m = PRICE_ONLY_CELL.match(s)
    if m:
        val = int(m.group(1).replace(",", ""))
        return val if MIN_PLAUSIBLE_PRICE <= val <= MAX_PLAUSIBLE_PRICE else None
    cleaned = s.replace("₹", "").replace(",", "").strip()
    if cleaned.isdigit():
        val = int(cleaned)
        return val if MIN_PLAUSIBLE_PRICE <= val <= MAX_PLAUSIBLE_PRICE else None
    return None


def _sku_embedded_numbers(sku: str) -> set[int]:
    """Digit runs inside SKU that must not be treated as MRP."""
    out: set[int] = set()
    for m in re.finditer(r"\d+", sku):
        val = int(m.group())
        if val >= 10:
            out.add(val)
    return out


def _is_price_header(header: str) -> bool:
    h = (header or "").lower()
    if "module" in h or "pack" in h or "qty" in h or "std" in h:
        return False
    return any(k in h for k in PRICE_HEADER_KEYS)


def _is_description_header(header: str) -> bool:
    h = (header or "").lower()
    return any(k in h for k in ("description", "product", "item", "name"))


def _mask_sku_in_text(text: str, sku: str) -> str:
    masked = text
    for m in re.finditer(re.escape(sku), text, flags=re.I):
        masked = masked[: m.start()] + (" " * len(sku)) + masked[m.end() :]
    return masked


def _candidates_from_text(text: str, sku: str) -> List[int]:
    """Collect plausible MRP values from free text, preserving left-to-right order."""
    sku_nums = _sku_embedded_numbers(sku)
    masked = _mask_sku_in_text(text, sku)
    found: List[int] = []
    seen: set[int] = set()
    for m in LINE_NUMBER.finditer(masked):
        token = m.group(1)
        try:
            val = int(token.replace(",", ""))
        except ValueError:
            continue
        if val in sku_nums or val in seen:
            continue
        if MIN_PLAUSIBLE_PRICE <= val <= MAX_PLAUSIBLE_PRICE:
            found.append(val)
            seen.add(val)
    return found


def _candidates_from_cells(cells: List[str], headers: List[str], sku: str) -> List[int]:
    """Collect price candidates from table cells."""
    candidates: List[int] = []
    seen: set[int] = set()

    def add(val: Optional[int]) -> None:
        if val is not None and val not in seen:
            candidates.append(val)
            seen.add(val)

    # 1) Explicit price columns from headers
    for col_idx, cell in enumerate(cells):
        header = headers[col_idx] if col_idx < len(headers) else ""
        if _is_price_header(header):
            add(_parse_price_token(str(cell or "")))

    # 2) Cells that are price-only (no mixed description/SKU)
    for cell in cells:
        cell_str = str(cell or "").strip()
        if not cell_str or sku.upper() in cell_str.upper():
            continue
        if re.search(r"[a-zA-Z]", cell_str.replace("₹", "")):
            continue
        add(_parse_price_token(cell_str))

    # 3) Fallback: numbers from row text excluding SKU fragments
    joined = " | ".join(str(c or "") for c in cells)
    for val in _candidates_from_text(joined, sku):
        add(val)

    return candidates


def select_best_price(
    candidates: List[int],
    reference_price: Optional[int] = None,
) -> Optional[int]:
    """
    Pick the most likely MRP from candidates.

    When reference_price (existing DB list_price) is known, only accept a candidate
    within a reasonable band — price lists rarely jump 10x overnight.
    """
    if not candidates:
        return None

    if reference_price and reference_price >= MIN_PLAUSIBLE_PRICE:
        lo = reference_price * 0.45
        hi = reference_price * 2.2
        close = [p for p in candidates if lo <= p <= hi]
        if close:
            return min(close, key=lambda p: abs(p - reference_price))
        return None

    # No reference: MRP is usually the last standalone price on the row
    return candidates[-1]


def extract_price_from_row(
    cells: List[str],
    headers: List[str],
    sku: str,
    raw_line: str = "",
    reference_price: Optional[int] = None,
) -> Optional[int]:
    candidates = _candidates_from_cells(cells, headers, sku)
    if raw_line:
        for val in _candidates_from_text(raw_line, sku):
            if val not in candidates:
                candidates.append(val)
    return select_best_price(candidates, reference_price)


@dataclass
class PriceListRow:
    sku: str
    list_price: int
    name: str
    page_no: int
    raw_text: str
    price_candidates: List[int]


def _row_from_text(page_no: int, line_idx: int, line: str) -> Optional[PriceListRow]:
    stripped = (line or "").strip()
    if not stripped:
        return None
    sku_match = SKU_REGEX.search(stripped)
    if not sku_match:
        return None
    sku = sku_match.group(0)
    candidates = _candidates_from_text(stripped, sku)
    list_price = select_best_price(candidates)
    if list_price is None:
        return None

    name = stripped[: sku_match.start()].strip()
    if not name:
        remainder = stripped.replace(sku, "", 1).strip()
        name = re.sub(r"[\d₹,./\s]+$", "", remainder).strip()

    return PriceListRow(
        sku=sku,
        list_price=list_price,
        name=name,
        page_no=page_no,
        raw_text=stripped,
        price_candidates=candidates,
    )


def _row_from_table_cells(
    page_no: int,
    row_idx: int,
    cells: List[str],
    headers: List[str],
) -> Optional[PriceListRow]:
    joined = " | ".join(str(c or "") for c in cells)
    sku_match = SKU_REGEX.search(joined)
    if not sku_match:
        return None
    sku = sku_match.group(0)

    candidates = _candidates_from_cells(cells, headers, sku)
    list_price = select_best_price(candidates)
    if list_price is None:
        return None

    name = ""
    for col_idx, cell in enumerate(cells):
        header = headers[col_idx] if col_idx < len(headers) else ""
        cell_str = str(cell or "").strip()
        if _is_description_header(header) and cell_str:
            name = cell_str
            break
    if not name:
        for cell in cells:
            cell_str = str(cell or "").strip()
            if not cell_str or sku.upper() in cell_str.upper():
                continue
            if _parse_price_token(cell_str) is not None:
                continue
            if re.fullmatch(r"[\d\s,/]+", cell_str):
                continue
            name = cell_str
            break

    return PriceListRow(
        sku=sku,
        list_price=list_price,
        name=name,
        page_no=page_no,
        raw_text=joined,
        price_candidates=candidates,
    )


def refine_price_with_reference(row: PriceListRow, reference_price: int) -> Optional[int]:
    """Re-pick MRP using DB price as anchor (called during SKU matching)."""
    return select_best_price(row.price_candidates, reference_price)


def parse_price_list_pdf(
    pdf_bytes: bytes,
    *,
    progress_callback: Optional[Callable[[int, int, str, str], None]] = None,
) -> List[PriceListRow]:
    """
    Extract SKU + list price rows from a price-list PDF.

    Deduplicates by normalized SKU. Table rows take priority over plain text.
    """
    by_sku: Dict[str, PriceListRow] = {}
    table_skus: set[str] = set()

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        total_pages = len(pdf.pages)
        logger.info("parse_price_list_pdf: %d pages", total_pages)
        if progress_callback:
            progress_callback(0, total_pages, "parsing", f"Parsing {total_pages} pages...")

        for page_index, page in enumerate(pdf.pages):
            page_no = page_index + 1
            if progress_callback:
                progress_callback(page_no, total_pages, "parsing", f"Page {page_no} of {total_pages}")

            try:
                tables = page.extract_tables() or []
            except Exception as exc:
                logger.warning("parse_price_list_pdf: page %d tables failed: %s", page_no, exc)
                tables = []

            for table in tables:
                if not table:
                    continue
                headers = [str(h or "").strip().lower() for h in table[0]]
                body = table[1:] if any(headers) else table
                for row_idx, row in enumerate(body):
                    parsed = _row_from_table_cells(page_no, row_idx, list(row), headers)
                    if parsed:
                        norm = _normalize_sku(parsed.sku)
                        by_sku[norm] = parsed
                        table_skus.add(norm)

            text = page.extract_text() or ""
            for line_idx, line in enumerate(text.splitlines()):
                parsed = _row_from_text(page_no, line_idx, line)
                if not parsed:
                    continue
                norm = _normalize_sku(parsed.sku)
                if norm in table_skus:
                    continue
                by_sku[norm] = parsed

    rows = list(by_sku.values())
    logger.info("parse_price_list_pdf: extracted %d unique SKUs", len(rows))
    if progress_callback:
        progress_callback(total_pages, total_pages, "complete", f"Found {len(rows)} SKUs")
    return rows
