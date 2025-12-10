"""
Generate missing variants based on color and size.

Rules (only these two):
1) Same category/subcategory/brand/product_family/base-specs, same size but different color -> add sibling SKU with value = color.
2) Same category/subcategory/brand/product_family/base-specs, same color but different size -> add sibling SKU with value = size.

Additional constraints:
- Names should match once trailing color/finish token is stripped (use known colors list + specs.finish).
- Finishes must match (specs.finish equality); do not mix different finishes.

Inputs:
- JSON array of products (default: output/all_products_full.json)
  Expected fields: sku, brand, category, subcategory, product_family (or series),
  specs (contains color, module_size/module/modules/mw, finish optional), variant (optional).

Output:
- JSON array of objects: { "sku": "...", "variant": { "SIBLING_SKU": "color/size" } }
  Only includes entries with newly derived variants (diff-only).
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple


def normalize_size(specs: Dict[str, Any]) -> Optional[str]:
    """
    Prefer module_size, then module, modules, then mw. Convert to string and strip.
    """
    for key in ("module_size", "module", "modules", "mw"):
        if key in specs and specs[key] is not None:
            size_val = str(specs[key]).strip()
            if size_val:
                return size_val
    return None


def normalize_color_from_specs(specs: Dict[str, Any]) -> Optional[str]:
    color = specs.get("color")
    if color is None:
        return None
    return str(color).strip() or None


def extract_color_from_name(name: str, colors: Set[str]) -> Optional[str]:
    """
    Try to extract color by matching known colors at the end of the name (case-insensitive).
    Supports multi-word colors like 'Snow White'.
    """
    if not name:
        return None
    name_lower = name.lower().strip()
    # Sort colors by length descending to match longest first
    for color in sorted(colors, key=lambda c: len(c), reverse=True):
        c_lower = color.lower()
        if name_lower.endswith(c_lower):
            # ensure token boundary
            prefix = name_lower[: -len(c_lower)].rstrip()
            if not prefix or prefix[-1].isspace() or prefix[-1] in "-_/":
                return color
    return None


def normalize_finish(specs: Dict[str, Any]) -> Optional[str]:
    finish = specs.get("finish")
    if finish is None:
        return None
    return str(finish).strip() or None


def base_specs_key(specs: Dict[str, Any]) -> str:
    """
    Create a hashable key for specs excluding color and size fields.
    """
    excluded = {"color", "module_size", "mw", "module", "modules"}
    filtered = {k: v for k, v in specs.items() if k not in excluded}
    return json.dumps(filtered, sort_keys=True, ensure_ascii=False)


def load_products(path: Path) -> List[Dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_colors(path: Optional[Path]) -> Set[str]:
    if path is None or not path.exists():
        return set()
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
            colors = data.get("colors") if isinstance(data, dict) else None
            if isinstance(colors, list):
                return {str(c).strip() for c in colors if c}
    except Exception:
        pass
    return set()


def base_name_without_suffix(name: str, color_set: Set[str], finish: Optional[str]) -> str:
    """
    Strip a trailing token if it matches a known color or the finish value.
    Example: "Plate Snow White" -> "Plate" (if Snow White in colors)
    """
    if not name:
        return ""
    parts = name.strip().split()
    if not parts:
        return name.strip()
    last = parts[-1]
    last_stripped = last.strip(",").strip()
    match_finish = finish and last_stripped.lower() == finish.lower()
    match_color = last_stripped in color_set or last_stripped.lower() in {c.lower() for c in color_set}
    if match_finish or match_color:
        return " ".join(parts[:-1]).strip()
    return name.strip()


def compute_variants(products: List[Dict[str, Any]], colors: Set[str], color_only: bool = False) -> List[Dict[str, Any]]:
    """
    Group by coarse fields to maximize matches while keeping finish/base name aligned:
    (category, subcategory, brand, product_family/series, finish, base_name_lower)
    """
    groups: Dict[Tuple[str, str, str, str, str, str], List[Dict[str, Any]]] = defaultdict(list)

    for p in products:
        specs = p.get("specs") or {}
        color = normalize_color_from_specs(specs) or extract_color_from_name(p.get("name") or "", colors)
        size = normalize_size(specs)
        finish = normalize_finish(specs)
        base_name = base_name_without_suffix(p.get("name") or "", colors, finish).lower()
        key = (
            p.get("category") or "",
            p.get("subcategory") or "",
            p.get("brand") or "",
            p.get("product_family") or p.get("series") or "",
            finish or "",
        )
        groups[key].append(
            {
                "product": p,
                "color": color,
                "size": size,
                "finish": finish,
                "base_name": base_name,
                "existing_variant": p.get("variant") or {},
            }
        )

    new_variants: Dict[str, Dict[str, str]] = defaultdict(dict)

    for _, enriched in groups.items():
        # Color rule: same size, different color
        for i, a in enumerate(enriched):
            for j, b in enumerate(enriched):
                if i == j:
                    continue
                # Require same size
                if not (a["size"] and b["size"] and a["size"] == b["size"]):
                    continue
                # Colors must exist and differ
                if not (a["color"] and b["color"] and a["color"] != b["color"]):
                    continue
                # Tighten: require same base name and same finish (if present)
                if a["base_name"] != b["base_name"]:
                    continue
                if a["finish"] and b["finish"] and a["finish"] != b["finish"]:
                    continue

                sku_a = a["product"]["sku"]
                sku_b = b["product"]["sku"]
                # Emit for A->B if A has no existing variants
                if not a["existing_variant"]:
                    if b["color"] not in new_variants[sku_a].values() and sku_b not in a["existing_variant"]:
                        new_variants[sku_a][sku_b] = b["color"]
                # Emit reciprocal B->A if B has no existing variants
                if not b["existing_variant"]:
                    if a["color"] not in new_variants[sku_b].values() and sku_a not in b["existing_variant"]:
                        new_variants[sku_b][sku_a] = a["color"]

        # Size rule: same color, different size
        if not color_only:
            for i, a in enumerate(enriched):
                for j, b in enumerate(enriched):
                    if i == j:
                        continue
                    if a["finish"] != b["finish"]:
                        continue
                    if a["color"] and b["color"] and a["color"] == b["color"]:
                        if a["size"] and b["size"] and a["size"] != b["size"]:
                            sku_a = a["product"]["sku"]
                            sku_b = b["product"]["sku"]
                            if a["existing_variant"]:
                                continue
                            if sku_b in a["existing_variant"]:
                                continue
                            new_variants[sku_a][sku_b] = b["size"]

    # Build diff-only list
    diff_list = []
    for sku, variant_map in new_variants.items():
        if variant_map:
            diff_list.append({"sku": sku, "variant": variant_map})
    return diff_list


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate missing variants based on color and size.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(__file__).parent / "output" / "all_products_full.json",
        help="Path to products JSON (array).",
    )
    parser.add_argument(
        "--colors",
        type=Path,
        default=Path(__file__).parent / "output" / "all_colors.json",
        help="Path to colors JSON (with key 'colors').",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent / "output" / "generated_variants.json",
        help="Path to write variants diff JSON.",
    )
    parser.add_argument(
        "--color-only",
        action="store_true",
        help="If set, emit only color variants (skip size variants).",
    )
    args = parser.parse_args()

    products = load_products(args.input)
    colors = load_colors(args.colors)
    variants = compute_variants(products, colors, color_only=args.color_only)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(variants, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(variants)} variant records to {args.output}")


if __name__ == "__main__":
    main()

