#!/usr/bin/env python
import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import AsyncGroq
from pymongo import AsyncMongoClient

from core import add_to_db, db_is_working, fact_check_process, summarize, to_english
from schemas import FactCheckResponse, HealthResponse, TextInputData

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables
ENV = os.environ.get("ENV", "dev")
DEBUG = ENV == "dev"
URI = "mongodb://localhost:27017"

groq_client = AsyncGroq()
mongo_client = AsyncMongoClient(URI)  # type: ignore


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages the lifespan of the FastAPI app."""
    logger.info(f"Lifespan starting for {app.title}...")
    await mongo_client.aconnect()
    logger.info("Lifespan started")
    yield
    logger.info(f"Lifespan ending for {app.title}...")
    await mongo_client.aclose()
    logger.info("Lifespan ended")


# FastAPI app
app = FastAPI(
    debug=DEBUG,
    title="TruthLens API",
    description="API for TruthLens - a news summarization and fact checking app.",
    version="0.1.0",
    lifespan=lifespan,
)

# FastAPI CORS
app.add_middleware(
    CORSMiddleware,
    allow_methods=["*"],
    allow_origins=["*"],
    allow_headers=["*"],
)

# Middleware for logging requests
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response


@app.get("/health/")
async def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(database_is_working=await db_is_working(mongo_client))  # type: ignore


@app.post("/verify/text/")
async def verify_news(data: TextInputData, background_tasks: BackgroundTasks) -> FactCheckResponse:
    """Endpoint to verify a news article."""
    data.content = await summarize(groq_client, to_english(data.content))
    fact_check, is_present_in_db = await fact_check_process(groq_client, data, mongo_client, "text")  # type: ignore
    if not is_present_in_db:
        background_tasks.add_task(add_to_db, mongo_client, fact_check)  # type: ignore
    return fact_check
