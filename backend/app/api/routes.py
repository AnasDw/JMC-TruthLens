from fastapi import APIRouter, BackgroundTasks, Depends

from app.dependencies import get_groq_client, get_mongo_client
from core import add_to_db, db_is_working, fact_check_process, summarize, to_english
from schemas import FactCheckResponse, HealthResponse, TextInputData

router = APIRouter()


@router.get("/health/", response_model=HealthResponse)
async def health(mongo_client=Depends(get_mongo_client)) -> HealthResponse:
    return HealthResponse(database_is_working=await db_is_working(mongo_client))


@router.post("/verify/text/", response_model=FactCheckResponse)
async def verify_news(
    data: TextInputData,
    background_tasks: BackgroundTasks,
    groq_client=Depends(get_groq_client),
    mongo_client=Depends(get_mongo_client),
) -> FactCheckResponse:
    data.content = await summarize(client=groq_client, text=to_english(text=data.content))
    fact_check, is_present_in_db = await fact_check_process(
        groq_client=groq_client, text_data=data, mongo_client=mongo_client, dtype="text"
    )

    if not is_present_in_db:
        background_tasks.add_task(add_to_db, mongo_client, fact_check)

    return fact_check
