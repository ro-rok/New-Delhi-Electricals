"""
Summarize subcategories containing 'mcb' (case-insensitive).
Outputs: output/mcb_subcategory_summary.json and mcb_subcategory_summary_error.txt if errors.
"""

import asyncio
import json
from pathlib import Path
import sys
import traceback

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))
from app.db import get_client, get_db

OUTPUT = Path(__file__).parent / 'output' / 'mcb_subcategory_summary.json'
ERROR = Path(__file__).parent / 'output' / 'mcb_subcategory_summary_error.txt'
OUTPUT.parent.mkdir(exist_ok=True)

async def main():
    try:
        client = get_client(); db = get_db(); coll = db['products']
        pipeline = [
            {"$match": {"subcategory": {"$regex": "mcb", "$options": "i"}}},
            {"$group": {"_id": "$subcategory", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        subs = await coll.aggregate(pipeline).to_list(length=500)
        OUTPUT.write_text(json.dumps(subs, indent=2, ensure_ascii=False), encoding='utf-8')
        client.close()
    except Exception:
        ERROR.write_text(traceback.format_exc(), encoding='utf-8')
        raise

if __name__ == '__main__':
    asyncio.run(main())
