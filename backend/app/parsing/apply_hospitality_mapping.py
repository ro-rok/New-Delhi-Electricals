"""
Apply category/subcategory mapping for hospitality entries.

Behavior:
- Reads output/hospitality.json
- Sets category to 'Hospitality'
- Maps subcategory based on name keywords using categories_with_subcategories.json (Hospitality subcategories):
    - if name has 'DND' or 'MMR' -> 'DND-MMR Units'
    - elif name has 'Spare Key' -> 'Key Tag Accessories'
    - elif name has 'Key Tag' -> 'Mechanical Key Tag Switches'
    - else fallback to 'DND-MMR Units'
- Updates both top-level subcategory and source_product.subcategory
- DOES NOT touch images or the database
- Writes back to output/hospitality.json

Run:
    cd c:/NDE/New-Delhi-Electricals/backend/app/parsing
    python apply_hospitality_mapping.py
"""

import json
import logging
import re
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
OUT_FILE = BASE_DIR / "output" / "hospitality.json"
CAT_FILE = BASE_DIR / "categories_with_subcategories.json"

# keyword patterns -> subcategory name
NAME_TO_SUB = [
    (re.compile(r"dnd", re.I), "DND-MMR Units"),
    (re.compile(r"mmr", re.I), "DND-MMR Units"),
    (re.compile(r"spare\s*key", re.I), "Key Tag Accessories"),
    (re.compile(r"key\s*tag", re.I), "Mechanical Key Tag Switches"),
]
FALLBACK_SUB = "DND-MMR Units"


def normalize_subcat(name: str, allowed: set) -> str:
    if not name:
        return FALLBACK_SUB
    # exact match against allowed (case-insensitive)
    for a in allowed:
        if a.lower() == name.lower():
            return a
    return FALLBACK_SUB


def load_allowed_subs() -> set:
    with open(CAT_FILE, "r", encoding="utf-8") as f:
        cats = json.load(f)
    hosp = next((c for c in cats if c.get("name", "").lower() == "hospitality"), None)
    subs = hosp.get("subcategories", []) if hosp else []
    return {s.get("name") for s in subs if s.get("name")}


def choose_subcategory(prod_name: str) -> str:
    for pat, sub in NAME_TO_SUB:
        if pat.search(prod_name or ""):
            return sub
    return FALLBACK_SUB


def main():
    if not OUT_FILE.exists():
        logger.error("hospitality.json not found at %s", OUT_FILE)
        return

    allowed = load_allowed_subs()
    with open(OUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    for entry in data:
        sp = entry.get("source_product") or {}
        name = sp.get("name") or entry.get("name", "")
        chosen = normalize_subcat(choose_subcategory(name), allowed)

        entry["category"] = "Hospitality"
        entry["subcategory"] = chosen
        sp["category"] = "Hospitality"
        sp["subcategory"] = chosen
        entry["source_product"] = sp

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logger.info("Updated %s entries in %s", len(data), OUT_FILE)


if __name__ == "__main__":
    main()
