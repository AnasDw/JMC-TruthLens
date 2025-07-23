import logging
from typing import Optional

import instructor
from deep_translator import GoogleTranslator
from deep_translator.exceptions import TranslationNotFound
from groq import AsyncGroq
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class SummaryModel(BaseModel):
    summary: str = Field(..., description="The concise summary of the article content")

    class Config:
        json_encoders = {str: lambda v: v.strip() if v else ""}


class TextPreprocessor:
    MIN_SUMMARY_LENGTH = 200
    DEFAULT_MODEL = "llama-3.1-8b-instant"

    @staticmethod
    def to_english(text: str) -> str:
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty or None")

        cleaned_text = " ".join(text.split()).rstrip(".")

        if not cleaned_text:
            raise ValueError("Text becomes empty after cleaning")

        try:
            translator = GoogleTranslator(source="auto", target="en")
            translated_text = translator.translate(cleaned_text)

            if not translated_text:
                logger.warning("Translation returned empty result, using original text")
                return cleaned_text

            return translated_text

        except TranslationNotFound as e:
            logger.error(f"Translation not found: {e}")
            return cleaned_text
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            raise RuntimeError(f"Failed to translate text: {e}") from e

    @staticmethod
    async def summarize(client: AsyncGroq, text: str, model: Optional[str] = None) -> str:
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty or None")

        if len(text) <= TextPreprocessor.MIN_SUMMARY_LENGTH:
            logger.debug(f"Text length ({len(text)}) is below minimum threshold, skipping summarization")
            return text

        model_name = model or TextPreprocessor.DEFAULT_MODEL

        try:
            instructor_client = instructor.from_groq(client)

            logger.debug(f"Generating summary using model: {model_name}")

            response = await instructor_client.chat.completions.create(
                model=model_name,
                response_model=SummaryModel,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert text summarizer. Generate a concise, "
                            "accurate summary that captures the main points and key information. "
                            "Maintain the original language and tone of the article."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Summarize the following text concisely:\n\n{text}",
                    },
                ],
                max_tokens=500,
                temperature=0.3,
            )

            if not isinstance(response, SummaryModel):
                logger.warning("Unexpected response type from summarization API")
                return text

            summary = response.summary.strip()

            if not summary:
                logger.warning("Generated summary is empty, using original text")
                return text

            logger.debug(f"Successfully generated summary (length: {len(summary)})")
            return summary

        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            return text


def to_english(text: str) -> str:
    return TextPreprocessor.to_english(text=text)


async def summarize(client: AsyncGroq, text: str) -> str:
    return await TextPreprocessor.summarize(client=client, text=text)
