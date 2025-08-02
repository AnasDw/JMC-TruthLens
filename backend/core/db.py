from typing import Optional
from uuid import UUID

import ujson
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import AsyncMongoClient
from pymongo.errors import PyMongoError
from pymongo.typings import _DocumentType
from datetime import datetime

from schemas import FactCheckResponse, TextInputData, TaskData, TaskStatus


DB_NAME = "truthLens"
COLLECTION_NAME = "articles"
TASKS_COLLECTION = "tasks"


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


async def create_task(client: AsyncIOMotorClient, task_data: TaskData) -> None:
    """Create a new task in the database"""
    try:
        collection = client[DB_NAME][TASKS_COLLECTION]
        payload = ujson.loads(task_data.model_dump_json())
        await collection.insert_one(payload)
    except PyMongoError:
        pass


async def update_task_status(
    client: AsyncIOMotorClient,
    task_id: UUID,
    status: TaskStatus,
    message: str = "",
    result: Optional[FactCheckResponse] = None,
) -> None:
    """Update the status of a task"""
    try:
        collection = client[DB_NAME][TASKS_COLLECTION]
        update_data = {"status": status.value, "message": message, "updated_at": datetime.now().isoformat()}
        if result:
            update_data["result"] = ujson.loads(result.model_dump_json())

        await collection.update_one({"task_id": str(task_id)}, {"$set": update_data})
    except PyMongoError:
        pass


async def get_task_status(client: AsyncIOMotorClient, task_id: UUID) -> Optional[TaskData]:
    """Get the current status of a task"""
    try:
        collection = client[DB_NAME][TASKS_COLLECTION]
        task_doc = await collection.find_one({"task_id": str(task_id)})
        if task_doc:
            # Convert task_id back to UUID and create a new dict
            task_dict = dict(task_doc)
            task_dict["task_id"] = UUID(task_dict["task_id"])
            return TaskData.model_validate(task_dict)
        return None
    except (PyMongoError, ValueError):
        return None
