import asyncio
from typing import Literal, TypedDict
import logging

import requests
import ujson
from bs4 import BeautifulSoup
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from groq import AsyncGroq
import instructor

from app.config import settings
from core.db import fetch_from_db_if_exists
from core.preprocessors import summarize
from core.postprocessors import archive_url, is_safe
from schemas.schemas import (
    FactCheckLabel,
    FactCheckResponse,
    GPTFactCheckModel,
    TextInputData,
)

logger = logging.getLogger(__name__)

GOOGLE_CSE_URL = "https://www.googleapis.com/customsearch/v1"


class SearchResult(TypedDict):
    title: str
    link: str
    content: str


class SearchQuery(BaseModel):
    query: str


async def get_content(groq_client: AsyncGroq, url: str) -> str | None:
    try:
        with requests.get(url, timeout=15) as res:
            res.raise_for_status()
            soup = BeautifulSoup(res.text, "html.parser")
            return await summarize(groq_client, soup.get_text())
    except requests.exceptions.RequestException:
        return None


async def get_url_content(groq_client: AsyncGroq, item: dict) -> SearchResult:
    content = await get_content(groq_client, str(item.get("link", "")))
    return {
        "title": item["title"],
        "link": item["link"],
        "content": content or item.get("snippet", ""),
    }


async def search_tool(groq_client: AsyncGroq, query: str, num_results: int = 3) -> list[SearchResult]:
    params = {
        "key": settings.google_api_key,
        "cx": settings.google_cse_id,
        "q": query,
        "num": num_results,
    }

    resp = requests.get(GOOGLE_CSE_URL, params=params, timeout=15)
    resp.raise_for_status()

    search_data = ujson.loads(resp.text)
    items = search_data.get("items", [])

    tasks = [get_url_content(groq_client, item) for item in items]
    return await asyncio.gather(*tasks)


async def fact_check(groq_client: AsyncGroq, data: TextInputData) -> GPTFactCheckModel:
    claim = data.content
    client = instructor.from_groq(groq_client)

    try:
        search_query = await client.chat.completions.create(
            model="llama3-8b-8192",
            response_model=SearchQuery,
            tools=[],
            tool_choice="none",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a fact-check researcher. Frame an appropriate search query "
                        "to retrieve information helpful for fact-checking the given claim. "
                        "Return only a simple search query string."
                    ),
                },
                {"role": "user", "content": claim},
            ],
            max_retries=2,
        )
    except Exception as e:
        logger.error(f"Error generating search query: {e}")
        search_query = SearchQuery(query=claim[:100])

    search_results = await search_tool(groq_client=groq_client, query=search_query.query)

    truncated_results = []
    for result in search_results:
        truncated_result = {
            "title": result["title"][:200] if result["title"] else "",
            "link": result["link"],
            "content": (
                result["content"][:500] + "..."
                if result["content"] and len(result["content"]) > 500
                else result["content"] or ""
            ),
        }
        truncated_results.append(truncated_result)

    search_results_text = ujson.dumps(truncated_results, escape_forward_slashes=False)
    max_search_results_chars = 3000
    if len(search_results_text) > max_search_results_chars:
        search_results_text = search_results_text[:max_search_results_chars] + "...}]"
        logger.debug(f"Search results truncated to {max_search_results_chars} characters")

    try:
        final_response = await client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a fact checker. Based on the following claim and search results, "
                        "classify the claim as exactly one of: 'correct', 'incorrect', or 'misleading'. "
                        "Provide a clear explanation and list any relevant source URLs. "
                        "Be precise with your classification - use 'correct' for true claims, "
                        "'incorrect' for false claims, and 'misleading' for partially true or ambiguous claims."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Claim to fact-check: {claim}\n\n"
                        f"Search results for reference:\n{search_results_text}\n\n"
                        f"Please provide:\n"
                        f"1. A classification (correct/incorrect/misleading)\n"
                        f"2. A detailed explanation\n"
                        f"3. Relevant source URLs if available"
                    ),
                },
            ],
            response_model=GPTFactCheckModel,
            max_retries=3,
        )
        return final_response
    except Exception as e:
        logger.error(f"Error in fact checking with instructor: {e}")
        return GPTFactCheckModel(
            label=FactCheckLabel.MISLEADING,
            explanation=f"Unable to complete fact-check due to technical error. Claim: {claim}",
            sources=[],
        )


async def fact_check_process(
    groq_client: AsyncGroq,
    text_data: TextInputData,
    mongo_client: AsyncIOMotorClient,
    dtype: Literal["image", "text"],
) -> tuple[FactCheckResponse, bool]:
    cached_result = await fetch_from_db_if_exists(mongo_client, text_data)
    if cached_result:
        return cached_result, True

    fact_check_result = await fact_check(groq_client, text_data)

    valid_references = []
    for source in fact_check_result.sources or []:
        try:
            if source and isinstance(source, str):
                if source.startswith(("http://", "https://")):
                    from pydantic import AnyHttpUrl

                    valid_url = AnyHttpUrl(source)
                    valid_references.append(valid_url)
        except Exception as e:
            logger.warning(f"Invalid URL skipped: {source} - {e}")
            continue

    response = FactCheckResponse(
        url=text_data.url,
        label=fact_check_result.label,
        response=fact_check_result.explanation,
        summary=text_data.content,
        references=valid_references,
        isSafe=is_safe(text_data.url) if text_data.url else False,
        archive=None,
    )

    if response.label != FactCheckLabel.CORRECT and response.url:
        response.archive = archive_url(response.url)

    return response, False
