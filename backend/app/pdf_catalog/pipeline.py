from __future__ import annotations

import argparse
import io
import os
import re
from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import pdfplumber
import pytesseract  # type: ignore[import]
from PIL import Image  # type: ignore[import]

from ..cloudinary_client import upload_image_bytes
from ..parsing.catalog_parser import (  # type: ignore[import]
    PageImage,
    _extract_page_images,
    _ocr_page_text_from_images,
)
from .models import (
    CatalogRoot,
    CategoryNode,
    ImageIndexEntry,
    ImageRef,
    InlineImageRef,
    Item,
    SubcategoryNode,
    Variant,
    VariantAttributes,
    make_source_meta,
    serialize_catalog_root,
)

try:  # Camelot is optional but recommended
    import camelot  # type: ignore[import]

    _HAS_CAMELOT = True
except Exception:  # pragma: no cover - optional dependency
    camelot = None  # type: ignore[assignment]
    _HAS_CAMELOT = False

try:
    import pandas as pd  # type: ignore[import]

    _HAS_PANDAS = True
except Exception:  # pragma: no cover - optional dependency
    pd = None  # type: ignore[assignment]
    _HAS_PANDAS = False

@dataclass
class ParsedRow:
    page_no: int
    source: str  # lattice | stream | plumber | ocr
    raw_cells: List[str]
    raw_line: str
    category: str
    subcategory: str
    name: str
    description: str
    cat_no: Optional[str]
    mrp_in: Optional[int]
    std_pack: Optional[str]
    module_width: Optional[int]
    current_rating_a: Optional[int]
    poles: Optional[str]
    color: Optional[str]
    finish: Optional[str]
    rating_text: Optional[str]
    confidence: float

CATEGORY_KEYWORDS = [
    "switch",
    "mcbs",
    "mcb",
    "rcbo",
    "isolator",
    "distribution",
    "db",
    "tripbox",
    "dimme",
    "fan regulator",
    "socket",
    "cover plate",
]

COLOR_TOKENS = [
    "white",
    "snow white",
    "grey",
    "gray",
    "black",
    "wood",
    "onyx",
    "marble",
    "silver",
    "gold",
]

def _tokenize(text: str) -> List[str]:
    return re.findall(r"[A-Za-z0-9/+-]+", text or "")

def _extract_price(tokens: Sequence[str]) -> Tuple[Optional[int], Optional[int]]:
    """
    Return (price, index) where price is an integer MRP and index is token position.
    Skip tokens that look like ratings (6AX, 10A, etc).
    """
    price_idx: Optional[int] = None
    price_val: Optional[int] = None
    for idx, tok in enumerate(tokens):
        cleaned = tok.replace(",", "")
        if not re.fullmatch(r"\d{2,}", cleaned):
            continue
        # Skip ratings like 10A, 6AX, etc.
        if idx + 1 < len(tokens) and re.fullmatch(r"[aA][xX]?|[aA]", tokens[idx + 1]):
            continue
        try:
            val = int(cleaned)
        except ValueError:
            continue
        price_idx = idx
        price_val = val
    return price_val, price_idx

def _looks_like_cat_no(token: str) -> bool:
    if len(token) < 4:
        return False
    has_alpha = any(c.isalpha() for c in token)
    has_digit = any(c.isdigit() for c in token)
    return has_alpha and has_digit

def _extract_cat_no(tokens: Sequence[str], price_idx: Optional[int]) -> Tuple[Optional[str], Optional[int]]:
    candidates: List[Tuple[int, str]] = []
    for idx, tok in enumerate(tokens):
        if _looks_like_cat_no(tok):
            candidates.append((idx, tok))
    if not candidates:
        return None, None
    if price_idx is None:
        return candidates[0][1], candidates[0][0]
    # choose candidate closest to price index
    best = min(candidates, key=lambda c: abs(c[0] - price_idx))
    return best[1], best[0]

