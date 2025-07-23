from typing import Optional

import ujson
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import AsyncMongoClient
from pymongo.errors import PyMongoError
from pymongo.typings import _DocumentType

from schemas import FactCheckResponse, TextInputData


DB_NAME = "truthLens"
COLLECTION_NAME = "articles"


async def db_is_working(client: AsyncMongoClient[_DocumentType]) -> bool:
    try:
        response = await client[DB_NAME].command("ping")
        return response.get("ok") == 1
    except PyMongoError:
        return False


async def add_to_db(client: AsyncMongoClient[_DocumentType], data: FactCheckResponse) -> None:
    try:
        collection = client[DB_NAME][COLLECTION_NAME]
        payload = ujson.loads(data.model_dump_json())
        await collection.insert_one(payload)
    except PyMongoError:
        pass


async def fetch_from_db_if_exists(
    client: AsyncIOMotorClient,
    data: TextInputData,
) -> Optional[FactCheckResponse]:
    try:
        collection = client[DB_NAME][COLLECTION_NAME]
        existing = await collection.find_one({"summary": data.content})
        if existing:
            print(existing)
            return FactCheckResponse.model_validate(existing)
        return None
    except PyMongoError:
        return None
