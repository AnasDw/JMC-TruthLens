import asyncio
import logging
from typing import Literal, TypedDict, Optional, List

import httpx
import ujson
from bs4 import BeautifulSoup
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, AnyHttpUrl
from groq import AsyncGroq
import instructor

from app.config import settings
from core.db import fetch_from_db_if_exists
from core.preprocessors import summarize  # existing summarize; may or may not accept target_lang
from core.postprocessors import archive_url, is_safe
from schemas.schemas import (
    FactCheckLabel,
    FactCheckResponse,
    GPTFactCheckModel,
    TextInputData,
)

logger = logging.getLogger(__name__)

GOOGLE_CSE_URL = "https://www.googleapis.com/customsearch/v1"

# -----------------------
# Tunables / constants
# -----------------------
HTTP_TIMEOUT_SECONDS = 15
FETCH_CONCURRENCY = 8
USER_AGENT = "Mozilla/5.0 (compatible; fact-checker/1.0; +https://example.org/bot)"

TITLE_MAX_CHARS = 300
CONTENT_SNIPPET_MAX_CHARS = 500
SERIALIZED_RESULTS_MAX_CHARS = 3000
MAX_ITEMS_FOR_MODEL = 5  # cap results before serializing to keep token budget tight

DEFAULT_SUMMARY_LANG: Literal["en", "source", "auto"] = "en"


class SearchResult(TypedDict):
    title: str
    link: str
    content: str


class SearchQuery(BaseModel):
    query: str


# -------------------------------------------
# Internal helper: resilient summarization
# -------------------------------------------
async def _summarize_text(
    groq_client: AsyncGroq,
    text: str,
    target_lang: Literal["en", "source", "auto"] = DEFAULT_SUMMARY_LANG,
) -> str:
    """
    Calls your existing summarize() while being compatible with older versions that
    don't support the 'target_lang' kwarg.
    """
    try:
        # Newer version that accepts target_lang
        return await summarize(groq_client, text, target_lang=target_lang)  # type: ignore[misc]
    except TypeError:
        # Backward compatibility: summarize(client, text)
        logger.debug("summarize() does not accept target_lang; falling back to default signature.")
        return await summarize(groq_client, text)


# -------------------------------------------
# Content fetching & scraping
# -------------------------------------------
async def get_content(
    groq_client: AsyncGroq,
    url: str,
    client: httpx.AsyncClient,
    *,
    summary_lang: Literal["en", "source", "auto"] = DEFAULT_SUMMARY_LANG,
) -> Optional[str]:
    """
    Fetches a URL and returns a summarized text of its content.
    Returns None if fetch fails.
    """
    if not url:
        return None

    try:
        resp = await client.get(url, timeout=HTTP_TIMEOUT_SECONDS, headers={"User-Agent": USER_AGENT})
        resp.raise_for_status()
    except httpx.HTTPError as e:
        logger.debug("HTTP fetch failed for %s: %s", url, e)
        return None

    try:
        # Use a space separator to avoid concatenating words from different nodes
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text(" ", strip=True)
        if not text:
            return None
        return await _summarize_text(groq_client, text, target_lang=summary_lang)
    except Exception as e:
        logger.debug("Parsing/summarization failed for %s: %s", url, e)
        return None


async def get_url_content(
    groq_client: AsyncGroq,
    item: dict,
    client: httpx.AsyncClient,
    *,
    summary_lang: Literal["en", "source", "auto"] = DEFAULT_SUMMARY_LANG,
) -> SearchResult:
    link = str(item.get("link") or "")
    title = str(item.get("title") or "")[:TITLE_MAX_CHARS]
    snippet = str(item.get("snippet") or "")

    content = await get_content(groq_client, link, client, summary_lang=summary_lang)
    return {
        "title": title,
        "link": link,
        "content": content or snippet,
    }


