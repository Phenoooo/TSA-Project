import { ERROR_TYPES, type ErrorType } from "../app/data/errorTypes";

export type Source = "mcq" | "frq";
export type Phase = "placement" | "practice";

export interface AnswerEvent {
  id: string;
  at: string;
  source: Source;
  phase: Phase;
  // Expected success rate for an average student: 0.05 to 0.95. HIGHER = EASIER.
  difficulty: number;
  correct: boolean;
  offered: ErrorType[]; // MCQ: mistake types offered as wrong choices. FRQ: []
  missed: ErrorType[]; // MCQ: the trap picked. FRQ: types Gemini flagged
}

export interface CategoryStat {
  mcqMissRate: number | null;
  frqMissRate: number | null;
  weakness: number;
}

export interface ProfileSummary {
  level: number;
  label: string;
  targetDifficulty: number;
  weakestTopics: ErrorType[];
  categories: Record<ErrorType, CategoryStat>;
  totals: {
    answered: number;
    correct: number;
    mcqAnswered: number;
    frqAnswered: number;
  };
}

// ---- tuning knobs ----
export const SOURCE_WEIGHT: Record<Source, number> = { mcq: 1, frq: 5 };
export const START_LEVEL = 5;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;
const K = 0.15;
const RECENCY_DECAY = 0.95;
const MAX_WEAK_TOPICS = 2;

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function levelToDifficulty(level: number) {
  return round2(clamp(0.65 - 0.045 * (level - 1), 0.05, 0.95));
}

export function levelLabel(level: number) {
  if (level < 3) return "Beginner";
  if (level < 5) return "Developing";
  if (level < 7) return "Proficient";
  if (level < 9) return "Advanced";
  return "Expert";
}

export function computeLevel(events: AnswerEvent[]) {
  let level = START_LEVEL;
  for (const e of events) {
    const result = e.correct ? 1 : 0;
    level += K * SOURCE_WEIGHT[e.source] * (result - e.difficulty);
    level = clamp(level, MIN_LEVEL, MAX_LEVEL);
  }
  return level;
}

function emptyStats() {
  return Object.fromEntries(
    ERROR_TYPES.map((t) => [t, { opp: 0, miss: 0 }]),
  ) as Record<ErrorType, { opp: number; miss: number }>;
}

export function computeCategories(events: AnswerEvent[]) {
  const mcq = emptyStats();
  const frq = Object.fromEntries(ERROR_TYPES.map((t) => [t, 0])) as Record<
    ErrorType,
    number
  >;
  let frqTotal = 0;

  events.forEach((e, i) => {
    const recency = RECENCY_DECAY ** (events.length - 1 - i);
    if (e.source === "mcq") {
      for (const t of new Set(e.offered)) mcq[t].opp += recency;
      for (const t of new Set(e.missed)) mcq[t].miss += recency;
    } else {
      frqTotal += recency;
      for (const t of new Set(e.missed)) frq[t] += recency;
    }
  });

  const categories = {} as Record<ErrorType, CategoryStat>;
  for (const t of ERROR_TYPES) {
    const mcqMissRate = mcq[t].opp > 0 ? mcq[t].miss / mcq[t].opp : null;
    const frqMissRate = frqTotal > 0 ? frq[t] / frqTotal : null;

    let weighted = 0;
    let weights = 0;
    if (mcqMissRate !== null) {
      weighted += SOURCE_WEIGHT.mcq * mcqMissRate;
      weights += SOURCE_WEIGHT.mcq;
    }
    if (frqMissRate !== null) {
      weighted += SOURCE_WEIGHT.frq * frqMissRate;
      weights += SOURCE_WEIGHT.frq;
    }
    categories[t] = {
      mcqMissRate: mcqMissRate === null ? null : round2(mcqMissRate),
      frqMissRate: frqMissRate === null ? null : round2(frqMissRate),
      weakness: weights > 0 ? round2(weighted / weights) : 0,
    };
  }
  return categories;
}

export function deriveProfile(events: AnswerEvent[]): ProfileSummary {
  const level = round1(computeLevel(events));
  const categories = computeCategories(events);

  const weakestTopics = ERROR_TYPES.filter((t) => categories[t].weakness > 0)
    .sort((a, b) => categories[b].weakness - categories[a].weakness)
    .slice(0, MAX_WEAK_TOPICS);

  return {
    level,
    label: levelLabel(level),
    targetDifficulty: levelToDifficulty(level),
    weakestTopics,
    categories,
    totals: {
      answered: events.length,
      correct: events.filter((e) => e.correct).length,
      mcqAnswered: events.filter((e) => e.source === "mcq").length,
      frqAnswered: events.filter((e) => e.source === "frq").length,
    },
  };
}