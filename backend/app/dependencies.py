import logging
import asyncio
from typing import Optional

from groq import AsyncGroq
from openai import AsyncOpenAI
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError

from app.config import settings

logger = logging.getLogger(__name__)

groq_client: Optional[AsyncGroq] = None
openai_client: Optional[AsyncOpenAI] = None
mongo_client: Optional[AsyncIOMotorClient] = None


async def get_groq_client() -> AsyncGroq:
    global groq_client
    if groq_client is None:
        groq_client = AsyncGroq(api_key=settings.groq_api_key)
    return groq_client


async def get_openai_client() -> AsyncOpenAI:
    global openai_client
    if openai_client is None:
        openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
    return openai_client


async def get_mongo_client() -> AsyncIOMotorClient:
    global mongo_client
    if mongo_client is None:
        mongo_client = AsyncIOMotorClient(settings.mongodb_uri)
    return mongo_client


async def wait_for_mongo_ready(client: AsyncIOMotorClient, retries: int = 5, delay: int = 2):
    for attempt in range(1, retries + 1):
        try:
            await client.admin.command("ping")
            logger.info("MongoDB connection successful.")
            return
        except ServerSelectionTimeoutError as e:
            logger.warning(f"⏳ MongoDB not ready (attempt {attempt}/{retries}): {e}")
            await asyncio.sleep(delay)
    raise RuntimeError("MongoDB not reachable after retries.")


async def initialize_clients():
    global groq_client, openai_client, mongo_client

    logger.info("Initializing external clients...")

    groq_client = AsyncGroq(api_key=settings.groq_api_key)
    openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

    mongo_client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=2000)
    await wait_for_mongo_ready(mongo_client)

    logger.info("All clients initialized.")


async def cleanup_clients():
    global mongo_client

    logger.info("🧹 Cleaning up external clients...")
    if mongo_client:
        mongo_client.close()  # Motor uses .close(), not .aclose()
        logger.info("MongoDB connection closed.")