# -------------------------------------------
# Google CSE search
# -------------------------------------------
async def search_tool(
    groq_client: AsyncGroq,
    query: str,
    num_results: int = 3,
    *,
    summary_lang: Literal["en", "source", "auto"] = DEFAULT_SUMMARY_LANG,
) -> List[SearchResult]:
    """
    Runs a Google CSE query, fetches each result, extracts & summarizes page text, and returns results.
    """
    params = {
        "key": settings.google_api_key,
        "cx": settings.google_cse_id,
        "q": query,
        "num": max(1, min(num_results, MAX_ITEMS_FOR_MODEL)),  # be conservative
        "hl": "en",  # bias snippets in English
    }

    headers = {"User-Agent": USER_AGENT}

    async with httpx.AsyncClient(headers=headers, timeout=HTTP_TIMEOUT_SECONDS) as client:
        try:
            resp = await client.get(GOOGLE_CSE_URL, params=params)
            resp.raise_for_status()
            search_data = ujson.loads(resp.text)
            items = search_data.get("items", []) or []
        except httpx.HTTPError as e:
            logger.error("CSE request failed: %s", e)
            items = []
        except ValueError as e:
            logger.error("Failed to parse CSE response: %s", e)
            items = []

        # Filter to items with a link field and limit to requested count
        items = [it for it in items if it.get("link")]  # basic sanity
        items = items[: params["num"]]

        sem = asyncio.Semaphore(FETCH_CONCURRENCY)

        async def bound_fetch(it: dict) -> SearchResult:
            async with sem:
                return await get_url_content(groq_client, it, client, summary_lang=summary_lang)

        if not items:
            return []

        return await asyncio.gather(*[bound_fetch(it) for it in items])


# -------------------------------------------
# Fact-check orchestration
# -------------------------------------------
async def fact_check(groq_client: AsyncGroq, data: TextInputData) -> GPTFactCheckModel:
    """
    Uses the LLM to:
    1) Craft a focused search query for the claim
    2) Search + fetch + summarize top hits
    3) Ask the LLM to classify: correct / incorrect / misleading
    """
    claim = data.content
    client = instructor.from_groq(groq_client)

    # Step 1: Generate a search query
    try:
        search_query = await client.chat.completions.create(
            model="llama3-8b-8192",
            response_model=SearchQuery,
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
        query_text = search_query.query
    except Exception as e:
        logger.error("Error generating search query: %s", e)
        query_text = (claim or "")[:100] or "news"

    # Step 2: Retrieve search results (summarized in English for coherence)
    search_results = await search_tool(
        groq_client=groq_client,
        query=query_text,
        num_results=3,
        summary_lang="en",
    )

    # Build a compact payload for the model: trim length *before* serialization
    truncated_results: List[SearchResult] = []
    for res in search_results:
        title = (res.get("title") or "")[:TITLE_MAX_CHARS]
        link = res.get("link") or ""
        content = res.get("content") or ""

        if len(content) > CONTENT_SNIPPET_MAX_CHARS:
            content = content[:CONTENT_SNIPPET_MAX_CHARS] + "..."

        truncated_results.append({"title": title, "link": link, "content": content})

    # Limit by count first, then by serialized size
    truncated_results = truncated_results[:MAX_ITEMS_FOR_MODEL]
    search_results_text = ujson.dumps(truncated_results, escape_forward_slashes=False)
    if len(search_results_text) > SERIALIZED_RESULTS_MAX_CHARS:
        # Drop from the end until under budget
        for _ in range(len(truncated_results)):
            if len(search_results_text) <= SERIALIZED_RESULTS_MAX_CHARS:
                break
            truncated_results.pop()
            search_results_text = ujson.dumps(truncated_results, escape_forward_slashes=False)

    # Step 3: Ask the model to classify the claim
    try:
        final_response = await client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            response_model=GPTFactCheckModel,
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
            max_retries=3,
        )
        return final_response
    except Exception as e:
        logger.error("Error in fact checking with instructor: %s", e)
        return GPTFactCheckModel(
            label=FactCheckLabel.MISLEADING,
            explanation=f"Unable to complete fact-check due to technical error. Claim: {claim}",
            sources=[],
        )


# -------------------------------------------
# Public entry point with DB cache
# -------------------------------------------
async def fact_check_process(
    groq_client: AsyncGroq,
    text_data: TextInputData,
    mongo_client: AsyncIOMotorClient,
) -> tuple[FactCheckResponse, bool]:
    cached_result = await fetch_from_db_if_exists(mongo_client, text_data)
    if cached_result:
        return cached_result, True

    # Compute
    fact_check_result = await fact_check(groq_client, text_data)

    # Validate URLs
    valid_references: List[AnyHttpUrl] = []
    for src in fact_check_result.sources or []:
        if not src or not isinstance(src, str):
            continue
        try:
            valid_references.append(AnyHttpUrl(src))  # type: ignore[call-arg]
        except Exception as e:
            logger.debug("Invalid URL skipped: %r (%s)", src, e)

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
        try:
            response.archive = archive_url(response.url)
        except Exception as e:
            logger.debug("Archiving failed for %s: %s", response.url, e)

    return response, False
