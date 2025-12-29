"""
Simulate the route logic to see what's happening.
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.db import get_db_dep
from app.services.search_engine import SearchEngine
from app.schemas import ProductInDB, ProductListResponse

async def test_route_simulation():
    """Simulate what the route does."""
    # Connect to database
    from app.config import settings
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    query = "12 module plate engem"
    
    print(f"\n{'='*70}")
    print(f"SIMULATING ROUTE LOGIC")
    print(f"{'='*70}\n")
    print(f"Query: {query}\n")
    
    try:
        # Step 1: Create search engine
        print("Step 1: Creating SearchEngine...")
        search_engine = SearchEngine(db)
        print("✅ SearchEngine created\n")
        
        # Step 2: Call search
        print("Step 2: Calling search_engine.search()...")
        result = await search_engine.search(
            query=query,
            category=None,
            brand=None,
            series=None,
            page=1,
            page_size=20,
            sort_by="name",
            sort_order="asc"
        )
        print(f"✅ Search completed")
        print(f"   Total: {result.get('total', 0)}")
        print(f"   Items returned: {len(result.get('items', []))}\n")
        
        # Step 3: Check metadata
        parsed = result.get("metadata", {}).get("parsed", {})
        print(f"Step 3: Parsed metadata:")
        print(f"   Category: {parsed.get('category')}")
        print(f"   Brand: {parsed.get('brand')}")
        print(f"   Series: {parsed.get('series')}\n")
        
        # Step 4: Convert to ProductInDB
        print("Step 4: Converting to ProductInDB...")
        items = []
        conversion_errors = []
        
        for i, doc in enumerate(result.get("items", [])):
            try:
                # Ensure _id is a string
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                
                # Try to create ProductInDB
                product = ProductInDB(**doc)
                items.append(product)
                
                if i < 3:
                    print(f"   ✅ Item {i+1}: {product.name}")
            except Exception as e:
                conversion_errors.append((i, str(e), doc.get("name", "Unknown")))
                print(f"   ❌ Item {i+1} failed: {e}")
                if i < 3:
                    print(f"      Doc keys: {list(doc.keys())}")
                    print(f"      Doc sample: {str(doc)[:200]}...")
        
        print(f"\n   Converted: {len(items)}/{len(result.get('items', []))}")
        if conversion_errors:
            print(f"   Errors: {len(conversion_errors)}")
            print(f"\n   First few errors:")
            for idx, error, name in conversion_errors[:3]:
                print(f"     - Item {idx}: {name} - {error}")
        
        # Step 5: Create ProductListResponse
        print(f"\nStep 5: Creating ProductListResponse...")
        try:
            response = ProductListResponse(
                items=items,
                total=result["total"],
                page=result["page"],
                pageSize=result["page_size"]  # Use alias 'pageSize'
            )
            print(f"✅ ProductListResponse created successfully")
            print(f"   Response total: {response.total}")
            print(f"   Response items count: {len(response.items)}")
        except Exception as e:
            print(f"❌ Failed to create ProductListResponse: {e}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_route_simulation())

