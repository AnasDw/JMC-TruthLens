from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, Field, field_validator


class TextInputData(BaseModel):
    url: Optional[AnyHttpUrl] = Field(None, description="The url of the article")
    content: str = Field("", description="The content of the article")


class FactCheckLabel(str, Enum):
    CORRECT = "correct"
    INCORRECT = "incorrect"
    MISLEADING = "misleading"


class GPTFactCheckModel(BaseModel):
    label: FactCheckLabel = Field(description="The result of the fact check")
    explanation: str = Field(description="The explanation of the fact check")
    sources: Optional[list[str]] = Field(default=[], description="The sources of the fact check as strings")

    @field_validator("sources", mode="before")
    @classmethod
    def validate_sources(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v]
        if isinstance(v, list):
            valid_sources = []
            for source in v:
                if isinstance(source, str) and source.strip():
                    valid_sources.append(source.strip())
                elif hasattr(source, "__str__"):
                    source_str = str(source).strip()
                    if source_str:
                        valid_sources.append(source_str)
            return valid_sources
        return []

    @field_validator("label", mode="before")
    @classmethod
    def validate_label(cls, v):
        if isinstance(v, str):
            v = v.lower().strip()
            label_mapping = {
                "true": "correct",
                "false": "incorrect",
                "partially true": "misleading",
                "partially false": "misleading",
                "mixed": "misleading",
                "unproven": "misleading",
            }
            return label_mapping.get(v, v)
        return v


class HealthResponse(BaseModel):
    database_is_working: bool = Field(True, description="Whether the database is working")


class FactCheckResponse(BaseModel):
    url: AnyHttpUrl | None = Field(None, description="The url of the article")
    label: FactCheckLabel = Field(description="The label of the fact check")
    summary: str = Field(description="The summary of the claim")
    response: str = Field(description="The logical explanation of the fact check")
    isSafe: bool = Field(description="Whether the article is safe")
    archive: str | None = Field(None, description="The archive url of the site")
    references: list[AnyHttpUrl] = Field([], description="The references of the fact check")
    updatedAt: datetime = Field(default_factory=datetime.now, description="The time of the last update")


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUMMARIZING = "summarizing"
    FACT_CHECKING = "fact_checking"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskResponse(BaseModel):
    task_id: UUID = Field(description="The unique identifier for the task")
    status: TaskStatus = Field(description="The current status of the task")
    message: str = Field(default="Task created", description="Status message")


class TaskStatusResponse(BaseModel):
    task_id: UUID = Field(description="The unique identifier for the task")
    status: TaskStatus = Field(description="The current status of the task")
    message: str = Field(description="Status message")
    result: Optional["FactCheckResponse"] = Field(None, description="The result if completed")
    created_at: datetime = Field(description="When the task was created")
    updated_at: datetime = Field(description="When the task was last updated")


class TaskData(BaseModel):
    task_id: UUID = Field(description="The unique identifier for the task")
    status: TaskStatus = Field(description="The current status of the task")
    message: str = Field(description="Status message")
    input_data: "TextInputData" = Field(description="The original input data")
    result: Optional["FactCheckResponse"] = Field(None, description="The result if completed")
    created_at: datetime = Field(default_factory=datetime.now, description="When the task was created")
    updated_at: datetime = Field(default_factory=datetime.now, description="When the task was last updated")
