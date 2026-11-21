
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type QuestionType = "mcq" | "frq";

function getLevel(score: number) {
  if (score < 100) return "Early Foundations";
  if (score < 250) return "Pre-Algebra";
  if (score < 400) return "Algebra I";
  if (score < 530) return "Geometry";
  if (score < 650) return "Algebra II";
  if (score < 750) return "Statistics and Probability";
  if (score < 840) return "Trigonometry and Precalculus";
  if (score < 920) return "Differential Calculus";
  if (score < 980) return "Integral Calculus";
  return "Advanced Mathematics";
}

function getDifficulty(score: number) {
  if (score < 200) return "Easy";
  if (score < 400) return "Easy to moderate";
  if (score < 600) return "Moderate";
  if (score < 800) return "Moderate to difficult";
  return "Difficult";
}

function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseJSON(text: string) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function POST(req: Request) {
  try {
    // Check API configuration
    if (!apiKey || !ai) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing. Check your .env.local file." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const score = Math.max(
      0,
      Math.min(1000, Number(body.score) || 100)
    );

    const type: QuestionType =
      body.type === "frq" ? "frq" : "mcq";

    const avoid: string[] = Array.isArray(body.avoid)
      ? body.avoid
          .filter((q: unknown): q is string => typeof q === "string")
          .slice(-40)
      : [];

    const level = getLevel(score);
    const difficulty = getDifficulty(score);

    const previousQuestions = avoid.length
      ? avoid.map((q, i) => `${i + 1}. ${q}`).join("\n")
      : "No previous questions.";

    const prompt = `
You are an expert mathematics question generator.

STUDENT:
- Score: ${score}/1000
- Level: ${level}
- Difficulty: ${difficulty}
- Question type: ${type}

PREVIOUS QUESTIONS:
${previousQuestions}

IMPORTANT VARIETY RULES:
1. Generate exactly ONE new question.
2. Never reproduce a previous question.
3. Do not simply change numbers in an earlier question.
4. Avoid repeating the same mathematical concept when possible.
5. Vary the wording, structure, and reasoning required.
6. Select a topic appropriate for the student's level.
7. Do not always choose the same topic.
8. Make every question mathematically solvable.

TOPICS TO CONSIDER:
- Arithmetic
- Fractions and decimals
- Ratios and proportions
- Linear equations
- Inequalities
- Functions
- Geometry
- Quadratics
- Polynomials
- Exponents and logarithms
- Statistics
- Probability
- Trigonometry
- Precalculus
- Limits
- Derivatives
- Integrals
- Advanced mathematics

QUESTION REQUIREMENTS:

${
  type === "mcq"
    ? `
Generate a multiple-choice question.

- Exactly four answer choices.
- Exactly one correct answer.
- Use correctLetter: A, B, C, or D.
- Make distractors plausible.
- Include a complete solution.
`
    : `
Generate a free-response question.

- No answer choices.
- Require mathematical reasoning.
- Include a complete expected solution.
`
}

MATHEMATICAL QUALITY:
- Check all calculations.
- Ensure the answer is correct.
- Avoid ambiguous wording.
- Match the specified difficulty.
- Do not include unnecessary information.

RETURN ONLY VALID JSON.

${
  type === "mcq"
    ? `
{
  "question": "Question text",
  "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
  "correctLetter": "A",
  "solution": "Complete step-by-step solution",
  "topicTag": "Algebra"
}
`
    : `
{
  "question": "Question text",
  "solution": "Complete expected solution",
  "topicTag": "Algebra"
}
`
}
`;

    const previousNormalized = new Set(
      avoid.map(normalizeQuestion)
    );

    let generatedQuestion: any = null;
    let lastGenerationError: unknown = null;

    // Retry when Gemini produces a duplicate or invalid response.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `
${prompt}

ATTEMPT ${attempt + 1} OF 3.

${
  attempt > 0
    ? "Your previous attempt was rejected. Generate a substantially different question."
    : ""
}
`,
          config: {
            responseMimeType: "application/json",
            temperature: 1,
          },
        });

        const responseText = response.text;

        if (!responseText) {
          console.warn("Gemini returned an empty response.");
          continue;
        }

        let parsed: any;

        try {
          parsed = parseJSON(responseText);
        } catch (error) {
          console.warn("Gemini returned invalid JSON:", responseText);
          continue;
        }

        if (
          typeof parsed.question !== "string" ||
          !parsed.question.trim() ||
          typeof parsed.solution !== "string" ||
          !parsed.solution.trim()
        ) {
          console.warn("Question or solution was missing.");
          continue;
        }

        const normalized = normalizeQuestion(parsed.question);

        if (
          normalized.length < 5 ||
          previousNormalized.has(normalized)
        ) {
          console.warn("Duplicate question detected.");
          continue;
        }

        if (type === "mcq") {
          const validChoices =
            Array.isArray(parsed.choices) &&
            parsed.choices.length === 4 &&
            parsed.choices.every(
              (choice: unknown) =>
                typeof choice === "string" && choice.trim().length > 0
            );

          const validLetter = ["A", "B", "C", "D"].includes(
            String(parsed.correctLetter).toUpperCase()
          );

          if (!validChoices || !validLetter) {
            console.warn("Gemini returned an invalid MCQ.");
            continue;
          }
        }

        generatedQuestion = parsed;
        break;
      } catch (error) {
        lastGenerationError = error;
        console.error(`Gemini attempt ${attempt + 1} failed:`, error);

        // Stop retrying on API/configuration errors.
        break;
      }
    }

    if (!generatedQuestion) {
      if (lastGenerationError) {
        const message =
          lastGenerationError instanceof Error
            ? lastGenerationError.message
            : String(lastGenerationError);

        return NextResponse.json(
          {
            error: "Gemini API generation failed.",
            details: message,
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          error: "Gemini could not generate a valid, unique question after three attempts.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      question: generatedQuestion.question,
      choices: type === "mcq" ? generatedQuestion.choices : undefined,
      correctLetter:
        type === "mcq"
          ? String(generatedQuestion.correctLetter).toUpperCase()
          : undefined,
      solution: generatedQuestion.solution,
      topicTag: generatedQuestion.topicTag || level,
      problemScore: score,
      type,
    });
  } catch (error) {
    console.error("Question generation error:", error);

    const message =
      error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Question generation failed.",
        details: message,
      },
      { status: 500 }
    );
  }
}
