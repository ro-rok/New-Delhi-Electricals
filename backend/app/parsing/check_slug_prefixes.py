"""
Check if slugs are prefixed with product_family- and write summary.
"""
import asyncio
import json
import logging
import os
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
SUMMARY = OUTPUT_DIR / "check_slug_prefixes_summary.json"


def needs_prefix(pf: str, slug: str) -> bool:
    if not pf or not slug:
        return False
    return not slug.lower().startswith(pf.lower() + "-")


async def main():
    client = get_client()
    db = get_db()
    coll = db["products"]
    total = 0
    mismatches = []
    async for doc in coll.find({"slug": {"$exists": True}}):
        total += 1
        pf = doc.get("product_family") or doc.get("series")
        slug = doc.get("slug")
        if pf and slug and needs_prefix(pf, slug):
            mismatches.append({"sku": doc.get("sku"), "product_family": pf, "slug": slug})
    summary = {
        "total_with_slug": total,
        "mismatches": len(mismatches),
        "samples": mismatches[:50],
    }
    with open(SUMMARY, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"Total with slug: {total}, mismatches: {len(mismatches)}")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
