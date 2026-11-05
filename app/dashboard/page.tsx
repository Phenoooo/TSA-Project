"use client";

import Graphs from "../components/graphs";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

type ErrorType = (typeof errorTypes)[number];
type ErrorItem = {
  key: ErrorType["key"];
  name: ErrorType["name"];
  count: number;
  value: number;
};

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
    | "flag"
    | "sign"
    | "operations"
    | "balance"
    | "distribution"
    | "exponent"
    | "formula"
    | "graph";
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
    sign: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8m-4-4h8" />
      </>
    ),
    operations: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8m-8 5h2m4 0h2m-8 4h2m4 0h2" />
      </>
    ),
    balance: (
      <>
        <path d="M12 3v18m-7-15h14M6 6l-3 6h6L6 6Zm12 0-3 6h6l-3-6ZM8 21h8" />
      </>
    ),
    distribution: (
      <>
        <path d="M4 5h16M4 12h16M4 19h16M8 5v14m8-14v14" />
      </>
    ),
    exponent: (
      <>
        <path d="m4 7 8 10m0-10-8 10m12-9h4v4" />
      </>
    ),
    formula: (
      <>
        <path d="M5 4h14M8 12h8M5 20h14M9 4l-3 16" />
      </>
    ),
    graph: (
      <>
        <path d="M4 4v16h16" />
        <path d="m7 16 4-5 3 2 5-7" />
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
  const [selectedTopic, setSelectedTopic] = useState<ErrorItem | null>(null);
  const topicDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = topicDialogRef.current;
    if (!dialog) return;

    if (selectedTopic && !dialog.open) {
      dialog.showModal();
    } else if (!selectedTopic && dialog.open) {
      dialog.close();
    }
  }, [selectedTopic]);

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
        key,
        name,
        count,
        value: answers.length ? Math.round((count / answers.length) * 100) : 0,
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const focusError = errorItems[0];
  const correctAnswers = answers.filter((answer) => answer.correct).length;
  const accuracy = answers.length
    ? Math.round((correctAnswers / answers.length) * 100)
    : 0;

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
  const explanations: Record<string, string> = {
    "Sign error":
      "A positive or negative sign changes how a term behaves when simplifying or rearranging an expression.",
    "Operation error":
      "An arithmetic or order-of-operations step was missed while simplifying an expression.",
    "Variable isolation":
      "A balanced sequence of inverse operations is needed to get the variable by itself.",
    "Distribution error":
      "A factor outside parentheses must multiply every term inside them.",
    "Exponent rule":
      "Powers follow specific rules when multiplying, dividing, or raising powers to powers.",
    "Formula error":
      "The selected relationship or a substitution step did not match the quantities in the problem.",
    "Graph interpretation":
      "The graph’s points, slope, intercepts, or overall shape were read incorrectly.",
  };
  const topicIcons: Record<ErrorType["key"], IconProps["name"]> = {
    sign_error: "sign",
    operation_error: "operations",
    variable_isolation_error: "balance",
    distribution_error: "distribution",
    exponent_rule_error: "exponent",
    formula_error: "formula",
    graph_interpretation_error: "graph",
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.main
        className="app-dashboard-page"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-[1100px]">
        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-accent-ink)]">
            Your learning journey
          </p>
          <motion.h1
            className="text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          >
            Statistics
          </motion.h1>
        </div>
        <div className="app-panel app-panel--flush">
        <motion.header
          className="p-5 sm:p-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
        >
          <div className="app-panel app-panel--compact border-0 bg-[var(--app-surface-muted)] sm:p-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="flex items-center gap-2 text-sm font-medium text-[var(--app-text-muted)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--app-accent)]" aria-hidden="true" />
                  Algebra
                </p>
                <h2 className="mt-1 text-xl font-medium tracking-tight text-[var(--app-text)]">
                  Your learning progress
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted)]">
                  See how you’re doing and pick up where you left off.
                </p>
                <Link
                  href="/practiceMCQ"
                  className="app-action app-action--primary mt-4"
                >
                  Practice questions
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-4 self-start rounded-xl bg-[var(--app-surface)] px-5 py-4 sm:self-center">
                <div className="relative h-[4.5rem] w-[4.5rem]" role="img" aria-label={`${accuracy}% accuracy`}>
                  <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      fill="none"
                      stroke="var(--app-border)"
                      strokeWidth="5"
                    />
                    <motion.circle
                      cx="36"
                      cy="36"
                      r="30"
                      fill="none"
                      stroke="var(--app-accent)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 30}
                      initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - accuracy / 100) }}
                      transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-[var(--app-text)]">
                    {accuracy}%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--app-text)]">Accuracy</p>
                  <p className="text-xs text-[var(--app-text-muted)]">Your answers so far</p>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-0 border-t border-[var(--app-border)] pt-3 sm:grid-cols-3">
              {[
                { label: "Questions answered", value: answers.length },
                { label: "Correct answers", value: correctAnswers },
                { label: "Topics to practice", value: errorItems.length },
              ].map((stat) => (
                <div key={stat.label} className="border-t border-[var(--app-border)] py-3 first:border-t-0 sm:border-l sm:border-t-0 sm:px-4 sm:first:border-l-0 sm:first:pl-0">
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-xl font-medium tabular-nums text-[var(--app-text)]">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.header>

        <motion.div
          className="border-t border-[var(--app-border)]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16, ease: "easeOut" }}
        >
          <Graphs answers={answers} />
        </motion.div>

        <div className="grid items-start divide-y divide-[var(--app-border)] lg:grid-cols-[1.35fr_0.85fr] lg:divide-x lg:divide-y-0">
        <motion.section
          className="p-5 sm:p-7"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="mb-7">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-[var(--app-text)]">
                  Topics to practice
                </h2>
              </div>

              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                See which concepts are showing up most often.
              </p>
            </div>

          </div>

          {errorItems.length > 0 ? (
            <div className="space-y-4">
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
                    <motion.button
                      type="button"
                      aria-haspopup="dialog"
                      aria-label={`Learn about ${item.name}: ${item.count} mistakes`}
                      onClick={() => setSelectedTopic(item)}
                      className="w-full rounded-xl border border-transparent bg-[var(--app-surface)]/65 p-4 text-left transition hover:border-[var(--app-border)] hover:bg-[var(--app-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-accent)]"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]">
                            <Icon
                              name={topicIcons[item.key]}
                              className="h-5 w-5"
                            />
                          </span>
                          <span className="text-sm font-semibold text-[var(--app-text)]">
                            {item.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-medium tabular-nums text-[var(--app-text)]">
                          {item.count}{" "}
                          <span className="font-normal text-[var(--app-text-muted)]">
                            · {item.value}%
                          </span>
                        </span>
                      </div>

                      <div className="app-progress-track app-progress-track--large">
                        <motion.div
                          className="app-progress-value"
                          style={{
                            width: `${Math.min(item.value, 100)}%`,
                            backgroundColor: "var(--app-accent)",
                            transformOrigin: "left",
                          }}
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.7,
                            delay: 0.15 + index * 0.055,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                      <span className="mt-2 block text-xs font-medium text-[var(--app-accent-ink)]">
                        Explore this topic <span aria-hidden="true">→</span>
                      </span>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-[var(--app-bg)] py-14 text-center">
              <Icon name="school" className="mx-auto h-12 w-12 text-[var(--app-accent-ink)]" />

              <p className="mt-3 text-sm font-medium text-[var(--app-text)]">
                Your learning journey starts here!
              </p>

              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                Complete a diagnostic to see your results.
              </p>
            </div>
          )}
        </motion.section>

        <div className="p-5 sm:p-7 lg:pl-8">
          <motion.section
            className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-accent-soft)]/45 p-4 sm:p-5"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35 }}
          >
            <div className="mb-5">
              <div>
                <h2 className="font-medium text-[var(--app-text)]">
                  Practice next
                </h2>

                <p className="text-xs text-[var(--app-text-muted)]">
                  A suggestion based on your answers
                </p>
              </div>
            </div>

            {focusError ? (
              <>
                <p className="mb-2 inline-flex rounded-full bg-[var(--app-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--app-text)]">
                  Your next focus
                </p>
                <h3 className="text-xl font-medium text-[var(--app-text)]">
                  {focusError.name}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-[var(--app-text-muted)]">
                  {suggestions[focusError.name]}
                </p>

                <div className="mt-5 max-w-lg">
                  <div className="app-progress-track">
                    <div
                      className="app-progress-value"
                      style={{
                        width: `${Math.min(focusError.value, 100)}%`,
                        backgroundColor: "var(--app-accent)",
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-[var(--app-text-muted)]">
                    {focusError.value}% of your answers
                  </p>
                </div>
                <Link
                  href="/practiceMCQ"
                  className="app-action app-action--secondary mt-5"
                >
                  Practice this skill <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : (
              <div>
                <p className="text-sm text-[var(--app-text-muted)]">
                  Complete a diagnostic to discover your focus area.
                </p>
                <Link
                  href="/algebraDiagnosticMCQ"
                  className="app-action app-action--secondary mt-4"
                >
                  Start a diagnostic <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </motion.section>
        </div>
        </div>
        </div>
        <dialog
          ref={topicDialogRef}
          aria-labelledby="topic-dialog-title"
          className="m-auto w-[min(90vw,30rem)] max-w-none rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-0 text-[var(--app-text)] shadow-2xl backdrop:bg-[var(--app-text)]/30"
          onClose={() => setSelectedTopic(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              topicDialogRef.current?.close();
            }
          }}
        >
          {selectedTopic && (
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]">
                    <Icon name={topicIcons[selectedTopic.key]} className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-accent-ink)]">
                      Topic overview
                    </p>
                    <h2 id="topic-dialog-title" className="mt-1 text-xl font-semibold">
                      {selectedTopic.name}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  autoFocus
                  aria-label="Close topic explanation"
                  onClick={() => topicDialogRef.current?.close()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-accent)]"
                >
                  ×
                </button>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-[var(--app-text-muted)]">
                {explanations[selectedTopic.name]}
              </p>
              <p className="mt-4 rounded-xl bg-[var(--app-bg)] px-4 py-3 text-sm text-[var(--app-text)]">
                You’ve seen this in {selectedTopic.count}{" "}
                {selectedTopic.count === 1 ? "answer" : "answers"} so far.
              </p>
            </div>
          )}
        </dialog>
        </div>
      </motion.main>
    </MotionConfig>
  );
}
