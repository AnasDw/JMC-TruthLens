import os
from typing import Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    env: str = os.getenv("ENV", "dev")
    debug: bool = env == "dev"

    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

    title: str = "TruthLens API"
    description: str = "API for TruthLens - a news summarization and fact checking app."
    version: str = "0.1.0"

    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", "8000"))

    allowed_origins: list[str] = ["*"]
    allowed_methods: list[str] = ["*"]
    allowed_headers: list[str] = ["*"]

    groq_api_key: Optional[str] = os.getenv("GROQ_API_KEY")

    class Config:
        env_file = ".env"


settings = Settings()
