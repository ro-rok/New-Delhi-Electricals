"""
Group category_mismatches.json by source_category and save to a new JSON.

Outputs:
- output/category_mismatches_by_source_category.json :
  {
    "<source_category>": [ entries... ],
    ...
  }

No DB writes.
"""

import json
import logging
from collections import defaultdict
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
MISMATCH_FILE = OUTPUT_DIR / "category_mismatches.json"
OUT_FILE = OUTPUT_DIR / "category_mismatches_by_source_category.json"


def main():
    if not MISMATCH_FILE.exists():
        logger.error("category_mismatches.json not found at %s", MISMATCH_FILE)
        return

    with open(MISMATCH_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    grouped = defaultdict(list)
    for entry in data:
        key = entry.get("source_category") or "Unknown"
        grouped[key].append(entry)

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(grouped, f, indent=2, ensure_ascii=False)

    logger.info("Wrote grouped mismatches to %s", OUT_FILE)


if __name__ == "__main__":
    main()
