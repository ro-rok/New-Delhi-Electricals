"""
Create an application plan for category mismatches:
- For each entry in output/category_mismatches.json, keep DB category (db_category)
- Pick a subcategory from categories_with_subcategories.json for that DB category (first subcategory listed)
- Write output/category_mismatches_apply.json with fields:
    sku, name, apply_category (db_category), apply_subcategory (chosen), source_category, source_product
No DB writes performed.
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
APPLY_FILE = OUTPUT_DIR / "category_mismatches_apply.json"


def load_json(path: Path) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def index_categories(categories: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    idx = {}
    for cat in categories:
        for k in [cat.get("id"), cat.get("name"), cat.get("slug")]:
            if k:
                idx[str(k).lower()] = cat
    return idx


def first_subcategory(cat: Dict[str, Any]) -> str:
    subs = cat.get("subcategories", []) if cat else []
    if subs:
        return subs[0].get("name")
    return None


def main():
    if not MISMATCH_FILE.exists():
        logger.error("Missing %s", MISMATCH_FILE)
        return
    categories = load_json(CATEGORIES_FILE)
    cat_idx = index_categories(categories)
    mismatches = load_json(MISMATCH_FILE)

    output = []
    for entry in mismatches:
        db_cat = entry.get("db_category")
        cat_rec = cat_idx.get(str(db_cat).lower()) if db_cat else None
        chosen_sub = first_subcategory(cat_rec)
        output.append({
            "sku": entry.get("sku"),
            "name": entry.get("name"),
            "apply_category": db_cat,
            "apply_subcategory": chosen_sub,
            "source_category": entry.get("source_category"),
            "source_product": entry.get("source_product"),
            "db_category_record": cat_rec,
        })

    with open(APPLY_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    logger.info("Wrote %s entries to %s", len(output), APPLY_FILE)


if __name__ == "__main__":
    main()

