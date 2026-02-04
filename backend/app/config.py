from pydantic_settings import BaseSettings
from pydantic import AnyUrl
import logging
import sys

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    APP_NAME: str = "New Delhi Electricals API"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"  # Can be DEBUG, INFO, WARNING, ERROR, CRITICAL

    MONGODB_URI: str
    MONGODB_DB_NAME: str = "nde_catalog"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8

    # Admin credentials (stored in .env as plain text for this project)
    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str

    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None
    CLOUDINARY_UPLOAD_PRESET: str | None = None

    # Email settings
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_FROM_NAME: str = "New Delhi Electricals"
    ADMIN_EMAIL: str | None = None

    CORS_ORIGINS: str = "*"  # comma-separated for simplicity in v1

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

def configure_logging():
    """Configure logging based on environment."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # In production, reduce noise from third-party libraries
    if settings.APP_ENV == "production":
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("motor").setLevel(logging.WARNING)
        logging.getLogger("pymongo").setLevel(logging.WARNING)
    
    # Never log sensitive information
    # Ensure password fields are not logged
    logging.getLogger("passlib").setLevel(logging.WARNING)

# Configure logging on module import
configure_logging()

