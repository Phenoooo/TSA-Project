import { GoogleGenAI, Type } from "@google/genai";
import { randomUUID } from "crypto";
import {
  ERROR_TYPES,
  ERROR_TYPE_DESCRIPTIONS,
  isErrorType,
  type ErrorType,
} from "@/app/data/errorTypes";
import {
  readProfile,
  recentMcqTexts,
  saveMcqBatch,
  type StoredMCQ,
} from "@/lib/profileStore";
import { buildChoices } from "@/lib/mcqBuild";
import { clamp, levelToDifficulty } from "@/lib/scale";

export const runtime = "nodejs";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

function describeLevel(level: number) {
  if (level < 2.5)
    return "Level 1-2: a one-step problem with small whole numbers.";
  if (level < 4.5)
    return "Level 3-4: a two-step problem with simple integers, maybe one negative.";
  if (level < 6.5)
    return "Level 5-6: a three-step problem; may have variables on both sides or a simple fraction.";
  if (level < 8.5)
    return "Level 7-8: a multi-step problem combining two ideas, with negatives and fractions.";
  return "Level 9-10: a challenging multi-step problem like a hard test question.";
}

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      slot: { type: Type.INTEGER },
      question: { type: Type.STRING },
      solution: { type: Type.STRING },
      choices: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            diagnosis: { type: Type.STRING, enum: ["correct", ...ERROR_TYPES] },
          },
          required: ["text", "diagnosis"],
        },
      },
    },
    required: ["slot", "question", "solution", "choices"],
  },
};

const systemInstruction = `You write multiple-choice algebra practice questions for a tutoring app that diagnoses student misconceptions.
Write exactly one question per assignment you are given.
Every question has exactly 4 choices: one correct and three wrong.
Each wrong choice must be the exact answer a student would get by making ONE specific mistake, and its "diagnosis" is that mistake category. The correct choice has diagnosis "correct".
For an assignment with a targetCategory, at least one wrong choice must come from that exact mistake. Use different categories for the other wrong choices when you can.
Rules:
- Algebra 1 skills only, exactly one correct choice, all four choices different.
- Choices are short plain text (a value or short expression like "x=4" or "4x+12"). Exponents as x^2, fractions as (a)/(b), no LaTeX. Never put explanations in a choice.
- The question is short plain text with no hints and no answer.
- Match the difficulty guide, and differ from every question in the "avoid" list.
"solution" is a short step-by-step solution for the teacher.
Return one object per assignment, using the slot number you were given.`;

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "GEMINI_API_KEY is not set. Add it to .env.local and restart." },
      { status: 500 },
    );
  }

  let count = 5;
  try {
    const body = await request.json();
    count = clamp(Math.round(Number(body?.count)) || 5, 1, 10);
  } catch {
    // no body is fine, use the default
  }

  const { summary } = await readProfile();
  const level = summary.level;

  const assignments = Array.from({ length: count }, (_, slot) => {
    const topic: ErrorType | null = summary.weakestTopics.length
      ? summary.weakestTopics[slot % summary.weakestTopics.length]
      : null;
    return {
      slot,
      targetCategory: topic ?? "mixed review (choose any categories)",
      misconception: topic
        ? ERROR_TYPE_DESCRIPTIONS[topic]
        : "no known weak spot yet, so cover a variety of algebra skills",
    };
  });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let parsed: unknown;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: JSON.stringify({
        studentLevel: level,
        difficultyGuide: describeLevel(level),
        categoryMeanings: ERROR_TYPE_DESCRIPTIONS,
        assignments,
        avoid: await recentMcqTexts(),
      }),
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.8,
      },
    });
    parsed = JSON.parse(response.text ?? "");
  } catch (err) {
    console.error("Gemini MCQ generation failed:", err);
    return Response.json(
      { error: "Could not generate questions right now. Try again." },
      { status: 502 },
    );
  }

  const raw = Array.isArray(parsed) ? parsed : [];
  const batchId = randomUUID().slice(0, 8);
  const questions: StoredMCQ[] = [];

  for (const a of assignments) {
    const m = raw.find((r) => r?.slot === a.slot);
    if (!m || typeof m.question !== "string" || m.question.trim().length < 5) {
      continue;
    }
    const built = buildChoices(m.choices);
    if (!built) continue;

    const topic = summary.weakestTopics.length
      ? summary.weakestTopics[a.slot % summary.weakestTopics.length]
      : null;
    const hitsTopic =
      topic !== null && Object.values(built.diagnosis).includes(topic);

    questions.push({
      id: `${batchId}_${a.slot}`,
      question: m.question.trim().slice(0, 300),
      answers: built.answers,
      diagnosis: built.diagnosis,
      targetCategory: hitsTopic && isErrorType(topic) ? topic : "mixed",
      level,
      difficulty: levelToDifficulty(level),
      solution: String(m.solution ?? ""),
    });
  }

  if (questions.length === 0) {
    return Response.json(
      { error: "Gemini did not return usable questions. Try again." },
      { status: 502 },
    );
  }

  try {
    await saveMcqBatch({
      id: batchId,
      createdAt: new Date().toISOString(),
      level,
      weakestTopics: summary.weakestTopics,
      questions,
    });
  } catch (err) {
    console.error("Could not save generated MCQs:", err);
  }

  // Never send `diagnosis` or `solution` to the browser (they reveal the answer)
  return Response.json({
    batchId,
    level,
    label: summary.label,
    weakestTopics: summary.weakestTopics,
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question,
      answers: q.answers,
      targetCategory: q.targetCategory,
      difficulty: q.difficulty,
    })),
  });
}