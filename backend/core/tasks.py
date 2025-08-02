import logging
from uuid import UUID
from typing import Optional

from groq import AsyncGroq
from openai import AsyncOpenAI
from motor.motor_asyncio import AsyncIOMotorClient

from core.db import update_task_status, add_to_db
from core.fact import fact_check_process
from core.preprocessors import summarize, to_english
from schemas import TaskStatus, TextInputData, FactCheckResponse

logger = logging.getLogger(__name__)


async def process_fact_check_task(
    task_id: UUID,
    data: TextInputData,
    groq_client: AsyncGroq,
    openai_client: AsyncOpenAI,
    mongo_client: AsyncIOMotorClient,
) -> None:
    """
    Background task processor for fact-checking.
    Updates task status throughout the process.
    """
    try:
        # Update status to processing
        await update_task_status(mongo_client, task_id, TaskStatus.PROCESSING, "Task started processing")

        # Step 1: Summarization
        await update_task_status(mongo_client, task_id, TaskStatus.SUMMARIZING, "Summarizing content")

        summarized_content = await summarize(client=groq_client, text=to_english(text=data.content))
        data.content = summarized_content

        # Step 2: Fact checking
        await update_task_status(mongo_client, task_id, TaskStatus.FACT_CHECKING, "Performing fact check analysis")

        fact_check_result, is_cached = await fact_check_process(
            groq_client=groq_client, openai_client=openai_client, text_data=data, mongo_client=mongo_client
        )

        # Step 3: Save to database if not cached
        if not is_cached:
            await add_to_db(mongo_client, fact_check_result)

        # Step 4: Mark as completed
        await update_task_status(
            mongo_client, task_id, TaskStatus.COMPLETED, "Fact check completed successfully", result=fact_check_result
        )

        logger.info(f"Task {task_id} completed successfully")

    except Exception as e:
        logger.error(f"Task {task_id} failed with error: {str(e)}")
        await update_task_status(mongo_client, task_id, TaskStatus.FAILED, f"Task failed: {str(e)}")
