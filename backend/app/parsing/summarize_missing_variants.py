"""
Summarize products with missing variants, including name and specs.

Reads:
- products file (default: output/all_products_full.json)
- missing variants file (default: output/missing_variants.json)

Emits:
- output/missing_variants_with_specs.json with entries:
    {
      "sku": "...",
      "name": "...",
      "specs": {...},
      "variant": {...}
    }
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def index_products(products: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    return {p.get("sku"): p for p in products if p.get("sku")}


def main() -> None:
    parser = argparse.ArgumentParser(description="Summarize missing variants with product name/specs.")
    parser.add_argument(
        "--products",
        type=Path,
        default=Path(__file__).parent / "output" / "all_products_full.json",
        help="Path to products JSON array",
    )
    parser.add_argument(
        "--missing",
        type=Path,
        default=Path(__file__).parent / "output" / "missing_variants.json",
        help="Path to missing variants JSON array",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent / "output" / "missing_variants_with_specs.json",
        help="Path to write summarized JSON",
    )
    args = parser.parse_args()

    products = load_json(args.products)
    missing = load_json(args.missing)
    product_index = index_products(products)

    summarized = []
    for entry in missing:
        sku = entry.get("sku")
        if not sku:
            continue
        prod = product_index.get(sku, {})
        summarized.append(
            {
                "sku": sku,
                "name": prod.get("name"),
                "specs": prod.get("specs"),
                "product_family": prod.get("product_family") or prod.get("series"),
                "variant": entry.get("variant") or {},
            }
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(summarized, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(summarized)} entries to {args.output}")


if __name__ == "__main__":
    main()

