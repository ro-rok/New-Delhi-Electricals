from typing import Generator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URI)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    client = get_client()
    return client[settings.MONGODB_DB_NAME]


async def get_db_dep() -> Generator[AsyncIOMotorDatabase, None, None]:
    db = get_db()
    try:
        yield db
    finally:
        # motor uses a shared client; we don't close per-request
        pass



