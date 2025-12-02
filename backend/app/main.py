from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import get_db_dep
from . import routes_auth, routes_products


app = FastAPI(title=settings.APP_NAME)


origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_auth.router)
app.include_router(routes_products.router)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok"}


@app.get("/db-health", tags=["system"])
async def db_health(db=Depends(get_db_dep)):
    # simple ping; motor doesn't have explicit ping, but a find_one is enough
    await db.command("ping")
    return {"status": "ok"}


@app.get("/parse/mock", tags=["import"])
async def mock_parse():
    """Mock parse endpoint returning sample parsed rows for AdminImport prototype."""
    return {
        "import_id": "mock-import-1",
        "file_name": "RetailProducts_01May2024.pdf",
        "rows": [
            {
                "temp_id": "1",
                "sku": "LK-CB91102LW00",
                "name": "Entice 1 Way Switch 10AX",
                "brand": "Lauritz Knudsen",
                "category": "Switches",
                "series": "Entice",
                "list_price": 249,
                "currency": "INR",
                "page": 12,
                "confidence": 0.95,
                "image_url": "https://res.cloudinary.com/demo/image/upload/v1/entice1.jpg",
            }
        ],
    }


