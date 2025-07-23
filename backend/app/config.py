from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    env: str = Field(default="dev", env="ENV")
    debug: bool = False

    mongo_uri: str = Field(default="mongodb://localhost:27017", env="MONGO_URI")

    title: str = "TruthLens API"
    description: str = "API for TruthLens - a news summarization and fact checking app."
    version: str = "0.1.0"

    host: str = "0.0.0.0"
    port: int = Field(default=8000, env="PORT")

    allowed_origins: list[str] = ["*"]
    allowed_methods: list[str] = ["*"]
    allowed_headers: list[str] = ["*"]

    groq_api_key: Optional[str] = Field(default=None, env="GROQ_API_KEY")
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    google_api_key: str = Field(..., env="GOOGLE_API_KEY")
    google_cse_id: str = Field(..., env="GOOGLE_CSE_ID")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        object.__setattr__(self, "debug", self.env == "dev")


def validate_settings(s: Settings) -> None:
    missing_keys = []

    if not s.groq_api_key:
        missing_keys.append("GROQ_API_KEY")
    if not s.openai_api_key:
        missing_keys.append("OPENAI_API_KEY")
    if not s.google_api_key:
        missing_keys.append("GOOGLE_API_KEY")
    if not s.google_cse_id:
        missing_keys.append("GOOGLE_CSE_ID")

    if missing_keys:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_keys)}")


try:
    settings = Settings()
    validate_settings(settings)
except Exception as e:
    print(f"Error loading settings: {e}")
    raise SystemExit(1) from e
