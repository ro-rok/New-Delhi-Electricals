"""
Disambiguate Signia Mini MCB duplicates by color.

- Targets the duplicated slugs listed in duplicate_slugs_report.txt.
- Color rule: SKU ending with "MR" -> Grey, else White.
- Updates per document:
  - slug: append -grey/-white
  - seo.slug (if present): same as slug
  - name: append " Grey"/" White" if not already present
  - specs.color: set to "Grey"/"White"
  - seo.meta_description: append color at end (or set to name + color if missing)
- No other fields touched.

Writes summary to output/fix_mcb_color_duplicates.json
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path as PathLib
from typing import Any, Dict, List

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
SUMMARY_FILE = OUTPUT_DIR / "fix_mcb_color_duplicates.json"

target_slugs = {
    "signia-mini-mcb-10a-sp-c",
    "signia-mini-mcb-16a-sp-c",
    "signia-mini-mcb-20a-sp-c",
    "signia-mini-mcb-25a-sp-c",
    "signia-mini-mcb-32a-sp-c",
}


def detect_color(sku: str) -> str:
    return "Grey" if sku and sku.endswith("MR") else "White"


def append_color_text(value: str, color: str) -> str:
    if not value:
        return color
    v = value.strip()
    if v.lower().endswith(color.lower()):
        return v
    # insert space before color
    return f"{v} {color}"


def build_updates(doc: Dict[str, Any]) -> Dict[str, Any]:
    sku = doc.get("sku") or ""
    color = detect_color(sku)

    base_slug = doc.get("slug") or ""
    new_slug = base_slug
    if base_slug:
        suffix = color.lower()
        if not base_slug.lower().endswith(f"-{suffix}"):
            new_slug = f"{base_slug}-{suffix}"

    name = doc.get("name") or ""
    new_name = append_color_text(name, color)

    seo = doc.get("seo") or {}
    new_seo = dict(seo) if seo else {}
    # seo.slug
    if new_slug:
        new_seo["slug"] = new_slug
    # seo.meta_description
    md = new_seo.get("meta_description") or doc.get("description") or name
    new_seo["meta_description"] = append_color_text(md, color)

    updates = {
        "slug": new_slug,
        "name": new_name,
        "specs.color": color,
        "seo": new_seo,
    }
    return updates


async def main():
    print("=" * 80)
    print("Fixing Signia Mini MCB duplicate slugs by appending color")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()
    coll = db["products"]

    applied: List[Dict[str, Any]] = []
    not_found: List[str] = []
    errors: List[Dict[str, Any]] = []

    try:
        await client.admin.command("ping")
        cursor = coll.find({"slug": {"$in": list(target_slugs)}})
        async for doc in cursor:
            updates = build_updates(doc)
            try:
                res = await coll.update_one({"_id": doc["_id"]}, {"$set": updates})
                applied.append({
                    "sku": doc.get("sku"),
                    "old_slug": doc.get("slug"),
                    "new_slug": updates.get("slug"),
                    "color": updates.get("specs.color"),
                    "matched": res.matched_count,
                    "modified": res.modified_count,
                })
            except Exception as e:
                errors.append({"sku": doc.get("sku"), "error": str(e)})
                logger.exception("Error updating %s", doc.get("sku"))

        # check for target slugs missing entirely
        found_slugs = {a["old_slug"] for a in applied if a.get("old_slug")}
        for s in target_slugs - found_slugs:
            not_found.append(s)

    finally:
        client.close()
        print("\n✓ MongoDB connection closed")

    summary = {
        "applied": applied,
        "not_found_slugs": not_found,
        "errors": errors,
    }
    SUMMARY_FILE.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Summary: {SUMMARY_FILE}")
    print(f"Applied: {len(applied)}, Errors: {len(errors)}, Not found slugs: {len(not_found)}")


if __name__ == "__main__":
    asyncio.run(main())
