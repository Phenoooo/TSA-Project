"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { motion } from "motion/react";
import type { QuestionAnswer } from "../data/questionEngine";

const errorTypes = [
  { key: "sign_error", name: "Sign error" },
  { key: "operation_error", name: "Operation error" },
  { key: "variable_isolation_error", name: "Variable isolation" },
  { key: "distribution_error", name: "Distribution error" },
  { key: "exponent_rule_error", name: "Exponent rule" },
  { key: "formula_error", name: "Formula error" },
  { key: "graph_interpretation_error", name: "Graph interpretation" },
] as const;

type Props = {
  answers: QuestionAnswer[];
};

function ChartPanel({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description: string;
  tone: "blue" | "amber";
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: tone === "blue" ? 0.12 : 0.2,
        ease: "easeOut",
      }}
    >
      <details
        open
        className={`group overflow-hidden rounded-2xl border border-[var(--app-border)] border-b-4 bg-[var(--app-surface)] ${
          tone === "blue" ? "border-b-[var(--app-accent)]" : "border-b-[var(--app-warm)]"
        }`}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden sm:p-6">
          <div>
            <p className={`mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${
              tone === "blue" ? "text-[var(--app-accent-ink)]" : "text-[var(--app-warm-ink)]"
            }`}>
              {tone === "blue" ? "01 / PATTERNS" : "02 / MOMENTUM"}
            </p>
            <h2 className="text-base font-semibold text-[var(--app-text)]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {description}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--app-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--app-accent-ink)]">
            <span className="group-open:hidden">Show chart</span>
            <span className="hidden group-open:inline">Hide chart</span>
            <svg
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </summary>
        <div className="border-t border-[var(--app-border)] px-3 pb-5 pt-4 sm:px-6 sm:pb-6">
          {children}
        </div>
      </details>
    </motion.div>
  );
}

export default function DashboardCharts({ answers }: Props) {
  let runningCorrect = 0;
  const accuracyData = answers.map((answer, index) => {
    if (answer.correct) runningCorrect++;
    return {
      question: index + 1,
      accuracy: Math.round((runningCorrect / (index + 1)) * 100),
    };
  });
  const correctCount = answers.filter((answer) => answer.correct).length;
  const errorData = errorTypes
    .map(({ key, name }) => ({
      name,
      mistakes: answers.filter(
        (answer) => !answer.correct && answer.error === key,
      ).length,
    }))
    .filter((item) => item.mistakes > 0)
    .sort((a, b) => b.mistakes - a.mistakes);
  const overallAccuracy = answers.length
    ? Math.round((correctCount / answers.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-[var(--app-border)] border-b-4 border-b-[var(--app-accent)] bg-[var(--app-surface)] p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--app-accent-ink)]">
            Questions completed
          </p>
          <motion.h2
            className="mt-2 text-4xl font-semibold tracking-tight text-[var(--app-text)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            {answers.length}
          </motion.h2>
          <p className="mt-1 text-xs text-[var(--app-text-muted)]">
            Your answers, all in one place
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--app-border)] border-b-4 border-b-[var(--app-warm)] bg-[var(--app-surface)] p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--app-warm-ink)]">
            Overall accuracy
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <motion.h2
              className="text-4xl font-semibold tracking-tight text-[var(--app-text)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28 }}
            >
              {overallAccuracy}%
            </motion.h2>
            <span className="text-xs text-[var(--app-text-muted)]">
              {correctCount} of {answers.length} correct
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
            <motion.div
              className="h-full rounded-full bg-[var(--app-warm)] transition-all duration-700"
              style={{ width: `${overallAccuracy}%`, transformOrigin: "left" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            />
          </div>
        </section>
      </div>

      <ChartPanel
        title="Mistakes by topic"
        description="A count of the misconceptions in your answers"
        tone="blue"
      >
        {errorData.length ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={errorData}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 15, bottom: 5 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--app-border)" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--app-text-muted)", fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={135}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--app-text)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--app-surface-muted)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--app-border)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="mistakes"
                  fill="var(--app-accent)"
                  radius={[0, 7, 7, 0]}
                  barSize={19}
                  isAnimationActive
                  animationDuration={850}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-[var(--app-text-muted)]">
            No mistakes recorded yet. Complete a diagnostic to see your results.
          </p>
        )}
      </ChartPanel>

      <ChartPanel
        title="Accuracy over time"
        description="Your running score as you work through questions"
        tone="amber"
      >
        {accuracyData.length ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={accuracyData}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid stroke="var(--app-border)" vertical={false} />
                <XAxis
                  dataKey="question"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--app-text-muted)", fontSize: 11 }}
                  label={{
                    value: "Question",
                    position: "insideBottom",
                    offset: -2,
                    fontSize: 11,
                    fill: "var(--app-text-muted)",
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--app-text-muted)", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Accuracy"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--app-border)",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="var(--app-accent)"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "var(--app-warm)", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "var(--app-warm)" }}
                  isAnimationActive
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-[var(--app-text-muted)]">
            Complete some questions to see your accuracy trend.
          </p>
        )}
      </ChartPanel>
    </div>
  );
}
