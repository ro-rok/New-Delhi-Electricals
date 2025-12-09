"""
List entries in Done/*.json that have missing or empty SKU.

Outputs:
- output/done_missing_sku.json : list of {source_file, index, name, sku}
- output/done_missing_sku.txt  : count + sample
No DB access/writes.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
DONE_DIR = BASE_DIR / "Done"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
JSON_OUT = OUTPUT_DIR / "done_missing_sku.json"
TEXT_OUT = OUTPUT_DIR / "done_missing_sku.txt"


def is_missing(val: Any) -> bool:
    return val is None or (isinstance(val, str) and val.strip() == "")


def main():
    missing: List[Dict[str, Any]] = []
    if not DONE_DIR.exists():
        logger.warning("Done directory not found: %s", DONE_DIR)
    else:
        for path in sorted(DONE_DIR.glob("*.json")):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    for idx, item in enumerate(data):
                        sku = item.get("sku")
                        if is_missing(sku):
                            missing.append({
                                "source_file": path.name,
                                "index": idx,
                                "name": item.get("name"),
                                "sku": sku,
                            })
            except Exception as e:
                logger.error("Error reading %s: %s", path, e)

    JSON_OUT.write_text(json.dumps(missing, indent=2, ensure_ascii=False), encoding="utf-8")
    with open(TEXT_OUT, "w", encoding="utf-8") as f:
        f.write(f"Missing SKU entries: {len(missing)}\n")
        f.write("Sample (first 50):\n")
        for m in missing[:50]:
            f.write(f"  {m['source_file']} [#{m['index']}] | name={m.get('name','')} | sku={m.get('sku')}\n")
    print(f"Done. Missing entries: {len(missing)}")
    print(f"JSON: {JSON_OUT}")
    print(f"Report: {TEXT_OUT}")


if __name__ == "__main__":
    main()
