"""
Remove 'std pack' / 'master pack' mentions from name/description/meta_description and slug
when the product name contains these terms.

Fields touched (if changed):
- name
- description
- seo.meta_description
- seo.slug
- catalog_source.seo.slug

Rules:
- Only process a product if its name contains 'std pack' or 'master pack' (case-insensitive)
- For text fields: remove the phrases (case-insensitive), collapse extra spaces
- For slug fields: drop those tokens; collapse repeated dashes
- Do NOT touch images or status.

Outputs summary: output/pack_cleanup_summary.json
"""

import asyncio
import json
import logging
import os
import re
import sys
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
SUMMARY_FILE = OUTPUT_DIR / "pack_cleanup_summary.json"

# patterns
TEXT_PAT = re.compile(r"\b(std\s*pack|master\s*pack)\b", re.IGNORECASE)
SLUG_PAT = re.compile(r"-(std|master)[-]?pack", re.IGNORECASE)
MULTI_SPACE = re.compile(r"\s{2,}")
MULTI_DASH = re.compile(r"-{2,}")


def clean_text(val: Any) -> Any:
    if not isinstance(val, str):
        return val
    new = TEXT_PAT.sub("", val)
    new = MULTI_SPACE.sub(" ", new).strip()
    return new


def clean_slug(val: Any) -> Any:
    if not isinstance(val, str):
        return val
    new = SLUG_PAT.sub("", val)
    new = MULTI_DASH.sub("-", new)
    new = new.strip("-")
    return new


def needs_cleanup(name: str) -> bool:
    return bool(TEXT_PAT.search(name or ""))


async def main():
    print("=" * 80)
    print("Cleaning std/master pack from name/description/meta/slug")
    print("=" * 80)
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Database: {settings.MONGODB_DB_NAME}\n")

    client = get_client()
    db = get_db()
    collection = db["products"]

    summary = {"processed": 0, "updated": 0, "details": []}

    try:
        async for doc in collection.find({"name": {"$regex": "std pack|master pack", "$options": "i"}}):
            summary["processed"] += 1
            updates: Dict[str, Any] = {}

            name = doc.get("name")
            new_name = clean_text(name)
            if new_name != name:
                updates["name"] = new_name

            desc = doc.get("description")
            new_desc = clean_text(desc)
            if new_desc != desc:
                updates["description"] = new_desc

            seo = doc.get("seo") or {}
            new_seo = dict(seo)
            changed_seo = False

            md = seo.get("meta_description")
            new_md = clean_text(md)
            if new_md != md:
                new_seo["meta_description"] = new_md
                changed_seo = True

            slug = seo.get("slug")
            new_slug = clean_slug(slug)
            if new_slug != slug:
                new_seo["slug"] = new_slug
                changed_seo = True

            if changed_seo:
                updates["seo"] = new_seo

            cs = doc.get("catalog_source") or {}
            cs_seo = cs.get("seo") or {}
            new_cs_seo = dict(cs_seo)
            changed_cs = False

            cs_slug = cs_seo.get("slug")
            new_cs_slug = clean_slug(cs_slug)
            if new_cs_slug != cs_slug:
                new_cs_seo["slug"] = new_cs_slug
                changed_cs = True

            if changed_cs:
                updates["catalog_source.seo"] = new_cs_seo

            if updates:
                res = await collection.update_one({"_id": doc["_id"]}, {"$set": updates})
                summary["updated"] += 1
                summary["details"].append({
                    "sku": doc.get("sku"),
                    "name_before": name,
                    "updates": updates,
                    "matched": res.matched_count,
                    "modified": res.modified_count,
                })

        with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"Done. Processed {summary['processed']} products, updated {summary['updated']}")
        print(f"Summary: {SUMMARY_FILE}")

    finally:
        client.close()
        print("\n✓ MongoDB connection closed")


if __name__ == "__main__":
    asyncio.run(main())
