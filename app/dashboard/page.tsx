"use client";

import Graphs from "../components/graphs";
import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { QuestionAnswer } from "../data/questionEngine";
import { MotionConfig, motion } from "motion/react";

const errorTypes = [
  { key: "sign_error", name: "Sign error" },
  { key: "operation_error", name: "Operation error" },
  { key: "variable_isolation_error", name: "Variable isolation" },
  { key: "distribution_error", name: "Distribution error" },
  { key: "exponent_rule_error", name: "Exponent rule" },
  { key: "formula_error", name: "Formula error" },
  { key: "graph_interpretation_error", name: "Graph interpretation" },
] as const;

function subscribeToAnswerHistory(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getAnswerHistory() {
  return localStorage.getItem("questionArray") ?? "[]";
}

function isQuestionAnswer(value: unknown): value is QuestionAnswer {
  if (!value || typeof value !== "object") return false;
  const answer = value as Record<string, unknown>;
  return (
    typeof answer.error === "string" &&
    typeof answer.questionID === "number" &&
    typeof answer.difficulty === "number" &&
    typeof answer.correct === "boolean"
  );
}

type IconProps = {
  name:
    | "psychology"
    | "track_changes"
    | "monitoring"
    | "school"
    | "lightbulb"
    | "trending_up"
    | "flag";
  className?: string;
};

function Icon({ name, className = "" }: IconProps) {
  const icons = {
    psychology: (
      <>
        <path d="M12 3a7 7 0 0 0-4 12.75V19h8v-3.25A7 7 0 0 0 12 3Z" />
        <path d="M9 22h6M9 9a3 3 0 0 1 3-3m3 6a2 2 0 0 1-2-2" />
      </>
    ),
    track_changes: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    monitoring: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 4 3 6-7" />
      </>
    ),
    school: (
      <>
        <path d="m2 10 10-6 10 6-10 6-10-6Z" />
        <path d="M6 12.5V17c3.5 2.7 8.5 2.7 12 0v-4.5M22 10v6" />
      </>
    ),
    lightbulb: (
      <>
        <path d="M9 18h6m-5 4h4m-2-20a7 7 0 0 0-4 12.75c.6.4 1 1.15 1 2.25h6c0-1.1.4-1.85 1-2.25A7 7 0 0 0 12 2Z" />
      </>
    ),
    trending_up: (
      <>
        <path d="M3 17 9 11l4 4 8-8" />
        <path d="M15 7h6v6" />
      </>
    ),
    flag: (
      <>
        <path d="M5 21V5m0 0c5-4 9 4 14 0v11c-5 4-9-4-14 0" />
      </>
    ),
  } satisfies Record<IconProps["name"], ReactNode>;

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {icons[name]}
    </svg>
  );
}

