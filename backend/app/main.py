from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import get_db_dep
from .routes import auth, catalog_import, products


app = FastAPI(title=settings.APP_NAME)


origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(catalog_import.router)
app.include_router(catalog_import.cloudinary_router)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok"}


@app.get("/db-health", tags=["system"])
async def db_health(db=Depends(get_db_dep)):
    # simple ping; motor doesn't have explicit ping, but a find_one is enough
    await db.command("ping")
    return {"status": "ok"}


