import asyncio
import sys
sys.path.insert(0, '.')
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def check():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    doc = await db.products.find_one({"sku": "POLY-FR-0.75-100"})
    if doc:
        print("=== Document Structure ===")
        print("Keys:", list(doc.keys()))
        print("\n=== Pricing Fields ===")
        print("Has 'pricing' key:", "pricing" in doc)
        print("Has 'catalog_source' key:", "catalog_source" in doc)
        print("\nTop-level pricing:", doc.get("pricing"))
        
        catalog_source = doc.get("catalog_source")
        print("\nCatalog source:", catalog_source)
        if catalog_source:
            print("  - Has pricing in catalog_source:", "pricing" in catalog_source)
            if "pricing" in catalog_source:
                print("  - catalog_source.pricing:", catalog_source.get("pricing"))
                print("  - catalog_source.pricing.discount:", catalog_source.get("pricing", {}).get("discount"))
    else:
        print("Product not found")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(check())

