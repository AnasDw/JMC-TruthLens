import instructor
from pydantic import BaseModel
from typing import List
from groq import AsyncGroq


class ReasoningIssueAnalysis(BaseModel):
    fallacies: List[str]
    bias_indicators: List[str]
    explanation: str


async def detect_fallacies_and_bias(groq_client: AsyncGroq, text: str) -> ReasoningIssueAnalysis:
    prompt = (
        "Analyze the following statement for logical fallacies or signs of bias.\n\n"
        "Return:\n"
        "1. A list of any logical fallacies (e.g., Strawman, Slippery slope, False cause)\n"
        "2. A list of any bias indicators (e.g., Emotionally charged language, Cherry-picking, Loaded language)\n"
        "3. A short explanation of what was found.\n\n"
        f'Text: "{text.strip()}"'
    )

    groq_instructor_client = instructor.from_groq(groq_client)

    response = await groq_instructor_client.chat.completions.create(
        model="llama3-70b-8192",
        response_model=ReasoningIssueAnalysis,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
    )
    return response
