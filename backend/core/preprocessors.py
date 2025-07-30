import logging
from typing import Optional, Literal, List

import instructor
from deep_translator import GoogleTranslator
from deep_translator.exceptions import TranslationNotFound
from groq import AsyncGroq
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class SummaryModel(BaseModel):
    summary: str = Field(..., description="The concise summary of the article content")


class TextPreprocessor:
    MIN_SUMMARY_WORDS = 40
    DEFAULT_MODEL = "llama-3.1-8b-instant"
    # ~1000–1500 tokens is usually safe; keep char cap conservative unless you add tokenization
    MAX_INPUT_CHARS = 6000

    @staticmethod
    def _normalize_text(text: str) -> str:
        # Preserve paragraph structure while collapsing intra-paragraph whitespace
        paragraphs = [" ".join(p.split()) for p in text.splitlines()]
        normalized = "\n".join([p for p in paragraphs if p.strip()])  # drop empty lines
        return normalized

    @staticmethod
    def to_english(text: str) -> str:
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty or None")

        cleaned_text = TextPreprocessor._normalize_text(text)

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
            # Let callers decide how to handle translation failures
            logger.error(f"Translation failed: {e}")
            raise RuntimeError(f"Failed to translate text: {e}") from e

    @staticmethod
    def _needs_summary(text: str) -> bool:
        return len(text.split()) > TextPreprocessor.MIN_SUMMARY_WORDS

    @staticmethod
    def _maybe_truncate(text: str, max_chars: int) -> str:
        if len(text) > max_chars:
            logger.debug(f"Input length {len(text)} > {max_chars}; truncating for safety.")
            return text[:max_chars] + "..."
        return text

    @staticmethod
    def _chunk(text: str, chunk_chars: int = 4000) -> List[str]:
        # Chunk on paragraph boundaries when possible
        paras = text.split("\n")
        chunks, cur, cur_len = [], [], 0
        for p in paras:
            p_len = len(p) + 1  # include newline
            if cur_len + p_len > chunk_chars and cur:
                chunks.append("\n".join(cur))
                cur, cur_len = [p], p_len
            else:
                cur.append(p)
                cur_len += p_len
        if cur:
            chunks.append("\n".join(cur))
        return chunks

    @staticmethod
    async def summarize(
        client: AsyncGroq,
        text: str,
        model: Optional[str] = None,
        *,
        output_language: Literal["source", "en"] = "en",
        map_reduce: bool = False,
    ) -> str:
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty or None")

        original_text = text
        text = TextPreprocessor._normalize_text(text)

        if not TextPreprocessor._needs_summary(text):
            logger.debug(f"Text length ({len(text.split())} words) below minimum; returning as-is.")
            return original_text

        model_name = model or TextPreprocessor.DEFAULT_MODEL
        instructor_client = instructor.from_groq(client)

        async def _summarize_once(payload: str) -> Optional[str]:
            try:
                # Truncate the payload we send, but keep original_text for fallback.
                clipped = TextPreprocessor._maybe_truncate(payload, TextPreprocessor.MAX_INPUT_CHARS)

                language_instruction = (
                    "Respond in English."
                    if output_language == "en"
                    else "Respond in the original language of the text."
                )

                response = await instructor_client.chat.completions.create(
                    model=model_name,
                    response_model=SummaryModel,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an expert text summarizer. Generate a concise, accurate summary "
                                "that captures the main points and key information. "
                                f"{language_instruction} Write 4–7 sentences, removing redundancy."
                            ),
                        },
                        {
                            "role": "user",
                            "content": f"Summarize the following text:\n\n{clipped}",
                        },
                    ],
                    max_tokens=500,
                    temperature=0.3,
                )

                if isinstance(response, SummaryModel) and response.summary.strip():
                    return response.summary.strip()

                logger.warning("Unexpected or empty response from summarization API.")
                return None

            except Exception as e:
                logger.error(f"Summarization failed: {e}")
                return None

        if map_reduce and len(text) > TextPreprocessor.MAX_INPUT_CHARS:
            chunks = TextPreprocessor._chunk(text)
            logger.debug(f"Map–reduce mode: {len(chunks)} chunks.")
            partials: List[str] = []
            for i, ch in enumerate(chunks, 1):
                s = await _summarize_once(ch)
                if s:
                    partials.append(s)
                else:
                    # On partial failure, fall back for that chunk
                    partials.append(TextPreprocessor._maybe_truncate(ch, 800))
                    logger.warning(f"Chunk {i} summarization failed; using truncated original.")
            combined = "\n".join(partials)
            final = await _summarize_once(combined)
            if final:
                return final
            logger.warning("Final combine summarization failed; returning concatenated partials.")
            return combined

        # Single-pass mode
        final = await _summarize_once(text)
        if final:
            return final

        # Full fallback: return the unmodified original text, not the truncated one
        logger.warning("Returning original text due to summarization failure.")
        return original_text


def to_english(text: str) -> str:
    return TextPreprocessor.to_english(text=text)


async def summarize(client: AsyncGroq, text: str) -> str:
    return await TextPreprocessor.summarize(client=client, text=text)
