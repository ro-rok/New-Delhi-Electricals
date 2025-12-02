from __future__ import annotations

import io
import logging
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence, Tuple

import fitz  # PyMuPDF
import pdfplumber
import pytesseract  # type: ignore[import]
from PIL import Image  # type: ignore[import]

from ..schemas import CatalogImportRow, ImageCandidate


logger = logging.getLogger(__name__)


SKU_REGEX = re.compile(r"[A-Z]{1,3}\d{3,}[A-Z0-9]*")
PRICE_REGEX = re.compile(r"\d[\d,]*")


@dataclass
class PageImage:
    page_no: int
    bytes: bytes
    bbox: Optional[Tuple[float, float, float, float]] = None


@dataclass
class ParsedRow:
    row_id: str
    sku: str
    name: str
    brand: Optional[str]
    category: Optional[str]
    series: Optional[str]
    list_price: int
    currency: str
    page_no: int
    confidence_score: float
    raw_text: str
    specs: Dict[str, Any]
    image_candidates: List[ImageCandidate]
    variant_group_key: Optional[str]


def _extract_page_images(pdf_bytes: bytes) -> List[PageImage]:
    """Step A: extract page renderings and embedded raster images."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images: List[PageImage] = []
    for page_index in range(len(doc)):
        page = doc[page_index]
        # Full-page rasterisation as a fallback image for the page
        pix = page.get_pixmap()
        images.append(
            PageImage(page_no=page_index + 1, bytes=pix.tobytes("png"), bbox=None)
        )
        # Embedded images (if any)
        for img in page.get_images(full=True):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            images.append(
                PageImage(
                    page_no=page_index + 1,
                    bytes=image_bytes,
                    bbox=None,  # could be enriched with layout info later
                )
            )
    return images


def _safe_int_from_price(cell: str) -> Optional[int]:
    match = PRICE_REGEX.search(cell or "")
    if not match:
        return None
    number = match.group(0).replace(",", "")
    try:
        return int(number)
    except ValueError:
        return None


def _parse_specs_from_text(text: str) -> Dict[str, Any]:
    """Very simple heuristics for specs like 10AX, 1M, 2M, colors, ampere ratings."""
    specs: Dict[str, Any] = {}
    lowered = text.lower()
    if "10ax" in lowered:
        specs["rating"] = "10AX"
    rating_match = re.search(r"(\d+)\s*a(?![a-z])", lowered)
    if rating_match:
        specs["rating"] = f"{rating_match.group(1)}A"
    modules_match = re.search(r"(\d+)\s*m(?![a-z])", lowered)
    if modules_match:
        specs["modules"] = modules_match.group(1)
    for color in ["white", "black", "grey", "gray", "silver", "gold"]:
        if color in lowered:
            specs["color"] = color
            break
    return specs


def _compute_confidence(
    *,
    has_sku: bool,
    has_price: bool,
    has_brand: bool,
    has_specs: bool,
    columns_consistent: bool,
) -> float:
    score = 0.0
    if has_sku:
        score += 0.4
    if has_price:
        score += 0.2
    if has_brand:
        score += 0.15
    if columns_consistent:
        score += 0.1
    if has_specs:
        score += 0.15
    if score > 1.0:
        score = 1.0
    return score


def _group_rows_into_variants(rows: Sequence[ParsedRow]) -> None:
    """Assign a simple variant_group_key for rows that share base name/series."""
    groups: Dict[Tuple[str, Optional[str]], List[ParsedRow]] = {}
    for row in rows:
        key = (row.name.strip().lower(), (row.series or "").strip().lower())
        groups.setdefault(key, []).append(row)
    for key, group in groups.items():
        if len(group) < 2:
            continue
        group_key = f"{key[0]}::{key[1]}" if key[1] else key[0]
        for row in group:
            row.variant_group_key = group_key


def _ocr_page_text_from_images(
    page_no: int, page_images: Sequence[PageImage]
) -> str:
    """
    OCR the first full-page image for a given page.

    Many vendor PDFs are scanned catalogs where text is not selectable; this
    helper lets us fall back to OCR when pdfplumber can't see any tables.
    """
    for img in page_images:
        if img.page_no != page_no:
            continue
        try:
            image = Image.open(io.BytesIO(img.bytes))
        except Exception:
            continue
        try:
            text = pytesseract.image_to_string(image)
        except Exception:
            text = ""
        if text.strip():
            return text
    return ""


def _parse_rows_from_ocr_text(
    page_no: int,
    text: str,
    *,
    default_brand: Optional[str],
    default_category: Optional[str],
) -> List[ParsedRow]:
    """
    Very simple OCR-based row extractor.

    Heuristics tailored for price-list style lines like:
      \"6A C Curve 1 BA10060C 211 1/12\"
    """
    rows: List[ParsedRow] = []
    for line_idx, raw_line in enumerate(text.splitlines()):
        line = (raw_line or "").strip()
        if not line:
            continue
        sku_match = SKU_REGEX.search(line)
        if not sku_match:
            continue
        sku = sku_match.group(0)

        # Name/description: text before the SKU
        name = line[: sku_match.start()].strip()
        if not name:
            # fallback: remove SKU token and use remaining text
            name = line.replace(sku, "").strip()

        list_price = _safe_int_from_price(line)
        if list_price is None:
            # If we can't confidently see a price, skip to keep noise low
            continue

        specs = _parse_specs_from_text(line)
        has_brand = default_brand is not None
        has_specs = bool(specs)
        confidence = _compute_confidence(
            has_sku=True,
            has_price=True,
            has_brand=has_brand,
            has_specs=has_specs,
            columns_consistent=False,
        )

        rows.append(
            ParsedRow(
                row_id=f"{page_no}-ocr-{line_idx}",
                sku=sku,
                name=name,
                brand=default_brand,
                category=default_category,
                series=None,
                list_price=list_price,
                currency="INR",
                page_no=page_no,
                confidence_score=confidence,
                raw_text=line,
                specs=specs,
                image_candidates=[],
                variant_group_key=None,
            )
        )

    return rows


def _map_images_to_rows(
    page_images: Sequence[PageImage], rows: Sequence[ParsedRow]
) -> None:
    """
    Step E: associate images to rows on the same page based on simple OCR and keyword match.

    This is intentionally simple: OCR the image and look for SKU/name tokens.
    """
    for img in page_images:
        try:
            image = Image.open(io.BytesIO(img.bytes))
        except Exception:
            continue
        try:
            text = pytesseract.image_to_string(image)
        except Exception:
            text = ""
        lowered = text.lower()
        for row in rows:
            if row.page_no != img.page_no:
                continue
            # Very lightweight matching on sku or name tokens
            match_score = 0.0
            if row.sku and row.sku.lower() in lowered:
                match_score += 0.6
            name_token = row.name.split(" ")[0].lower() if row.name else ""
            if name_token and name_token in lowered:
                match_score += 0.3
            if match_score == 0.0:
                continue
            # URL will be filled after upload; keep a placeholder structure for now
            row.image_candidates.append(
                ImageCandidate(
                    url="",  # to be replaced with Cloudinary URL by caller
                    source="pdf_page",
                    score=match_score,
                )
            )


def parse_catalog_pdf(
    pdf_bytes: bytes,
    file_name: str,
    *,
    default_brand: Optional[str] = None,
    default_category: Optional[str] = None,
) -> Tuple[List[ParsedRow], List[PageImage]]:
    """
    High-level parsing pipeline for catalog PDFs.

    Returns a tuple of (parsed_rows, page_images) where:
      - parsed_rows is a list of ParsedRow objects with confidence scores.
      - page_images is a list of PageImage to be uploaded and mapped to rows.
    """
    logger.info("parse_catalog_pdf: start file=%s bytes=%d", file_name, len(pdf_bytes))
    # Step A: extract images
    page_images = _extract_page_images(pdf_bytes)
    logger.info("parse_catalog_pdf: extracted %d page images", len(page_images))

    parsed_rows: List[ParsedRow] = []

    # Step B & C: table extraction and row detection (text-based)
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        total_pages = len(pdf.pages)
        logger.info("parse_catalog_pdf: document has %d pages", total_pages)
        for page_index, page in enumerate(pdf.pages):
            page_no = page_index + 1
            page_rows_before = len(parsed_rows)
            try:
                tables = page.extract_tables()
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("parse_catalog_pdf: page %d table extraction failed: %s", page_no, exc)
                tables = []
            columns_consistent = len(tables) > 0
            logger.info(
                "parse_catalog_pdf: page %d/%d tables=%d", page_no, total_pages, len(tables)
            )
            for table in tables:
                # Assume first row might be header
                if not table:
                    continue
                headers = [h.strip().lower() if isinstance(h, str) else "" for h in table[0]]
                body_rows = table[1:] if headers else table
                for row_idx, row in enumerate(body_rows):
                    cells = [c or "" for c in row]
                    joined_text = " | ".join(cells)
                    sku_match = SKU_REGEX.search(joined_text)
                    if not sku_match:
                        continue
                    sku = sku_match.group(0)
                    # Very rough heuristics to pick description and price columns
                    name = ""
                    list_price: Optional[int] = None
                    for col_idx, cell in enumerate(cells):
                        header = headers[col_idx] if col_idx < len(headers) else ""
                        header_lower = header.lower()
                        if (not name) and ("description" in header_lower or "product" in header_lower):
                            name = str(cell).strip()
                        if (
                            list_price is None
                            and ("mrp" in header_lower or "price" in header_lower or "inr" in header_lower)
                        ):
                            list_price = _safe_int_from_price(str(cell))
                    if not name:
                        # fallback: first non-sku, non-empty cell
                        for cell in cells:
                            if sku in str(cell):
                                continue
                            if str(cell).strip():
                                name = str(cell).strip()
                                break
                    if list_price is None:
                        # last numeric-ish cell fallback
                        for cell in reversed(cells):
                            list_price = _safe_int_from_price(str(cell))
                            if list_price is not None:
                                break
                    if list_price is None:
                        # require a price to keep noise low
                        continue
                    specs = _parse_specs_from_text(joined_text)
                    has_brand = default_brand is not None
                    has_specs = bool(specs)
                    confidence = _compute_confidence(
                        has_sku=True,
                        has_price=True,
                        has_brand=has_brand,
                        has_specs=has_specs,
                        columns_consistent=columns_consistent,
                    )
                    parsed_rows.append(
                        ParsedRow(
                            row_id=f"{page_no}-{row_idx}",
                            sku=sku,
                            name=name,
                            brand=default_brand,
                            category=default_category,
                            series=None,
                            list_price=list_price,
                            currency="INR",
                            page_no=page_no,
                            confidence_score=confidence,
                            raw_text=joined_text,
                            specs=specs,
                            image_candidates=[],
                            variant_group_key=None,
                        )
                    )

            rows_after_tables = len(parsed_rows)
            if rows_after_tables > page_rows_before:
                logger.info(
                    "parse_catalog_pdf: page %d extracted %d rows from tables",
                    page_no,
                    rows_after_tables - page_rows_before,
                )

            # If we couldn't find any structured table rows for this page,
            # fall back to OCR-only extraction.
            if len(parsed_rows) == page_rows_before:
                ocr_text = _ocr_page_text_from_images(page_no, page_images)
                if ocr_text:
                    ocr_rows = _parse_rows_from_ocr_text(
                        page_no,
                        ocr_text,
                        default_brand=default_brand,
                        default_category=default_category,
                    )
                    parsed_rows.extend(ocr_rows)
                    if ocr_rows:
                        logger.info(
                            "parse_catalog_pdf: page %d used OCR fallback, extracted %d rows",
                            page_no,
                            len(ocr_rows),
                        )
                else:
                    logger.info(
                        "parse_catalog_pdf: page %d no tables and OCR text empty; no rows extracted",
                        page_no,
                    )

    # Step D: variant grouping
    _group_rows_into_variants(parsed_rows)

    # Step E: map images to rows (placeholders; URLs will be filled by caller)
    _map_images_to_rows(page_images, parsed_rows)

    logger.info(
        "parse_catalog_pdf: finished file=%s total_rows=%d page_images=%d",
        file_name,
        len(parsed_rows),
        len(page_images),
    )

    return parsed_rows, page_images


def stub_web_image_search(
    brand: Optional[str], sku: str, name: str
) -> List[ImageCandidate]:
    """
    Step F: Stub for future integration with Bing/Google image search.

    For now this just returns an empty list and documents how to extend it.
    """
    _ = (brand, sku, name)
    return []



