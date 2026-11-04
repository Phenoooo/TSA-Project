import { isErrorType } from "../app/data/errorTypes";

export interface RawChoice {
  text?: unknown;
  diagnosis?: unknown;
}
export interface BuiltChoices {
  answers: string[];
  diagnosis: { A: string; B: string; C: string; D: string };
}

const LETTERS = ["A", "B", "C", "D"] as const;

function shuffle<T>(items: T[], random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildChoices(
  raw: unknown,
  random = Math.random,
): BuiltChoices | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;

  const choices: { text: string; diagnosis: string }[] = [];
  for (const c of raw as RawChoice[]) {
    const text = typeof c?.text === "string" ? c.text.trim() : "";
    const diagnosis = c?.diagnosis;
    if (!text || text.length > 80) return null;
    if (diagnosis !== "correct" && !isErrorType(diagnosis)) return null;
    choices.push({ text, diagnosis });
  }

  if (choices.filter((c) => c.diagnosis === "correct").length !== 1) return null;
  if (new Set(choices.map((c) => c.text.toLowerCase())).size !== 4) return null;

  const mixed = shuffle(choices, random);
  return {
    answers: mixed.map((c) => c.text),
    diagnosis: {
      A: mixed[0].diagnosis,
      B: mixed[1].diagnosis,
      C: mixed[2].diagnosis,
      D: mixed[3].diagnosis,
    },
  };
}

export { LETTERS };