import json
from pydantic import BaseModel
from groq import AsyncGroq


class ClaimDetectionResult(BaseModel):
    is_factual_claim: bool
    confidence: float
    reasoning: str


async def detect_with_llm(groq_client: AsyncGroq, text: str) -> ClaimDetectionResult:
    system_msg = (
        "You are a classifier that decides whether an input is a factual claim. "
        "A factual claim asserts something about the real world that can be verified true or false. "
        "IMPORTANT: Your decision is TRUTH-AGNOSTIC. Label as 'claim' even if the statement is false, "
        "misleading, controversial, conspiratorial, or harmful. Do NOT judge veracity, only claimness."
    )

    # Few-shot examples that mirror the tricky cases
    guide_examples = (
        "Examples (label → explanation):\n"
        "• 'I love pizza.' → not_claim (opinion)\n"
        "• 'Hi there!' → filler (greeting)\n"
        "• 'Climate change is causing more frequent hurricanes in the Atlantic' → claim (causal assertion about reality)\n"
        "• 'COVID-19 vaccines contain microchips for tracking people' → claim (verifiable assertion, regardless of truth)\n"
        "• '5G networks cause cancer and other health problems' → claim (causal health assertion)\n"
        "• 'The 2020 US election was rigged with widespread voter fraud' → claim (assertion about an event)\n"
        "Return ONLY JSON with fields: label ∈ {claim, not_claim, filler}, confidence ∈ [0,1], reason_short."
    )

    prompt_text = f"{guide_examples}\n\nInput: {text.strip()}"

    schema = {
        "name": "ClaimDecision",
        "schema": {
            "type": "object",
            "properties": {
                "label": {"type": "string", "enum": ["claim", "not_claim", "filler"]},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "reason_short": {"type": "string", "maxLength": 160},
            },
            "required": ["label", "confidence"],
            "additionalProperties": False,
        },
    }

    try:
        resp = await groq_client.chat.completions.create(
            model="moonshotai/kimi-k2-instruct",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt_text},
            ],
            temperature=0,
            max_tokens=120,
            response_format={"type": "json_schema", "json_schema": schema},
        )

        content = resp.choices[0].message.content
        data = json.loads(content)

        label = data.get("label", "not_claim")
        # Guard confidence
        try:
            conf = float(data.get("confidence", 0.5))
        except Exception:
            conf = 0.5
        conf = min(1.0, max(0.0, conf))

        is_claim = label == "claim"
        reason = data.get("reason_short") or f"LLM labeled '{label}'"

        return ClaimDetectionResult(
            is_factual_claim=is_claim,
            confidence=conf,
            reasoning=f"[LLM JSON] {reason} (label={label}, conf={conf:.2f})",
        )
    except Exception as e:
        return ClaimDetectionResult(
            is_factual_claim=False,
            confidence=0.0,
            reasoning=f"LLM error: {e}",
        )


async def detect_factual_claim(groq_client: AsyncGroq, text: str) -> ClaimDetectionResult:
    return await detect_with_llm(groq_client, text)
