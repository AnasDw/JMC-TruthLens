from pydantic import BaseModel
from transformers import pipeline
from groq import AsyncGroq

_zero_shot_pipeline = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")


class ClaimDetectionResult(BaseModel):
    is_factual_claim: bool
    confidence: float
    reasoning: str


def detect_with_zero_shot(text: str) -> ClaimDetectionResult:
    candidate_labels = ["claim", "not_claim"]
    hypothesis_template = "This text is a {}."

    result = _zero_shot_pipeline(
        text,
        candidate_labels=candidate_labels,
        hypothesis_template=hypothesis_template,
        multi_label=False,
    )

    top_label = result["labels"][0]
    top_score = result["scores"][0]

    return ClaimDetectionResult(
        is_factual_claim=top_label == "claim",
        confidence=top_score,
        reasoning=f"Zero-shot classifier labeled it '{top_label}' with confidence {top_score:.2f}",
    )


async def detect_with_llm(groq_client: AsyncGroq, text: str) -> ClaimDetectionResult:
    prompt = (
        "Determine whether the following input is a **factual claim** — a statement that asserts something about the world, "
        "which can be verified as true or false using evidence.\n\n"
        "Classify something as a factual claim **only if** it:\n"
        "- Makes a clear and testable statement\n"
        "- Describes something that has happened, is happening, or will happen in the real world\n"
        "- Can be proven or disproven using credible sources (e.g., news, data, scientific research)\n\n"
        "Do **not** classify it as a claim if it is:\n"
        "- A title, label, or buzzword (e.g., 'AI-powered verification')\n"
        "- A slogan or brand phrase\n"
        "- An opinion or emotional expression (e.g., 'I love summer')\n"
        "- A vague or contextless phrase with no claim (e.g., 'Global warming' is just a topic — "
        "but 'Global warming is increasing sea levels' is a factual claim)\n"
        "- A greeting or short sentence with no factual content (e.g., 'Hi there', 'Good morning')\n\n"
        "Respond with only one word: **yes** or **no**.\n\n"
        "Examples:\n"
        "Input: 'I love pizza.'\nOutput: no\n"
        "Input: 'Vaccines contain microchips for tracking.'\nOutput: yes\n"
        "Input: 'Global warming.'\nOutput: no\n"
        "Input: 'The Earth is flat.'\nOutput: yes\n"
        "Input: 'Hi there!'\nOutput: no\n"
        "Input: 'Cats are mammals.'\nOutput: yes\n"
        "Input: 'AI-Powered Verification'\nOutput: no\n"
        "Input: 'The unemployment rate rose in Q1 of 2023.'\nOutput: yes\n"
        "Input: 'Climate change is causing more frequent hurricanes in the Atlantic.'\nOutput: yes\n\n"
        f"Input: '{text.strip()}'\nOutput:"
    )

    try:
        response = await groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=5,
        )
        raw_output = response.choices[0].message.content.strip().lower()
        is_claim = raw_output.startswith("yes")
        return ClaimDetectionResult(
            is_factual_claim=is_claim, confidence=1.0 if is_claim else 0.0, reasoning=f"LLM responded: '{raw_output}'"
        )
    except Exception as e:
        return ClaimDetectionResult(
            is_factual_claim=True,
            confidence=0.0,
            reasoning=f"LLM failed with error: {str(e)}",
        )


async def detect_factual_claim(groq_client: AsyncGroq, text: str) -> ClaimDetectionResult:
    classifier_result = detect_with_zero_shot(text)

    confidence = classifier_result.confidence

    is_claim = classifier_result.is_factual_claim

    return ClaimDetectionResult(
        is_factual_claim=is_claim,
        confidence=confidence,
        reasoning=(f"[Classifier] {classifier_result.reasoning}"),
    )
