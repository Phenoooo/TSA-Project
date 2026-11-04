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
  recentQuestionTexts,
  saveBatch,
  type StoredQuestion,
} from "@/lib/profileStore";
import { clamp, levelToDifficulty } from "@/lib/scale";

export const runtime = "nodejs";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

function describeLevel(level: number) {
  if (level < 2.5)
    return "Level 1-2: one or two steps, small whole numbers, a single idea.";
  if (level < 4.5)
    return "Level 3-4: two to three steps, simple integers, one idea with a small twist such as a negative coefficient.";
  if (level < 6.5)
    return "Level 5-6: three to four steps; may have variables on both sides or simple fractions; one main idea.";
  if (level < 8.5)
    return "Level 7-8: four or more steps that combine two ideas (for example distribute, then isolate), with negatives and fractions.";
  return "Level 9-10: a challenging multi-step problem combining several ideas, like a hard test question.";
}

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      slot: { type: Type.INTEGER },
      targetCategory: { type: Type.STRING, enum: [...ERROR_TYPES] },
      question: { type: Type.STRING },
      answer: { type: Type.STRING },
      solution: { type: Type.STRING },
    },
    required: ["slot", "targetCategory", "question", "answer", "solution"],
  },
};

const systemInstruction = `You write free-response algebra practice questions for a tutoring app that fixes student misconceptions.
Write exactly one question per assignment you are given.
Each question must:
- be solvable with Algebra 1 skills only, and have exactly one correct final answer
- be designed so a student with the assignment's misconception is likely to slip on it
- match the difficulty guide for the student's level
- end by asking the student to show their work and explain each step
- be written in plain text: exponents as x^2, fractions as (a)/(b), no LaTeX
- NOT contain the answer or hints
- be different from every question in the "avoid" list
"answer" is the final answer only. "solution" is a short step-by-step solution for the teacher.
Return one object per assignment, using the slot number you were given.`;

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "GEMINI_API_KEY is not set. Add it to .env.local and restart." },
      { status: 500 },
    );
  }

  let count = 3;
  try {
    const body = await request.json();
    count = clamp(Math.round(Number(body?.count)) || 3, 1, 5);
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
      targetCategory: topic ?? "mixed review (choose any category)",
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
        assignments,
        avoid: await recentQuestionTexts(),
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
    console.error("Gemini question generation failed:", err);
    return Response.json(
      { error: "Could not generate questions right now. Try again." },
      { status: 502 },
    );
  }

  const raw = Array.isArray(parsed) ? parsed : [];
  const batchId = randomUUID().slice(0, 8);
  const questions: StoredQuestion[] = [];

  for (const a of assignments) {
    const m = raw.find((r) => r?.slot === a.slot);
    if (!m || typeof m.question !== "string" || m.question.trim().length < 10) {
      continue;
    }
    questions.push({
      id: `${batchId}_${a.slot}`,
      question: m.question.trim().slice(0, 600),
      targetCategory: isErrorType(m.targetCategory)
        ? m.targetCategory
        : ((summary.weakestTopics[
            a.slot % Math.max(1, summary.weakestTopics.length)
          ] ?? "mixed") as string),
      level,
      difficulty: levelToDifficulty(level),
      answer: String(m.answer ?? ""),
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
    await saveBatch({
      id: batchId,
      createdAt: new Date().toISOString(),
      level,
      weakestTopics: summary.weakestTopics,
      questions,
    });
  } catch (err) {
    console.error("Could not save generated questions:", err);
  }

  // The answer key stays on the server (it is in data/generated-frqs.json)
  return Response.json({
    batchId,
    level,
    label: summary.label,
    weakestTopics: summary.weakestTopics,
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question,
      targetCategory: q.targetCategory,
      difficulty: q.difficulty,
    })),
  });
}