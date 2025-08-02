from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import AnyHttpUrl

from app.dependencies import get_groq_client, get_openai_client, get_mongo_client
from core import add_to_db, db_is_working
from core.db import create_task, get_task_status
from core.tasks import process_fact_check_task
from schemas import (
    FactCheckResponse,
    HealthResponse,
    TextInputData,
    FactCheckLabel,
    TaskResponse,
    TaskStatusResponse,
    TaskData,
    TaskStatus,
)

router = APIRouter()


@router.get("/health/", response_model=HealthResponse)
async def health(mongo_client=Depends(get_mongo_client)) -> HealthResponse:
    return HealthResponse(database_is_working=await db_is_working(mongo_client))


@router.post("/verify/text/", response_model=TaskResponse)
async def verify_news(
    data: TextInputData,
    background_tasks: BackgroundTasks,
    groq_client=Depends(get_groq_client),
    openai_client=Depends(get_openai_client),
    mongo_client=Depends(get_mongo_client),
) -> TaskResponse:
    task_id = uuid4()

    task_data = TaskData(
        task_id=task_id, status=TaskStatus.PENDING, message="Task created and queued for processing", input_data=data
    )

    await create_task(mongo_client, task_data)

    background_tasks.add_task(process_fact_check_task, task_id, data, groq_client, openai_client, mongo_client)

    return TaskResponse(task_id=task_id, status=TaskStatus.PENDING, message="Task created and queued for processing")


@router.get("/task/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status_endpoint(
    task_id: str,
    mongo_client=Depends(get_mongo_client),
) -> TaskStatusResponse:
    try:
        from uuid import UUID

        task_uuid = UUID(task_id)
        task_data = await get_task_status(mongo_client, task_uuid)

        if not task_data:
            return TaskStatusResponse(
                task_id=task_uuid,
                status=TaskStatus.FAILED,
                message="Task not found",
                result=None,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )

        return TaskStatusResponse(
            task_id=task_data.task_id,
            status=task_data.status,
            message=task_data.message,
            result=task_data.result,
            created_at=task_data.created_at,
            updated_at=task_data.updated_at,
        )

    except ValueError:
        return TaskStatusResponse(
            task_id=task_uuid if "task_uuid" in locals() else uuid4(),
            status=TaskStatus.FAILED,
            message="Invalid task ID format",
            result=None,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
