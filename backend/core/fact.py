import os
import asyncio
from typing import Literal, TypedDict

import requests
import ujson
from bs4 import BeautifulSoup
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from pymongo import AsyncMongoClient
from pymongo.typings import _DocumentType
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
                    "to retrieve information helpful for fact-checking the given claim."
                ),
            },
            {"role": "user", "content": claim},
        ],
    )

    search_results = await search_tool(groq_client=groq_client, query=search_query.query)

    final_response = await client.chat.completions.create(
        model="deepseek-r1-distill-llama-70b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a fact checker. Based on the following claim and search results, "
                    "classify the claim as 'correct', 'incorrect', or 'misleading'. "
                    "Provide a reasoned explanation and cite your sources."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Original statement: {claim}\n\n"
                    f"Search results: {ujson.dumps(search_results, escape_forward_slashes=False)}"
                ),
            },
        ],
        response_model=GPTFactCheckModel,
    )

    return final_response


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

    response = FactCheckResponse(
        url=text_data.url,
        label=fact_check_result.label,
        response=fact_check_result.explanation,
        summary=text_data.content,
        references=fact_check_result.sources,
        isSafe=is_safe(text_data.url) if text_data.url else False,
        archive=None,
    )

    if response.label != FactCheckLabel.CORRECT and response.url:
        response.archive = archive_url(response.url)

    return response, False
