"""
Debug script for "12 module plate engem" search query.
Tests the actual API endpoint and search engine to find why no results are returned.
"""

import asyncio
import sys
from pathlib import Path
import json

sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.services.search_engine import SearchEngine
from app.utils.search_parser import SearchParser
from app.config import settings
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


async def debug_search():
    """Debug the specific search query."""
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    query = "12 module plate engem"
    
    try:
        print(f"\n{'='*70}")
        print(f"DEBUGGING SEARCH: '{query}'")
        print(f"{'='*70}\n")
        
        # Step 1: Test SearchParser
        print("STEP 1: Testing SearchParser")
        print("-" * 70)
        parser = SearchParser(db)
        parsed = await parser.parse(query)
        print(f"Parsed result: {json.dumps(parsed, indent=2, default=str)}")
        print()
        
        # Step 2: Test SearchEngine query building
        print("STEP 2: Testing SearchEngine Query Building")
        print("-" * 70)
        search_engine = SearchEngine(db)
        mongo_query = search_engine._build_query(
            query=query,
            parsed=parsed,
            category=None,
            brand=None,
            series=None
        )
        print(f"MongoDB Query: {json.dumps(mongo_query, indent=2, default=str)}")
        print()
        
        # Step 3: Test search conditions
        print("STEP 3: Testing Search Conditions")
        print("-" * 70)
        search_conditions = search_engine._build_search_conditions(query)
        print(f"Number of search conditions: {len(search_conditions)}")
        print(f"First 5 conditions:")
        for i, cond in enumerate(search_conditions[:5], 1):
            print(f"  {i}. {cond}")
        print()
        
        # Step 4: Count documents matching query
        print("STEP 4: Testing MongoDB Query Execution")
        print("-" * 70)
        total = await db.products.count_documents(mongo_query)
        print(f"Total documents matching query: {total}")
        print()
        
        # Step 5: Get sample products
        print("STEP 5: Sample Products")
        print("-" * 70)
        if total > 0:
            cursor = db.products.find(mongo_query).limit(5)
            products = await cursor.to_list(length=5)
            for i, product in enumerate(products, 1):
                name = product.get("name", "N/A")
                category = product.get("category", "N/A")
                series = product.get("series") or product.get("catalog_source", {}).get("product_family", "N/A")
                brand = product.get("brand", "N/A")
                mw = product.get("specs", {}).get("mw") or product.get("specs", {}).get("module") or product.get("specs", {}).get("modules")
                print(f"  {i}. {name}")
                print(f"     Category: {category}, Series: {series}, Brand: {brand}, Module: {mw}")
        else:
            print("  ❌ No products found!")
            
            # Try to find why - check individual conditions
            print("\n  Debugging individual conditions...")
            for i, cond in enumerate(search_conditions[:10], 1):
                count = await db.products.count_documents(cond)
                print(f"  Condition {i}: {count} matches - {cond}")
        print()
        
        # Step 6: Test actual search engine
        print("STEP 6: Testing SearchEngine.search()")
        print("-" * 70)
        result = await search_engine.search(query=query)
        print(f"Search result total: {result.get('total', 0)}")
        print(f"Items returned: {len(result.get('items', []))}")
        if result.get('items'):
            print("First 3 products:")
            for i, item in enumerate(result['items'][:3], 1):
                name = item.get("name", "N/A")
                category = item.get("category", "N/A")
                series = item.get("series") or item.get("catalog_source", {}).get("product_family", "N/A")
                print(f"  {i}. {name} ({category}, {series})")
        print()
        
        # Step 7: Check for specific ENGEM 12 module plates
        print("STEP 7: Looking for ENGEM 12 Module Plates Specifically")
        print("-" * 70)
        specific_query = {
            "$and": [
                {"category": {"$regex": "Plates", "$options": "i"}},
                {
                    "$or": [
                        {"series": {"$regex": "ENGEM", "$options": "i"}},
                        {"catalog_source.product_family": {"$regex": "ENGEM", "$options": "i"}}
                    ]
                },
                {
                    "$or": [
                        {"specs.module": 12},
                        {"specs.modules": 12},
                        {"specs.mw": 12},
                        {"name": {"$regex": "12.*module", "$options": "i"}}
                    ]
                }
            ]
        }
        specific_count = await db.products.count_documents(specific_query)
        print(f"Products matching: category=Plates, series=ENGEM, module=12")
        print(f"Found: {specific_count}")
        
        if specific_count > 0:
            cursor = db.products.find(specific_query).limit(5)
            products = await cursor.to_list(length=5)
            print("Sample products:")
            for i, product in enumerate(products, 1):
                name = product.get("name", "N/A")
                print(f"  {i}. {name}")
        print()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(debug_search())

