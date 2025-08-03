import { NextApiRequest, NextApiResponse } from "next";
import { FactCheckResult } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FactCheckResult | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Simulate API processing delay
    await new Promise((resolve) => setTimeout(resolve, 20000));

    // Mock fact-check result
    const result: FactCheckResult = {
      id: `fact-check-${Date.now()}`,
      title: title || "Untitled Fact Check",
      content,
      timestamp: new Date(),
      veracity: Math.random() > 0.5 ? "true" : "partially-true",
      confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
      sources: [
        {
          title: "Reliable News Source",
          url: "https://example.com/source1",
          credibility: 85,
        },
        {
          title: "Academic Research",
          url: "https://example.com/source2",
          credibility: 92,
        },
      ],
      explanation:
        "This statement has been analyzed using multiple reliable sources. The available evidence suggests that the claim is supported by credible information, though some aspects may require additional verification.",
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Fact-check API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

