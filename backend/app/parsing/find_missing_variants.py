"""
Find products with missing variants and compute suggested variants.

This script:
1) Loads products (default: output/all_products_full.json) and colors list.
2) Uses compute_variants from generate_variants.py to propose variants
   (color + size rules).
3) Filters to bases that currently have no variant defined.
4) Writes output/missing_variants.json with entries:
      { "sku": "...", "variant": { "SIB": "color_or_size", ... } }
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

# Ensure we can import the sibling module
CURRENT_DIR = Path(__file__).parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from generate_variants import compute_variants, load_colors, load_products  # type: ignore


def filter_missing_bases(products: List[Dict[str, Any]]) -> set[str]:
    """Return SKUs of products that have no variant field or empty variant."""
    missing = set()
    for p in products:
        v = p.get("variant")
        if not v or not isinstance(v, dict) or len(v) == 0:
            if p.get("sku"):
                missing.add(p["sku"])
    return missing


def main() -> None:
    parser = argparse.ArgumentParser(description="Find products with missing variants and suggest variants.")
    parser.add_argument(
        "--input",
        type=Path,
        default=CURRENT_DIR / "output" / "all_products_full.json",
        help="Path to products JSON (array).",
    )
    parser.add_argument(
        "--colors",
        type=Path,
        default=CURRENT_DIR / "output" / "all_colors.json",
        help="Path to colors JSON (with key 'colors').",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=CURRENT_DIR / "output" / "missing_variants.json",
        help="Path to write missing variants JSON.",
    )
    parser.add_argument(
        "--color-only",
        action="store_true",
        help="Only compute color variants.",
    )
    args = parser.parse_args()

    products = load_products(args.input)
    colors = load_colors(args.colors)
    missing_bases = filter_missing_bases(products)

    all_variants = compute_variants(products, colors, color_only=args.color_only)
    filtered = [entry for entry in all_variants if entry.get("sku") in missing_bases]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(filtered)} missing variant entries to {args.output}")


if __name__ == "__main__":
    main()

