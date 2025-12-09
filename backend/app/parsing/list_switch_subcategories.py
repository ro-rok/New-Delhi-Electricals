import asyncio
import json
from pathlib import Path
import sys
import traceback

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))
from app.db import get_client, get_db

OUTPUT = Path(__file__).parent / 'output' / 'switches_subcategories.json'
ERROR_LOG = Path(__file__).parent / 'output' / 'switches_subcategories_error.txt'
OUTPUT.parent.mkdir(exist_ok=True)

async def main():
    try:
        client = get_client(); db = get_db(); coll = db['products']
        pipeline = [
            {"$match": {"category": "Switches", "subcategory": {"$exists": True}}},
            {"$group": {"_id": "$subcategory", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        subs = await coll.aggregate(pipeline).to_list(length=500)
        OUTPUT.write_text(json.dumps(subs, indent=2, ensure_ascii=False), encoding='utf-8')
        print('Wrote', OUTPUT, 'count', len(subs), flush=True)
        client.close()
    except Exception as e:
        ERROR_LOG.write_text(traceback.format_exc(), encoding='utf-8')
        print('ERROR', e, flush=True)

if __name__ == '__main__':
    asyncio.run(main())
