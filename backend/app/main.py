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

# Mount public directory for static files
from fastapi.staticfiles import StaticFiles
import os

# Get the absolute path to the public directory
# main.py is in app/, so we go up one level to backend/ then to public/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

# Ensure public directory exists
if os.path.exists(PUBLIC_DIR):
    app.mount("/public", StaticFiles(directory=PUBLIC_DIR), name="public")


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok"}


@app.get("/db-health", tags=["system"])
async def db_health(db=Depends(get_db_dep)):
    # simple ping; motor doesn't have explicit ping, but a find_one is enough
    await db.command("ping")
    return {"status": "ok"}


