import { isErrorType, type ErrorType } from "@/app/data/errorTypes";
import { readMcqBatch, readProfile, recordEvents } from "@/lib/profileStore";
import type { AnswerEvent } from "@/lib/scale";

export const runtime = "nodejs";

const LETTERS = ["A", "B", "C", "D"] as const;
type Letter = (typeof LETTERS)[number];

export async function POST(request: Request) {
  let batchId: unknown;
  let picks: unknown;
  try {
    const body = await request.json();
    batchId = body.batchId;
    picks = body.picks;
  } catch {
    batchId = null;
  }

  const batch =
    typeof batchId === "string" ? await readMcqBatch(batchId) : null;
  if (!batch) {
    return Response.json({ error: "Unknown question batch." }, { status: 404 });
  }
  if (
    !Array.isArray(picks) ||
    picks.length !== batch.questions.length ||
    !picks.every((p) => LETTERS.includes(p as Letter))
  ) {
    return Response.json(
      { error: `Expected ${batch.questions.length} picks (A-D).` },
      { status: 400 },
    );
  }

  const current = await readProfile();
  if (current.events.some((e) => e.id.startsWith(`mcqp_${batch.id}_`))) {
    return Response.json(
      { error: "This set was already submitted." },
      { status: 409 },
    );
  }

  const at = new Date().toISOString();
  const events: AnswerEvent[] = [];
  const results = batch.questions.map((q, i) => {
    const diagnosis = q.diagnosis as Record<Letter, string>;
    const pickedLetter = picks[i] as Letter;
    const picked = diagnosis[pickedLetter];
    const correct = picked === "correct";
    const correctLetter = LETTERS.find((l) => diagnosis[l] === "correct") ?? "A";
    const mistake: ErrorType | null =
      !correct && isErrorType(picked) ? picked : null;

    events.push({
      id: `mcqp_${batch.id}_${i}`,
      at,
      source: "mcq",
      phase: "practice",
      difficulty: q.difficulty,
      correct,
      offered: Object.values(diagnosis).filter(isErrorType) as ErrorType[],
      missed: mistake ? [mistake] : [],
    });
    return { index: i, correct, pickedLetter, correctLetter, mistake };
  });

  const profile = await recordEvents(events);
  return Response.json({ profile, results });
}