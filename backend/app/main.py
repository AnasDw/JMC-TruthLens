#!/usr/bin/env python
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.config import settings
from app.dependencies import initialize_clients, cleanup_clients

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Lifespan starting for {app.title}...")
    await initialize_clients()
    logger.info("Lifespan started")
    yield
    logger.info(f"Lifespan ending for {app.title}...")
    await cleanup_clients()
    logger.info("Lifespan ended")


app = FastAPI(
    debug=settings.debug,
    title=settings.title,
    description=settings.description,
    version=settings.version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_methods=settings.allowed_methods,
    allow_origins=settings.allowed_origins,
    allow_headers=settings.allowed_headers,
)

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

app.include_router(api_router)
