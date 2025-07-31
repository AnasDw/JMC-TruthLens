from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import AnyHttpUrl

from app.dependencies import get_groq_client, get_mongo_client
from core import add_to_db, db_is_working, fact_check_process, summarize, to_english
from schemas import FactCheckResponse, HealthResponse, TextInputData, FactCheckLabel

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
    dummy_response = FactCheckResponse(
        url=AnyHttpUrl("https://edition.cnn.com/politics/live-news/trump-epstein-files-news-07-24-25?t=1753530172169"),
        label=FactCheckLabel.MISLEADING,
        summary=(
            "Plant-based meats have an image problem, despite being tasty and environmentally friendly. "
            "They reduce greenhouse gas emissions by up to 98% and land use by up to 97% compared to beef burgers. "
            "However, doctors and dietitians are hesitant to recommend them due to being viewed as ultraprocessed, "
            "despite being a valid option for shifting towards plant-forward diets."
        ),
        response=(
            "The claim is misleading because it accurately presents the environmental benefits and the hesitancy "
            "from health professionals due to ultra-processing but fails to address the variability in nutritional "
            "content among plant-based products, which can affect their healthiness."
        ),
        isSafe=False,
        archive="https://web.archive.org/web/20250726114927/https://edition.cnn.com/politics/live-news/trump-epstein-files-news-07-24-25?t=1753530172169",
        references=[
            AnyHttpUrl("https://www.sciencedirect.com/science/article/pii/S2666833522000612"),
            AnyHttpUrl("https://www.cas.org/resources/cas-insights/going-green-plant-based-meat-sustainability"),
            AnyHttpUrl("https://www.sciencedirect.com/science/article/pii/S0963996924002540"),
        ],
        updatedAt=datetime.utcnow(),
    )

    return dummy_response

    data.content = await summarize(client=groq_client, text=to_english(text=data.content))

    fact_check, is_present_in_db = await fact_check_process(
        groq_client=groq_client, text_data=data, mongo_client=mongo_client
    )

    if not is_present_in_db:
        background_tasks.add_task(add_to_db, mongo_client, fact_check)

    print(fact_check, is_present_in_db)
    return fact_check