def _extract_std_pack(tokens: Sequence[str]) -> Optional[str]:
    for tok in tokens:
        if re.fullmatch(r"\d+/\d+", tok):
            return tok
    return None

def _extract_module_width(tokens: Sequence[str]) -> Optional[int]:
    for tok in tokens:
        m = re.fullmatch(r"(\d+)M", tok.upper())
        if m:
            return int(m.group(1))
    return None

def _extract_current_rating(tokens: Sequence[str]) -> Tuple[Optional[int], Optional[str]]:
    for tok in tokens:
        t = tok.upper()
        if re.fullmatch(r"\d+AX", t):
            try:
                return int(re.match(r"(\d+)", t).group(1)), t  # type: ignore[union-attr]
            except Exception:
                return None, t
        if re.fullmatch(r"\d+A", t):
            try:
                return int(re.match(r"(\d+)", t).group(1)), t  # type: ignore[union-attr]
            except Exception:
                return None, t
    return None, None

def _extract_poles(tokens: Sequence[str]) -> Optional[str]:
    for tok in tokens:
        t = tok.upper()
        if t in {"1P", "2P", "3P", "4P"}:
            return t
        if t in {"SP", "DP", "TP", "FP"}:
            return t
    return None

def _extract_color_finish(text: str) -> Tuple[Optional[str], Optional[str]]:
    lowered = text.lower()
    for c in COLOR_TOKENS:
        if c in lowered:
            return c.title(), None
    return None, None

def _compute_confidence(source: str, has_cat_no: bool, has_price: bool) -> float:
    base = {
        "lattice": 0.95,
        "stream": 0.85,
        "plumber": 0.8,
        "ocr": 0.6,
    }.get(source, 0.7)
    if not has_cat_no:
        base -= 0.2
    if not has_price:
        base -= 0.2
    if base < 0.2:
        base = 0.2
    if base > 1.0:
        base = 1.0
    return base