export default function Dashboard() {
  const answerHistory = useSyncExternalStore(
    subscribeToAnswerHistory,
    getAnswerHistory,
    () => "[]",
  );
  const storedAnswers: unknown = JSON.parse(answerHistory);
  const answers = Array.isArray(storedAnswers)
    ? storedAnswers.filter(isQuestionAnswer)
    : [];
  const errorItems = errorTypes
    .map(({ key, name }) => {
      const count = answers.filter(
        (answer) => !answer.correct && answer.error === key,
      ).length;
      return {
        name,
        count,
        value: answers.length ? Math.round((count / answers.length) * 100) : 0,
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const focusError = errorItems[0];

  const suggestions: Record<string, string> = {
    "Sign error":
      "Review how positive and negative signs behave when simplifying expressions.",
    "Operation error":
      "Practice the order of operations and performing arithmetic accurately.",
    "Variable isolation":
      "Focus on inverse operations and keeping equations balanced.",
    "Distribution error":
      "Practice distributing coefficients across every term inside parentheses.",
    "Exponent rule":
      "Review the product, quotient, and power rules of exponents.",
    "Formula error":
      "Work on identifying the correct formula and substituting values accurately.",
    "Graph interpretation":
      "Practice interpreting slopes, intercepts, coordinates, and graph behavior.",
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.main
        className="min-h-screen px-5 pb-16 pt-24 lg:px-12"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-[1240px]">
        <motion.header
          className="mb-8 flex flex-col justify-between gap-5 border-b border-[var(--app-border)] pb-6 sm:flex-row sm:items-end"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
        >
          <div>
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-accent-ink)]">
              FIELD NOTES <span className="px-1 text-[var(--app-warm)]">/</span> ALGEBRA
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--app-text)] md:text-4xl">
              My Learning Dashboard
            </h1>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">
              A clearer picture of what you know and what to practice next.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--app-text-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--app-warm)]" />
            Every mistake is progress
          </div>
        </motion.header>

        {/* Graphs */}
        <div className="mb-7">
          <Graphs answers={answers} />
        </div>

        {/* Overview cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <motion.section
            className="rounded-2xl border border-[var(--app-border)] border-b-4 border-b-[var(--app-accent)] bg-[var(--app-surface)] p-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
          >
            <div className="relative">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]">
                <Icon
                  name="psychology"
                  className="h-[26px] w-[26px]"
                />
              </div>

              <p className="text-sm font-medium text-[var(--app-text-muted)]">
                Misconception types
              </p>

              <div className="flex items-end gap-2 mt-2">
                <h2 className="text-4xl font-bold text-[var(--app-text)]">
                  {errorItems.length}
                </h2>
                <span className="mb-1 text-sm text-[var(--app-text-muted)]">
                  categories identified
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-2xl border border-[var(--app-border)] border-b-4 border-b-[var(--app-warm)] bg-[var(--app-surface)] p-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
          >
            <div className="relative">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]">
                <Icon
                  name="track_changes"
                  className="h-[26px] w-[26px]"
                />
              </div>

              <p className="text-sm font-medium text-[var(--app-text-muted)]">
                Your biggest opportunity
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[var(--app-text)]">
                {focusError?.name ?? "Ready to begin?"}
              </h2>

              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {focusError
                  ? `${focusError.count} answers to practice`
                  : "Complete a diagnostic to get started."}
              </p>
            </div>
          </motion.section>
        </div>

        {/* Error breakdown */}
        <motion.section
          className="mb-7 rounded-2xl border border-[var(--app-border)] border-b-4 border-b-[var(--app-accent)] bg-[var(--app-surface)] p-6 lg:p-8"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold tracking-wide text-[var(--app-warm-ink)]">01</span>
                <Icon name="monitoring" className="h-5 w-5 text-[var(--app-accent-ink)]" />
                <h2 className="text-lg font-semibold text-[var(--app-text)]">
                  Your misconception map
                </h2>
              </div>

              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                Share of all answers linked to each misconception.
              </p>
            </div>

            <span className="hidden rounded-full bg-[var(--app-accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--app-accent-ink)] sm:block">
              ERROR BREAKDOWN
            </span>
          </div>

          {errorItems.length > 0 ? (
            <div className="space-y-7">
              {errorItems.map((item, index) => {
                return (
                    <motion.div
                      key={item.name}
                      className="group"
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.28, delay: index * 0.055 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-2.5 w-2.5 rounded-full bg-[var(--app-accent)]"
                          />

                          <span className="text-sm font-semibold text-[var(--app-text)] transition-colors">
                            {item.name}
                          </span>
                        </div>

                        <span className="text-sm font-bold tabular-nums text-[var(--app-text)]">
                          {item.count} <span className="font-normal text-[var(--app-text-muted)]">· {item.value}%</span>
                        </span>
                      </div>

                      <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                        <motion.div
                          className="h-full rounded-full bg-[var(--app-accent)] transition-all duration-700"
                          style={{
                            width: `${Math.min(item.value, 100)}%`,
                            transformOrigin: "left",
                          }}
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: 0.15 + index * 0.055, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-[var(--app-surface-muted)] py-14 text-center">
              <Icon name="school" className="mx-auto h-12 w-12 text-[var(--app-accent-ink)]" />

              <p className="mt-3 text-sm font-semibold text-[var(--app-text)]">
                Your learning journey starts here!
              </p>

              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                Complete a diagnostic to see your results.
              </p>
            </div>
          )}
        </motion.section>

        {/* Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Focus area */}
          <motion.section
            className="rounded-2xl border border-[var(--app-border)] border-b-4 border-b-[var(--app-warm)] bg-[var(--app-surface)] p-7"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]">
                <Icon name="lightbulb" className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-bold text-[var(--app-text)]">
                  Let&apos;s work on this!
                </h2>

                <p className="text-xs text-[var(--app-text-muted)]">
                  Your personalized learning focus
                </p>
              </div>
            </div>

            {focusError ? (
              <>
                <p className="mb-1 text-sm text-[var(--app-text-muted)]">
                  A concept worth revisiting
                </p>

                <h3 className="text-2xl font-bold text-[var(--app-text)]">
                  {focusError.name}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-[var(--app-text-muted)]">
                  {suggestions[focusError.name]}
                </p>

                <div className="mt-6 rounded-2xl bg-[var(--app-surface-muted)] p-4">
                  <p className="mb-2 text-xs font-semibold text-[var(--app-text-muted)]">
                    AREA TO FOCUS ON
                  </p>

                  <div className="h-2 overflow-hidden rounded-full bg-[var(--app-border)]">
                    <div
                      className="h-full rounded-full bg-[var(--app-accent)]"
                      style={{
                        width: `${Math.min(focusError.value, 100)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-[var(--app-text-muted)]">
                    {focusError.value}% of all answers
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--app-text-muted)]">
                Complete a diagnostic to discover your focus area.
              </p>
            )}
          </motion.section>

          {/* Explanation */}
          <motion.section
            className="rounded-2xl border border-[var(--app-border)] border-b-4 border-b-[var(--app-accent)] bg-[var(--app-surface)] p-7"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, delay: 0.08 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]">
                <Icon name="school" className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-bold text-[var(--app-text)]">
                  Understanding your results
                </h2>

                <p className="text-xs text-[var(--app-text-muted)]">
                  A little guide to your progress
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[var(--app-text-muted)]">
              Your dashboard looks for patterns in your answers to help you
              understand where mistakes are happening.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex gap-3 items-start">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]">
                  <Icon name="trending_up" className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">
                    Error frequency
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-[var(--app-text-muted)]">
                    Shows which misconceptions appear most often.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]">
                  <Icon name="flag" className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">
                    Focus areas
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-[var(--app-text-muted)]">
                    Highlight concepts that could benefit from extra practice.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]">
                  <Icon name="school" className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">
                    Keep improving
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-[var(--app-text-muted)]">
                    Use your results to guide what you practice next.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
        </div>
      </motion.main>
    </MotionConfig>
  );
}
