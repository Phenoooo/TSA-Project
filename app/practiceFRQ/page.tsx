"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Question from "../components/FRQ";

interface GeneratedQuestion {
  id: string;
  question: string;
  targetCategory: string;
  difficulty: number;
}
interface Generated {
  level: number;
  label: string;
  weakestTopics: string[];
  questions: GeneratedQuestion[];
}
interface Analysis {
  questionIndex: number;
  question: string;
  isCorrect: boolean;
  correctAnswer: string;
  summary: string;
  errors: { category: string; where: string; explanation: string }[];
}
interface GradeResult {
  analyses: Analysis[];
  profile: { level: number; label: string; weakestTopics: string[] } | null;
}

const pretty = (s: string) => s.replaceAll("_", " ");

async function requestQuestions(): Promise<Generated> {
  const res = await fetch("/api/generate-frq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: 3 }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

export default function PracticeFRQ() {
  const [status, setStatus] = useState<
    "loading" | "answering" | "grading" | "done" | "error"
  >("loading");
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [index, setIndex] = useState(0);
  const [works, setWorks] = useState<string[]>([]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const started = useRef(false);

  function fetchQuestions() {
    requestQuestions()
      .then((g) => {
        setGenerated(g);
        setStatus("answering");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStatus("error");
      });
  }

  function reload() {
    setStatus("loading");
    setIndex(0);
    setWorks([]);
    setResult(null);
    fetchQuestions();
  }

  useEffect(() => {
    if (started.current) return; // avoid double generation in dev strict mode
    started.current = true;
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function grade(allWorks: string[]) {
    if (!generated) return;
    setStatus("grading");
    try {
      const res = await fetch("/api/check-frq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "practice",
          items: generated.questions.map((q, i) => ({
            question: q.question,
            work: allWorks[i],
            difficulty: q.difficulty,
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setResult(body);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  function handleSubmit(work: string) {
    if (!generated) return;
    const next = [...works, work];
    setWorks(next);
    if (index + 1 === generated.questions.length) {
      grade(next);
    } else {
      setIndex(index + 1);
    }
  }

  if (status === "loading") return <main className="app-page app-status">Writing questions for you...</main>;
  if (status === "grading") return <main className="app-page app-status">Analyzing your work...</main>;

  if (status === "error") {
    return (
      <main className="app-page">
        <section className="app-panel">
        <p>{error}</p>
        <button
          className="app-action app-action--primary"
          onClick={() =>
            works.length && generated && works.length === generated.questions.length
              ? grade(works)
              : reload()
          }
        >
          Try again
        </button>
        </section>
      </main>
    );
  }

  if (status === "done" && result && generated) {
    const after = result.profile?.level;
    return (
      <main className="app-page">
        <section className="app-panel">
        <h1>Practice results</h1>
        <p>
          Level: {generated.level} → {after ?? "?"} / 10
          {result.profile ? ` (${result.profile.label})` : ""}
        </p>
        {result.profile && result.profile.weakestTopics.length > 0 && (
          <p>
            Still working on:{" "}
            {result.profile.weakestTopics.map(pretty).join(", ")}
          </p>
        )}
        {result.analyses.map((a) => (
          <div className="app-panel app-panel--compact" key={a.questionIndex}>
            <h3>
              Q{a.questionIndex + 1}: {a.isCorrect ? "Correct" : "Needs work"}
            </h3>
            <p>{a.summary}</p>
            {!a.isCorrect && <p>Correct answer: {a.correctAnswer}</p>}
            <ul>
              {a.errors.map((e, i) => (
                <li key={i}>
                  {pretty(e.category)}: {e.explanation}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="flex flex-wrap gap-3">
          <button className="app-action app-action--primary" onClick={reload}>Practice again</button>
          <Link className="app-action app-action--secondary" href="/practiceMCQ">Try MCQs</Link>
          <Link className="app-action app-action--secondary" href="/dashboard">Statistics</Link>
        </div>
        </section>
      </main>
    );
  }

  if (!generated) return null;
  const q = generated.questions[index];
  return (
    <main className="app-page">
      <section className="app-panel">
      <p className="app-eyebrow">
        Your level: {generated.level} / 10 ({generated.label})
        {generated.weakestTopics.length > 0 &&
          ` · Focus: ${generated.weakestTopics.map(pretty).join(", ")}`}
      </p>
      <div className="app-progress-track" aria-label={`Question ${index + 1} of ${generated.questions.length}`}>
        <div className="app-progress-value" style={{ width: `${((index + 1) / generated.questions.length) * 100}%` }} />
      </div>
      <p className="app-eyebrow">
        Question {index + 1} of {generated.questions.length}
        {q.targetCategory ? ` · practicing ${pretty(q.targetCategory)}` : ""}
      </p>
      <Question
        key={q.id}
        question={q.question}
        isLast={index + 1 === generated.questions.length}
        onSubmit={handleSubmit}
      />
      </section>
    </main>
  );
}