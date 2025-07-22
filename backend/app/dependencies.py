import logging
from typing import Optional

from groq import AsyncGroq
from pymongo import AsyncMongoClient

from app.config import settings

logger = logging.getLogger(__name__)

groq_client: Optional[AsyncGroq] = None
mongo_client: Optional[AsyncMongoClient] = None


async def get_groq_client() -> AsyncGroq:
    global groq_client
    if groq_client is None:
        groq_client = AsyncGroq(api_key=settings.groq_api_key)
    return groq_client


async def get_mongo_client() -> AsyncMongoClient:
    global mongo_client
    if mongo_client is None:
        mongo_client = AsyncMongoClient(settings.mongodb_uri)
    return mongo_client


async def initialize_clients():
    global groq_client, mongo_client

    logger.info("Initializing clients...")
    groq_client = AsyncGroq(api_key=settings.groq_api_key)
    mongo_client = AsyncMongoClient(settings.mongodb_uri)
    await mongo_client.aconnect()
    logger.info("Clients initialized successfully")


async def cleanup_clients():
    global groq_client, mongo_client

    logger.info("Cleaning up clients...")
    if mongo_client:
        await mongo_client.aclose()
    logger.info("Clients cleaned up successfully")
