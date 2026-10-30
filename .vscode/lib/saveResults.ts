import { promises as fs } from "fs";
import path from "path";
import {
  emptyErrorCounts,
  ERROR_TYPES,
  type ErrorType,
  type FRQSubmissionResult,
} from "../../app/data/errorTypes";

const DATA_DIR = path.join(process.cwd(), "data");
const RESULTS_DIR = path.join(DATA_DIR, "frq-results");
const TALLY_FILE = path.join(DATA_DIR, "error-tally.json");

interface Tally {
  updatedAt: string;
  submissions: number;
  questionsAnswered: number;
  errorCounts: Record<ErrorType, number>;
}

async function readTally(): Promise<Tally> {
  try {
    const raw = await fs.readFile(TALLY_FILE, "utf8");
    const parsed = JSON.parse(raw) as Tally;
    parsed.errorCounts = { ...emptyErrorCounts(), ...parsed.errorCounts };
    return parsed;
  } catch {
    return {
      updatedAt: new Date().toISOString(),
      submissions: 0,
      questionsAnswered: 0,
      errorCounts: emptyErrorCounts(),
    };
  }
}

export async function saveFRQResult(result: FRQSubmissionResult) {
  await fs.mkdir(RESULTS_DIR, { recursive: true });

  await fs.writeFile(
    path.join(RESULTS_DIR, `${result.id}.json`),
    JSON.stringify(result, null, 2),
    "utf8",
  );

  const tally = await readTally();
  tally.submissions += 1;
  tally.questionsAnswered += result.analyses.length;
  for (const type of ERROR_TYPES) {
    tally.errorCounts[type] += result.errorCounts[type];
  }
  tally.updatedAt = new Date().toISOString();

  await fs.writeFile(TALLY_FILE, JSON.stringify(tally, null, 2), "utf8");
  return tally;
}