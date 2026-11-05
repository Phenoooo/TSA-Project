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
import { useState } from "react";
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
  className = "",
  children,
  chartsVisible,
}: {
  title: string;
  description: string;
  tone: "green" | "violet";
  className?: string;
  children: React.ReactNode;
  chartsVisible: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: tone === "green" ? 0.12 : 0.2,
        ease: "easeOut",
      }}
    >
      <div>
        <div>
          <p className={`mb-1 text-[10px] font-medium uppercase tracking-[0.1em] ${
            tone === "green"
              ? "text-[var(--app-accent-ink)]"
              : "text-[var(--app-accent-secondary)]"
          }`}>
            {tone === "green" ? "TOPICS" : "PROGRESS"}
          </p>
          <h2 className={`${
            tone === "green"
              ? "text-xl font-semibold"
              : "text-base font-medium"
          } text-[var(--app-text)]`}>
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {description}
          </p>
        </div>
        {chartsVisible && (
          <div className="mt-4 border-t border-[var(--app-border)] pt-4">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardCharts({ answers }: Props) {
  const [chartsVisible, setChartsVisible] = useState(true);
  let runningCorrect = 0;
  const accuracyData = answers.map((answer, index) => {
    if (answer.correct) runningCorrect++;
    return {
      question: index + 1,
      accuracy: Math.round((runningCorrect / (index + 1)) * 100),
    };
  });
  const errorData = errorTypes
    .map(({ key, name }) => ({
      name,
      mistakes: answers.filter(
        (answer) => !answer.correct && answer.error === key,
      ).length,
    }))
    .filter((item) => item.mistakes > 0)
    .sort((a, b) => b.mistakes - a.mistakes);
  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-4 pt-4 sm:px-6">
        <p className="text-sm text-[var(--app-text-muted)]">
          Learning insights
        </p>
        <button
          type="button"
          aria-expanded={chartsVisible}
          onClick={() => setChartsVisible((visible) => !visible)}
          className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-medium text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-accent)]"
        >
          {chartsVisible ? "Hide charts" : "Show charts"}
          <svg
            aria-hidden="true"
            className={`h-4 w-4 transition-transform ${chartsVisible ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <div className="grid divide-y divide-[var(--app-border)] lg:grid-cols-[1.15fr_0.85fr] lg:divide-x lg:divide-y-0">
      <ChartPanel
        title="Mistakes by topic"
        description="Concepts to spend a little more time on"
        tone="green"
        className="m-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-accent-soft)]/55 p-4 shadow-sm sm:m-4 sm:p-6 lg:mr-2"
        chartsVisible={chartsVisible}
      >
        {errorData.length ? (
          <div className="h-[320px] w-full">
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
                  tick={{ fill: "var(--app-text-muted)", fontSize: 11, fontWeight: 400 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={145}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--app-text)", fontSize: 12, fontWeight: 400 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--app-surface-muted)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--app-border)",
                    fontSize: "12px",
                    color: "var(--app-text)",
                  }}
                />
                <Bar
                  dataKey="mistakes"
                  fill="var(--app-accent)"
                  radius={[0, 7, 7, 0]}
                  barSize={23}
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
        tone="violet"
        className="p-4 sm:p-6 lg:pl-8"
        chartsVisible={chartsVisible}
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
                  tick={{ fill: "var(--app-text-muted)", fontSize: 11, fontWeight: 400 }}
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
                  tick={{ fill: "var(--app-text-muted)", fontSize: 11, fontWeight: 400 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Accuracy"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--app-border)",
                    fontSize: "12px",
                    color: "var(--app-text)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="var(--app-accent-secondary)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--app-accent-secondary)", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "var(--app-accent-secondary)" }}
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
    </div>
  );
}
