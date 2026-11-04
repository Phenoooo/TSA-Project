import { randomUUID } from "crypto";
import MCQS from "@/app/data/diagnosticMCQ";
import { isErrorType, type ErrorType } from "@/app/data/errorTypes";
import { recordEvents } from "@/lib/profileStore";
import type { AnswerEvent } from "@/lib/scale";

export const runtime = "nodejs";

const LETTERS = ["A", "B", "C", "D"] as const;
type Letter = (typeof LETTERS)[number];

export async function POST(request: Request) {
  let picks: unknown;
  try {
    picks = (await request.json()).picks;
  } catch {
    picks = null;
  }
  if (
    !Array.isArray(picks) ||
    picks.length !== MCQS.length ||
    !picks.every((p) => LETTERS.includes(p as Letter))
  ) {
    return Response.json(
      { error: `Expected { picks: [${MCQS.length} letters A-D] }` },
      { status: 400 },
    );
  }

  const at = new Date().toISOString();
  const batchId = randomUUID().slice(0, 8);

  const events: AnswerEvent[] = MCQS.map((q, i) => {
    const diagnosis = q.diagnosis as Record<Letter, string>;
    const picked = diagnosis[picks[i] as Letter];
    const correct = picked === "correct";
    const offered = Object.values(diagnosis).filter(isErrorType) as ErrorType[];
    const missed: ErrorType[] = !correct && isErrorType(picked) ? [picked] : [];
    return {
      id: `mcq_${batchId}_${i}`,
      at,
      source: "mcq",
      phase: "placement",
      difficulty: q.difficulty,
      correct,
      offered,
      missed,
    };
  });

  const summary = await recordEvents(events, {
    phase: "placement",
    source: "mcq",
  });
  return Response.json(summary);
}