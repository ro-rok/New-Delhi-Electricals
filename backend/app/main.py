from datetime import datetime
import logging

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from .config import settings
from .db import get_db_dep
from .routes import auth, catalog_import, products, inquiries
from .keepalive_service import keepalive_service
from .schemas import ErrorResponse

# Initialize logger
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME)

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin]

# When using "*", we cannot use allow_credentials=True (CORS spec requirement)
# So we need to handle this case specially
if origins == ["*"] or not origins:
    # Allow all origins, but disable credentials
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Specific origins - can use credentials
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(catalog_import.router)
app.include_router(catalog_import.cloudinary_router)
app.include_router(inquiries.router)

# Exception handlers for consistent error responses
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors"""
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            message="Validation failed",
            code="VALIDATION_ERROR",
            details={"errors": exc.errors()},
            timestamp=datetime.utcnow()
        ).model_dump(by_alias=True)
    )

@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors"""
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            message="Validation failed",
            code="VALIDATION_ERROR",
            details={"errors": exc.errors()},
            timestamp=datetime.utcnow()
        ).model_dump(by_alias=True)
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    # Log error without sensitive information
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {type(exc).__name__}",
        exc_info=settings.APP_ENV != "production"  # Only include traceback in non-production
    )
    
    # In production, return generic error message
    # In development, include more details
    error_message = "An internal error occurred"
    if settings.APP_ENV != "production":
        error_message = f"{error_message}: {str(exc)}"
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            message=error_message,
            code="INTERNAL_ERROR",
            timestamp=datetime.utcnow()
        ).model_dump(by_alias=True)
    )

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

@app.get("/api/keepalive", tags=["system"])
async def keepalive():
    """Endpoint the keep-alive loop pings to keep the service warm."""
    return {
        "message": "keepalive ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

@app.on_event("startup")
async def start_keepalive():
    # Only start once; service handles internal loop and cancellation
    keepalive_service.start()

@app.on_event("shutdown")
async def stop_keepalive():
    await keepalive_service.stop()

