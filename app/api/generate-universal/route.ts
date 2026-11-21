import { GoogleGenAI, Type } from "@google/genai";
import { getMathLevelFromScore } from "@/lib/eloEngine";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const { score = 100, type = "mcq", avoid = [] } = await request.json();
    const levelInfo = getMathLevelFromScore(score);

    const prompt = `Generate 1 math problem (${type.toUpperCase()}) for a student with a score of ${score}/1000 (${levelInfo.tierName}).
Topic focus: ${levelInfo.topicFocus}.
Rules:
- Format math cleanly in plain text (use ^ for exponents like x^2, / for fractions, sqrt() for roots).
- Avoid repeating these recent questions: ${JSON.stringify(avoid.slice(-5))}.
- If MCQ, provide 4 distinct choices (A, B, C, D) and identify the exact correct letter ("A", "B", "C", or "D").`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            choices: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctLetter: { type: Type.STRING },
            solution: { type: Type.STRING },
            topicTag: { type: Type.STRING },
          },
          required: ["question", "solution", "topicTag"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    return Response.json({ ...data, problemScore: score, tierName: levelInfo.tierName });
  } catch (error) {
    console.error("Universal generator error:", error);
    return Response.json({ error: "Failed to generate math problem" }, { status: 500 });
  }
}