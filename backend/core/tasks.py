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


async def is_factual_claim(groq_client: AsyncGroq, text: str) -> bool:
    try:
        response = await groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": "Determine whether the following input is a factual claim that can be checked or verified. Reply only with 'yes' or 'no'.",
                },
                {"role": "user", "content": text.strip()},
            ],
            max_tokens=1,
        )
        reply = response.choices[0].message.content.strip().lower()
        return reply == "yes"
    except Exception as e:
        logger.debug("Claim check failed, assuming yes: %s", e)
        return True


async def process_fact_check_task(
    task_id: UUID,
    data: TextInputData,
    groq_client: AsyncGroq,
    openai_client: AsyncOpenAI,
    mongo_client: AsyncIOMotorClient,
) -> None:
    original_content = data.content

    try:
        await update_task_status(mongo_client, task_id, TaskStatus.PROCESSING, "Task started processing")

        await update_task_status(mongo_client, task_id, TaskStatus.SUMMARIZING, "Summarizing content")

        summarized_content = await summarize(client=groq_client, text=to_english(text=data.content))
        data.content = summarized_content

        await update_task_status(mongo_client, task_id, TaskStatus.FACT_CHECKING, "Performing fact check analysis")

        fact_check_result, is_cached = await fact_check_process(
            groq_client=groq_client,
            openai_client=openai_client,
            text_data=data,
            mongo_client=mongo_client,
        )

        if not is_cached:
            await add_to_db(mongo_client, fact_check_result)

        await save_task_completion(
            mongo_client,
            task_id,
            original_content,
            summarized_content,
            fact_check_result,
        )

        logger.info(f"Task {task_id} completed successfully")

    except Exception as e:
        logger.error(f"Task {task_id} failed with error: {str(e)}")
        await update_task_status(mongo_client, task_id, TaskStatus.FAILED, f"Task failed: {str(e)}")


async def save_task_completion(
    mongo_client: AsyncIOMotorClient,
    task_id: UUID,
    original_content: str,
    summarized_content: str,
    fact_check_result: "FactCheckResponse",
) -> None:
    """
    Save the completed task with all processing data including original text,
    summarized content, and fact check results.
    """
    try:
        from core.db import update_task_status
        from schemas import TaskStatus

        await update_task_status(
            mongo_client, task_id, TaskStatus.COMPLETED, "Fact check completed successfully", result=fact_check_result
        )

        from core.db import DB_NAME, TASKS_COLLECTION

        collection = mongo_client[DB_NAME][TASKS_COLLECTION]

        await collection.update_one(
            {"task_id": str(task_id)},
            {
                "$set": {
                    "original_content": original_content,
                    "summarized_content": summarized_content,
                    "processing_completed_at": mongo_client.utcnow() if hasattr(mongo_client, "utcnow") else None,
                }
            },
        )

    except Exception as e:
        logger.error(f"Failed to save task completion data for {task_id}: {str(e)}")
