from pydantic_settings import BaseSettings
from pydantic import AnyUrl


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    APP_NAME: str = "New Delhi Electricals API"
    APP_ENV: str = "development"

    MONGODB_URI: str
    MONGODB_DB_NAME: str = "nde_catalog"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8

    ADMIN_EMAIL: str
    ADMIN_PASSWORD_HASH: str | None = None  # optional pre-seeded hash

    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None
    CLOUDINARY_UPLOAD_PRESET: str | None = None

    CORS_ORIGINS: str = "*"  # comma-separated for simplicity in v1

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()


