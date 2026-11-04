import { promises as fs } from "fs";
import path from "path";
import {
  deriveProfile,
  type AnswerEvent,
  type Phase,
  type ProfileSummary,
  type Source,
} from "./scale";

const DATA_DIR = path.join(process.cwd(), "data");
const PROFILE_FILE = path.join(DATA_DIR, "profile.json");
const GENERATED_FILE = path.join(DATA_DIR, "generated-frqs.json");

interface ProfileFile {
  updatedAt: string;
  summary: ProfileSummary;
  events: AnswerEvent[];
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

export async function readProfile(): Promise<ProfileFile> {
  try {
    const parsed = JSON.parse(await fs.readFile(PROFILE_FILE, "utf8"));
    const events: AnswerEvent[] = Array.isArray(parsed.events)
      ? parsed.events
      : [];
    return { updatedAt: parsed.updatedAt, events, summary: deriveProfile(events) };
  } catch {
    return {
      updatedAt: new Date().toISOString(),
      events: [],
      summary: deriveProfile([]),
    };
  }
}

export async function recordEvents(
  newEvents: AnswerEvent[],
  replace?: { phase: Phase; source: Source },
) {
  const current = await readProfile();
  const kept = replace
    ? current.events.filter(
        (e) => !(e.phase === replace.phase && e.source === replace.source),
      )
    : current.events;
  const events = [...kept, ...newEvents];
  const summary = deriveProfile(events);
  await writeJson(PROFILE_FILE, {
    updatedAt: new Date().toISOString(),
    summary,
    events,
  });
  return summary;
}

export interface StoredQuestion {
  id: string;
  question: string;
  targetCategory: string;
  level: number;
  difficulty: number;
  answer: string;
  solution: string;
}
export interface StoredBatch {
  id: string;
  createdAt: string;
  level: number;
  weakestTopics: string[];
  questions: StoredQuestion[];
}

async function readBatches(): Promise<StoredBatch[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(GENERATED_FILE, "utf8"));
    return Array.isArray(parsed.batches) ? parsed.batches : [];
  } catch {
    return [];
  }
}

export async function saveBatch(batch: StoredBatch) {
  const batches = [...(await readBatches()), batch].slice(-20);
  await writeJson(GENERATED_FILE, { batches });
}

export async function recentQuestionTexts(limit = 8) {
  const batches = await readBatches();
  return batches
    .flatMap((b) => b.questions.map((q) => q.question))
    .slice(-limit);
}


// ---- generated MCQ batches (the diagnosis labels stay server-side) ----

const GENERATED_MCQ_FILE = path.join(DATA_DIR, "generated-mcqs.json");

export interface StoredMCQ {
  id: string;
  question: string;
  answers: string[]; // 4 choices in display order
  diagnosis: { A: string; B: string; C: string; D: string };
  targetCategory: string;
  level: number;
  difficulty: number;
  solution: string;
}
export interface StoredMCQBatch {
  id: string;
  createdAt: string;
  level: number;
  weakestTopics: string[];
  questions: StoredMCQ[];
}

async function readMcqBatches(): Promise<StoredMCQBatch[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(GENERATED_MCQ_FILE, "utf8"));
    return Array.isArray(parsed.batches) ? parsed.batches : [];
  } catch {
    return [];
  }
}

export async function saveMcqBatch(batch: StoredMCQBatch) {
  const batches = [...(await readMcqBatches()), batch].slice(-20);
  await writeJson(GENERATED_MCQ_FILE, { batches });
}

export async function readMcqBatch(id: string) {
  return (await readMcqBatches()).find((b) => b.id === id) ?? null;
}

export async function recentMcqTexts(limit = 10) {
  const batches = await readMcqBatches();
  return batches.flatMap((b) => b.questions.map((q) => q.question)).slice(-limit);
}