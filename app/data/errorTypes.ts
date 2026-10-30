// Single source of truth for the mistake categories.

export const ERROR_TYPES = [
  "sign_error",
  "operation_error",
  "distribution_error",
  "exponent_rule_error",
  "graph_interpretation_error",
  "variable_isolation_error",
  "formula_error",
] as const;

export type ErrorType = (typeof ERROR_TYPES)[number];

export interface DetectedError {
  category: ErrorType;
  where: string;
  explanation: string;
}

export interface QuestionAnalysis {
  questionIndex: number;
  question: string;
  studentWork: string;
  isCorrect: boolean;
  finalAnswerGiven: string;
  correctAnswer: string;
  errors: DetectedError[];
  summary: string;
}

export interface FRQSubmissionResult {
  id: string;
  createdAt: string;
  analyses: QuestionAnalysis[];
  errorCounts: Record<ErrorType, number>;
}

export function emptyErrorCounts(): Record<ErrorType, number> {
  return Object.fromEntries(ERROR_TYPES.map((t) => [t, 0])) as Record<
    ErrorType,
    number
  >;
}