def _detect_headings_for_page(page_text: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Heuristic heading detector: big uppercase lines and known keywords.
    """
    lines = [ln.strip() for ln in (page_text or "").splitlines() if ln.strip()]
    if not lines:
        return None, None

    candidate_category: Optional[str] = None
    candidate_subcategory: Optional[str] = None

    for ln in lines:
        alpha = sum(1 for c in ln if c.isalpha())
        upper = sum(1 for c in ln if c.isupper())
        if alpha >= 3 and upper >= alpha * 0.7:
            if candidate_category is None:
                candidate_category = ln.title()
                continue
            if candidate_subcategory is None:
                candidate_subcategory = ln.title()
                break

    if candidate_category is None:
        # try keyword-based
        for ln in lines:
            lower = ln.lower()
            if any(k in lower for k in CATEGORY_KEYWORDS):
                candidate_category = ln.title()
                break

    return candidate_category, candidate_subcategory

def _extract_tables_for_page(pdf_path: str, page_no: int) -> Tuple[List[List[str]], str]:
    """
    Returns a list of rows, each as list of cell strings, and the table source type.
    """
    rows: List[List[str]] = []
    source = "plumber"

    if _HAS_CAMELOT:
        try:
            tables = camelot.read_pdf(pdf_path, pages=str(page_no), flavor="lattice")  # type: ignore[arg-type]
            if tables:
                source = "lattice"
                for t in tables:
                    df = t.df
                    for r_idx in range(1, len(df.index)):  # skip header row
                        row_cells = [str(x or "").strip() for x in df.iloc[r_idx].tolist()]
                        if any(c for c in row_cells):
                            rows.append(row_cells)
            if not rows:
                tables = camelot.read_pdf(pdf_path, pages=str(page_no), flavor="stream")  # type: ignore[arg-type]
                if tables:
                    source = "stream"
                    for t in tables:
                        df = t.df
                        for r_idx in range(1, len(df.index)):
                            row_cells = [str(x or "").strip() for x in df.iloc[r_idx].tolist()]
                            if any(c for c in row_cells):
                                rows.append(row_cells)
        except Exception:
            rows = []

    if rows:
        return rows, source

    # Fallback to pdfplumber tables
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[page_no - 1]
        try:
            plumber_tables = page.extract_tables() or []
        except Exception:
            plumber_tables = []
        for table in plumber_tables:
            if not table:
                continue
            body_rows = table[1:] if len(table) > 1 else table
            for tr in body_rows:
                row_cells = [str(c or "").strip() for c in tr]
                if any(c for c in row_cells):
                    rows.append(row_cells)
    return rows, "plumber"

def _parse_row_from_cells(
    page_no: int,
    cells: Sequence[str],
    source: str,
    category: str,
    subcategory: str,
) -> Optional[ParsedRow]:
    joined = " ".join(c for c in cells if c)
    tokens = _tokenize(joined)
    if not tokens:
        return None

    price, price_idx = _extract_price(tokens)
    cat_no, cat_idx = _extract_cat_no(tokens, price_idx)
    std_pack = _extract_std_pack(tokens)
    module_width = _extract_module_width(tokens)
    current_rating_a, rating_text = _extract_current_rating(tokens)
    poles = _extract_poles(tokens)
    color, finish = _extract_color_finish(joined)

    # Build description from tokens excluding obvious structural fields
    exclude_indices = set()
    if price_idx is not None:
        exclude_indices.add(price_idx)
    if cat_idx is not None:
        exclude_indices.add(cat_idx)
    desc_tokens: List[str] = []
    for idx, tok in enumerate(tokens):
        if idx in exclude_indices:
            continue
        if tok == std_pack:
            continue
        if re.fullmatch(r"\d+M", tok.upper()):
            continue
        if tok.upper() in {"1P", "2P", "3P", "4P", "SP", "DP", "TP", "FP"}:
            continue
        desc_tokens.append(tok)
    description = " ".join(desc_tokens).strip()
    if not description:
        description = joined
    name = description

    confidence = _compute_confidence(source, has_cat_no=cat_no is not None, has_price=price is not None)

    return ParsedRow(
        page_no=page_no,
        source=source,
        raw_cells=list(cells),
        raw_line=joined,
        category=category,
        subcategory=subcategory,
        name=name,
        description=description,
        cat_no=cat_no,
        mrp_in=price,
        std_pack=std_pack,
        module_width=module_width,
        current_rating_a=current_rating_a,
        poles=poles,
        color=color,
        finish=finish,
        rating_text=rating_text,
        confidence=confidence,
    )

def _parse_rows_from_ocr_text(
    page_no: int,
    text: str,
    category: str,
    subcategory: str,
) -> List[ParsedRow]:
    rows: List[ParsedRow] = []
    for line in (text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        tokens = _tokenize(line)
        if not tokens:
            continue
        price, price_idx = _extract_price(tokens)
        cat_no, cat_idx = _extract_cat_no(tokens, price_idx)
        if not cat_no and not price:
            continue
        std_pack = _extract_std_pack(tokens)
        module_width = _extract_module_width(tokens)
        current_rating_a, rating_text = _extract_current_rating(tokens)
        poles = _extract_poles(tokens)
        color, finish = _extract_color_finish(line)

        exclude_indices = set()
        if price_idx is not None:
            exclude_indices.add(price_idx)
        if cat_idx is not None:
            exclude_indices.add(cat_idx)
        desc_tokens = [tok for idx, tok in enumerate(tokens) if idx not in exclude_indices]
        description = " ".join(desc_tokens).strip() or line
        name = description

        confidence = _compute_confidence("ocr", has_cat_no=cat_no is not None, has_price=price is not None)
        rows.append(
            ParsedRow(
                page_no=page_no,
                source="ocr",
                raw_cells=[line],
                raw_line=line,
                category=category,
                subcategory=subcategory,
                name=name,
                description=description,
                cat_no=cat_no,
                mrp_in=price,
                std_pack=std_pack,
                module_width=module_width,
                current_rating_a=current_rating_a,
                poles=poles,
                color=color,
                finish=finish,
                rating_text=rating_text,
                confidence=confidence,
            )
        )
    return rows

def _ensure_output_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)

def _save_images_and_ocr(
    pdf_filename: str,
    page_images: Sequence[PageImage],
    images_dir: str,
) -> Tuple[List[ImageIndexEntry], Dict[Tuple[int, str], str]]:
    """
    Save images to disk and OCR them; return images_index and a map (page, filename)->ocr_text.
    """
    _ensure_output_dir(images_dir)
    base_name = os.path.splitext(os.path.basename(pdf_filename))[0]
    images_index: List[ImageIndexEntry] = []
    ocr_map: Dict[Tuple[int, str], str] = {}

    per_page_counter: Dict[int, int] = defaultdict(int)
    for img in page_images:
        per_page_counter[img.page_no] += 1
        counter = per_page_counter[img.page_no]

        # Detect format via Pillow
        try:
            image = Image.open(io.BytesIO(img.bytes))
            fmt = (image.format or "png").lower()
        except Exception:
            fmt = "png"
        filename = f"{base_name}_page{img.page_no:03d}_img_{counter:02d}.{fmt}"
        full_path = os.path.join(images_dir, filename)
        try:
            with open(full_path, "wb") as f:
                f.write(img.bytes)
        except Exception:
            # best-effort save; skip OCR if we cannot save
            continue

        # OCR text summary
        try:
            text = pytesseract.image_to_string(image)
        except Exception:
            text = ""
        summary = text.strip().replace("\n", " ")
        if len(summary) > 200:
            summary = summary[:200]

        images_index.append(
            ImageIndexEntry(page=img.page_no, filename=filename, ocr_text_summary=summary)
        )
        ocr_map[(img.page_no, filename)] = text

    return images_index, ocr_map

def _group_rows_into_items(rows: Sequence[ParsedRow]) -> List[CategoryNode]:
    """
    Group rows by (category, subcategory, canonical description).
    """
    # Normalize empty category/subcategory
    def norm_cat(text: Optional[str]) -> str:
        return text or "Uncategorized"

    buckets: Dict[Tuple[str, str, str], List[ParsedRow]] = defaultdict(list)
    for r in rows:
        cat = norm_cat(r.category)
        subcat = norm_cat(r.subcategory)
        desc_norm = re.sub(r"[^a-z0-9]+", " ", r.description.lower()).strip()
        key = (cat, subcat, desc_norm or r.description.lower())
        buckets[key].append(r)

    # Build hierarchy
    category_map: Dict[str, CategoryNode] = {}
    subcat_map: Dict[Tuple[str, str], SubcategoryNode] = {}

    for (cat_name, subcat_name, _), group_rows in buckets.items():
        if cat_name not in category_map:
            category_map[cat_name] = CategoryNode(category=cat_name, subcategories=[])
        cat_node = category_map[cat_name]

        sc_key = (cat_name, subcat_name)
        if sc_key not in subcat_map:
            subcat_node = SubcategoryNode(subcategory=subcat_name, items=[])
            subcat_map[sc_key] = subcat_node
            cat_node.subcategories.append(subcat_node)
        else:
            subcat_node = subcat_map[sc_key]

        # Representative row
        rep = max(group_rows, key=lambda r: r.confidence)
        variants: List[Variant] = []
        seen_cat_nos: set[str] = set()
        pages: List[int] = []
        for r in group_rows:
            if r.cat_no:
                if r.cat_no in seen_cat_nos:
                    pages.append(r.page_no)
                    continue
                seen_cat_nos.add(r.cat_no)
                attrs = VariantAttributes(
                    color=r.color,
                    finish=r.finish,
                    rating=r.rating_text,
                )
                variants.append(
                    Variant(
                        variant_name=r.color or r.finish or None,
                        cat_no=r.cat_no,
                        mrp_in=r.mrp_in,
                        attributes=attrs,
                        confidence=r.confidence,
                        raw_line=r.raw_line,
                    )
                )
            pages.append(r.page_no)

        item_conf = sum(r.confidence for r in group_rows) / max(len(group_rows), 1)
        primary_cat_no = rep.cat_no if rep.cat_no else (variants[0].cat_no if variants else None)

        item = Item(
            name=rep.name,
            description=rep.description,
            primary_cat_no=primary_cat_no,
            mrp_in=rep.mrp_in,
            std_pack=rep.std_pack,
            module_width=rep.module_width,
            current_rating_a=rep.current_rating_a,
            poles=rep.poles,
            variants=variants or [],
            images=[],
            image_refs=[],
            page_refs=sorted(sorted(set(pages))),
            confidence=item_conf,
            raw_line=rep.raw_line,
        )

        # Ensure variants array is non-empty per schema; if we have no cat_no at all,
        # create a placeholder variant with null cat_no-like info.
        if not item.variants:
            placeholder_cat = primary_cat_no or "UNKNOWN"
            item.variants.append(
                Variant(
                    variant_name=None,
                    cat_no=placeholder_cat,
                    mrp_in=item.mrp_in,
                    attributes=VariantAttributes(),
                    confidence=item_conf,
                    raw_line=item.raw_line,
                )
            )

        subcat_node.items.append(item)

    return list(category_map.values())

def _map_images_to_items(
    categories: Sequence[CategoryNode],
    images_index: Sequence[ImageIndexEntry],
    ocr_map: Dict[Tuple[int, str], str],
    pdf_filename: str,
) -> None:
    """
    Populate each item's images field using OCR-based and page-based heuristics.
    """
    # Build quick lookup by page
    page_to_images: Dict[int, List[ImageIndexEntry]] = defaultdict(list)
    for entry in images_index:
        page_to_images[entry.page].append(entry)

    # Helper: try Cloudinary upload; swallow errors if not configured
    def maybe_upload_image(page: int, filename: str) -> Optional[str]:
        full_path = os.path.join(os.path.dirname(pdf_filename), "catalog_images", filename)
        if not os.path.exists(full_path):
            # also try one level up (backend/public/catalog_images)
            alt = os.path.join(os.path.dirname(os.path.dirname(pdf_filename)), "catalog_images", filename)
            if os.path.exists(alt):
                full = alt
            else:
                return None
        else:
            full = full_path
        try:
            with open(full, "rb") as f:
                data = f.read()
            public_id = f"catalog/{os.path.splitext(filename)[0]}"
            result = upload_image_bytes(data, public_id, folder=None)
            return str(result.get("secure_url") or result.get("url"))
        except Exception:
            return None

    for cat in categories:
        for sub in cat.subcategories:
            for item in sub.items:
                # Collect all cat_nos for matching
                cat_nos = {v.cat_no for v in item.variants if v.cat_no}
                item_pages = set(item.page_refs)

                matched_images: List[Tuple[ImageIndexEntry, str]] = []

                for page in item_pages:
                    for entry in page_to_images.get(page, []):
                        full_ocr = ocr_map.get((entry.page, entry.filename), "")
                        lower_ocr = full_ocr.lower()
                        found = False
                        for cat_no in cat_nos:
                            if cat_no.lower() in lower_ocr:
                                matched_images.append((entry, "packshot"))
                                found = True
                                break
                        if found:
                            continue

                # Page-level hero/group images when no direct match
                for page in item_pages:
                    page_imgs = page_to_images.get(page, [])
                    if not page_imgs:
                        continue
                    if not matched_images and page_imgs:
                        # first as hero, rest as group
                        matched_images.append((page_imgs[0], "hero"))
                        for extra in page_imgs[1:]:
                            matched_images.append((extra, "group"))
                    else:
                        # add as group without duplicating
                        for extra in page_imgs:
                            if any(extra.filename == m.filename for m, _ in matched_images):
                                continue
                            matched_images.append((extra, "group"))

                # Deduplicate
                seen: set[Tuple[int, str]] = set()
                for entry, role in matched_images:
                    key = (entry.page, entry.filename)
                    if key in seen:
                        continue
                    seen.add(key)
                    cloud_url = maybe_upload_image(entry.page, entry.filename)
                    item.images.append(
                        ImageRef(
                            page=entry.page,
                            filename=entry.filename,
                            role=role,
                            cloudinary_url=cloud_url,
                        )
                    )

def run_catalog_extraction(
    pdf_path: str,
    *,
    images_subdir: str = "catalog_images",
) -> Dict[str, Any]:
    """
    High-level pipeline entrypoint.

    Returns a dict ready to be JSON-encoded that follows the required schema.
    """
    pdf_path = os.path.abspath(pdf_path)
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(pdf_path)

    # Extract images first (used for both images_index and OCR fallbacks)
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    page_images = _extract_page_images(pdf_bytes)

    images_dir = os.path.join(os.path.dirname(pdf_path), images_subdir)
    images_index, ocr_map = _save_images_and_ocr(
        pdf_filename=pdf_path,
        page_images=page_images,
        images_dir=images_dir,
    )

    parsed_rows: List[ParsedRow] = []
    page_categories: Dict[int, Tuple[str, str]] = {}

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        total_pages = len(pdf.pages)
        current_category: str = "Uncategorized"
        current_subcategory: str = "General"

        for page_index, page in enumerate(pdf.pages):
            page_no = page_index + 1
            page_text = page.extract_text() or ""

            if not page_text.strip():
                # fall back to OCR for headings if needed
                page_text = _ocr_page_text_from_images(page_no, page_images)

            cat, subcat = _detect_headings_for_page(page_text)
            if cat:
                current_category = cat
            if subcat:
                current_subcategory = subcat
            page_categories[page_no] = (current_category, current_subcategory)

            table_rows, source = _extract_tables_for_page(pdf_path, page_no)
            if table_rows:
                for cells in table_rows:
                    row = _parse_row_from_cells(
                        page_no=page_no,
                        cells=cells,
                        source=source,
                        category=current_category,
                        subcategory=current_subcategory,
                    )
                    if row:
                        parsed_rows.append(row)
                continue

            # No tables: OCR-based row parsing
            ocr_text = _ocr_page_text_from_images(page_no, page_images)
            if ocr_text.strip():
                parsed_rows.extend(
                    _parse_rows_from_ocr_text(
                        page_no=page_no,
                        text=ocr_text,
                        category=current_category,
                        subcategory=current_subcategory,
                    )
                )

    categories = _group_rows_into_items(parsed_rows)
    _map_images_to_items(categories, images_index, ocr_map, pdf_path)

    log_obj: Dict[str, Any] = {
        "pages_processed": len(page_categories),
        "items_extracted": sum(len(sc.items) for c in categories for sc in c.subcategories),
        "images_extracted": len(images_index),
        "warnings": [],
    }

    root = CatalogRoot(
        source=make_source_meta(os.path.basename(pdf_path)),
        catalog=categories,
        images_index=images_index,
        log=log_obj,
    )

    return serialize_catalog_root(root)

def main() -> None:
    parser = argparse.ArgumentParser(description="Extract structured catalog JSON from a PDF.")
    parser.add_argument(
        "--pdf",
        required=True,
        help="Path to the PDF catalog file.",
    )
    parser.add_argument(
        "--out",
        required=False,
        help="Output JSON file path (defaults to stdout if omitted).",
    )
    args = parser.parse_args()

    result = run_catalog_extraction(args.pdf)
    import json

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
    else:
        print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":  # pragma: no cover
    main()

