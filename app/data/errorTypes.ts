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

export function isErrorType(value: unknown): value is ErrorType {
  return (
    typeof value === "string" && (ERROR_TYPES as readonly string[]).includes(value)
  );
}

export const ERROR_TYPE_DESCRIPTIONS: Record<ErrorType, string> = {
  sign_error:
    "mishandling negative signs: subtracting negatives, moving terms across the equals sign, dividing by a negative",
  operation_error:
    "using the wrong operation or making an arithmetic slip while solving",
  distribution_error:
    "not multiplying every term inside parentheses, or mishandling a negative being distributed",
  exponent_rule_error:
    "misapplying exponent rules (product, quotient, or power-of-a-power)",
  graph_interpretation_error:
    "misreading slope, intercepts, or points when working with lines",
  variable_isolation_error:
    "undoing operations in the wrong order or not fully isolating the variable",
  formula_error:
    "misusing a formula or method such as slope, slope-intercept form, or factoring a quadratic",
};

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
