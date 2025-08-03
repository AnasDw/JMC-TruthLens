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
    prompt = (
        "Your job is to determine if a piece of text is a factual claim that can be checked for truthfulness using evidence.\n"
        "Only answer 'yes' if the input is:\n"
        "- A complete sentence or assertion\n"
        "- Expressing a fact about the world\n"
        "- Can be proven true or false based on evidence (e.g., news articles, data)\n\n"
        "Do NOT count the following as claims:\n"
        "- Greetings\n"
        "- Personal emotions or opinions\n"
        "- Product names or buzzwords (like 'AI-powered verification')\n"
        "- Short fragments or slogans\n\n"
        "Respond only with 'yes' or 'no'.\n\n"
        f'Text: "{text.strip()}"'
    )

    try:
        response = await groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=5,
        )
        reply = response.choices[0].message.content.strip().lower()
        return reply == "yes"
    except Exception as e:
        logger.warning("Claim check failed: %s", e)
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
