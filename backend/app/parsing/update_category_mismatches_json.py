"""
Enrich output/category_mismatches.json with suggested subcategories based on categories_with_subcategories.json.

Logic:
- Load categories_with_subcategories.json (category name/id/slug -> subcategory list).
- Load output/category_mismatches.json.
- For each entry, find category record by matching source_category against category name/id/slug (case-insensitive).
- Add fields:
    allowed_subcategories: list of subcategory names for that category (if found)
    suggested_subcategory: if source_product has a subcategory that matches (case-insensitive) one of the allowed subcategories by name, set it; otherwise None.
- Write back to output/category_mismatches.json (overwriting).

Note: does NOT touch images or database.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
CATEGORIES_FILE = BASE_DIR / "categories_with_subcategories.json"
MISMATCH_FILE = OUTPUT_DIR / "category_mismatches.json"


def load_categories() -> List[Dict[str, Any]]:
    with open(CATEGORIES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def index_categories(categories: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    idx: Dict[str, Dict[str, Any]] = {}
    for cat in categories:
        keys = [cat.get("id", ""), cat.get("name", ""), cat.get("slug", "")]
        for k in keys:
            if k:
                idx[k.lower()] = cat
    return idx


def normalize(s: str) -> str:
    return s.strip().lower() if isinstance(s, str) else ""


def build_allowed_and_suggested(entry: Dict[str, Any], cat_idx: Dict[str, Dict[str, Any]]):
    src_cat = entry.get("source_category")
    cat = cat_idx.get(normalize(src_cat), {})
    allowed = []
    if cat:
        allowed = [sub.get("name") for sub in cat.get("subcategories", []) if sub.get("name")]

    suggested = None
    src_prod = entry.get("source_product") or {}
    src_sub = src_prod.get("subcategory")
    if src_sub and allowed:
        norm_sub = normalize(src_sub)
        for a in allowed:
            if normalize(a) == norm_sub:
                suggested = a
                break
    entry["allowed_subcategories"] = allowed
    entry["suggested_subcategory"] = suggested
    return entry


def main():
    if not MISMATCH_FILE.exists():
        logger.error("category_mismatches.json not found at %s", MISMATCH_FILE)
        return
    categories = load_categories()
    cat_idx = index_categories(categories)

    with open(MISMATCH_FILE, "r", encoding="utf-8") as f:
        mismatches = json.load(f)

    updated = []
    for entry in mismatches:
        updated.append(build_allowed_and_suggested(entry, cat_idx))

    with open(MISMATCH_FILE, "w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)

    logger.info("Updated %s entries in %s", len(updated), MISMATCH_FILE)


if __name__ == "__main__":
    main()

