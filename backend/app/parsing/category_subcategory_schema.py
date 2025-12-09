"""
Build per-category and per-subcategory field type schema from MongoDB products.

Outputs:
- output/category_subcategory_schema.json : {category: {subcategory: {field_path: {type: count}}}}
- output/category_subcategory_schema.txt  : human-readable summary

No DB writes.
"""

import asyncio
import json
import logging
import os
import sys
from collections import defaultdict
from pathlib import Path as PathLib
from typing import Any, Dict

backend_dir = PathLib(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

original_cwd = PathLib.cwd()
backend_path = backend_dir
os.chdir(backend_path)
try:
    from app.config import settings
    from app.db import get_client, get_db
finally:
    os.chdir(original_cwd)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_DIR = PathLib(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
JSON_OUT = OUTPUT_DIR / "category_subcategory_schema.json"
TXT_OUT = OUTPUT_DIR / "category_subcategory_schema.txt"


def type_name(val: Any) -> str:
    if val is None:
        return "null"
    if isinstance(val, bool):
        return "bool"
    if isinstance(val, (int, float)):
        return "number"
    if isinstance(val, str):
        return "string"
    if isinstance(val, list):
        return "array"
    if isinstance(val, dict):
        return "object"
    return type(val).__name__


def update_schema(schema: Dict[str, Dict[str, int]], obj: Any, prefix: str = "") -> None:
    """
    Flatten dict/list into dotted paths; record type frequencies.
    """
    if isinstance(obj, dict):
        for k, v in obj.items():
            path = f"{prefix}.{k}" if prefix else k
            update_schema(schema, v, path)
    elif isinstance(obj, list):
        schema[prefix]["array"] = schema[prefix].get("array", 0) + 1
        # Sample first item to guess element type
        if obj:
            update_schema(schema, obj[0], f"{prefix}[]")
    else:
        t = type_name(obj)
        schema[prefix][t] = schema[prefix].get(t, 0) + 1


async def main():
    print("=" * 80, flush=True)
    print("Building category/subcategory schema (no DB writes)", flush=True)
    print("=" * 80, flush=True)
    print(f"MongoDB URI: {settings.MONGODB_URI}", flush=True)
    print(f"Database: {settings.MONGODB_DB_NAME}\n", flush=True)

    client = get_client()
    db = get_db()
    coll = db["products"]

    schema: Dict[str, Dict[str, Dict[str, Dict[str, int]]]] = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))

    async for doc in coll.find({}):
        cat = doc.get("category") or "Uncategorized"
        subcat = doc.get("subcategory") or "Unspecified"
        update_schema(schema[cat][subcat], doc)

    # Write JSON
    JSON_OUT.write_text(json.dumps(schema, indent=2, ensure_ascii=False), encoding="utf-8")

    # Write summary
    lines = []
    for cat, subcats in sorted(schema.items()):
        lines.append(f"Category: {cat}")
        for subcat, fields in sorted(subcats.items()):
            lines.append(f"  Subcategory: {subcat} ({len(fields)} fields)")
            top_fields = sorted(fields.items(), key=lambda kv: kv[0])
            for field_path, types in top_fields:
                type_desc = ", ".join(f"{k}:{v}" for k, v in sorted(types.items()))
                lines.append(f"    - {field_path}: {type_desc}")
        lines.append("")
    TXT_OUT.write_text("\n".join(lines), encoding="utf-8")

    print(f"Done. JSON: {JSON_OUT}")
    print(f"       TXT : {TXT_OUT}")
    client.close()
    print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
