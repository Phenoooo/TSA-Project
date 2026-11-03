"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface GeneratedMCQ {
  id: string;
  question: string;
  answers: string[];
  targetCategory: string;
  difficulty: number;
}
interface Generated {
  batchId: string;
  level: number;
  label: string;
  weakestTopics: string[];
  questions: GeneratedMCQ[];
}
interface QuestionResult {
  index: number;
  correct: boolean;
  pickedLetter: string;
  correctLetter: string;
  mistake: string | null;
}
interface GradeResult {
  profile: { level: number; label: string; weakestTopics: string[] };
  results: QuestionResult[];
}

const LETTERS = ["A", "B", "C", "D"];
const pretty = (s: string) => s.replaceAll("_", " ");

async function requestQuestions(): Promise<Generated> {
  const res = await fetch("/api/generate-mcq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: 5 }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

export default function PracticeMCQ() {
  const [status, setStatus] = useState<
    "loading" | "answering" | "grading" | "done" | "error"
  >("loading");
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
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
    setPicks([]);
    setSelected("");
    setResult(null);
    fetchQuestions();
  }

  useEffect(() => {
    if (started.current) return; // avoid double generation in dev strict mode
    started.current = true;
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function grade(allPicks: string[]) {
    if (!generated) return;
    setStatus("grading");
    try {
      const res = await fetch("/api/practice-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: generated.batchId, picks: allPicks }),
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

  function handleNext() {
    if (!generated || !selected) return;
    const next = [...picks, selected];
    setPicks(next);
    setSelected("");
    if (index + 1 === generated.questions.length) {
      grade(next);
    } else {
      setIndex(index + 1);
    }
  }

  if (status === "loading") return <main>Writing questions for you...</main>;
  if (status === "grading") return <main>Checking your answers...</main>;

  if (status === "error") {
    return (
      <main>
        <p>{error}</p>
        <button
          onClick={() =>
            generated && picks.length === generated.questions.length
              ? grade(picks)
              : reload()
          }
        >
          Try again
        </button>
      </main>
    );
  }

  if (status === "done" && result && generated) {
    const right = result.results.filter((r) => r.correct).length;
    return (
      <main>
        <h1>Practice results</h1>
        <p>
          {right} of {result.results.length} correct
        </p>
        <p>
          Level: {generated.level} → {result.profile.level} / 10 (
          {result.profile.label})
        </p>
        {result.profile.weakestTopics.length > 0 && (
          <p>
            Still working on: {result.profile.weakestTopics.map(pretty).join(", ")}
          </p>
        )}
        {result.results.map((r) => {
          const q = generated.questions[r.index];
          return (
            <div key={q.id}>
              <h3>
                Q{r.index + 1}: {r.correct ? "Correct" : "Incorrect"}
              </h3>
              <p>{q.question}</p>
              {!r.correct && (
                <>
                  <p>
                    You picked {r.pickedLetter}:{" "}
                    {q.answers[LETTERS.indexOf(r.pickedLetter)]}
                    {r.mistake ? ` (${pretty(r.mistake)})` : ""}
                  </p>
                  <p>
                    Correct answer: {r.correctLetter}:{" "}
                    {q.answers[LETTERS.indexOf(r.correctLetter)]}
                  </p>
                </>
              )}
            </div>
          );
        })}
        <button onClick={reload}>Practice again</button>{" "}
        <Link href="/practiceFRQ">Try FRQs</Link>{" "}
        <Link href="/dashboard">Dashboard</Link>
      </main>
    );
  }

  if (!generated) return null;
  const q = generated.questions[index];
  return (
    <main>
      <p>
        Your level: {generated.level} / 10 ({generated.label})
        {generated.weakestTopics.length > 0 &&
          ` · Focus: ${generated.weakestTopics.map(pretty).join(", ")}`}
      </p>
      <p>
        Question {index + 1} of {generated.questions.length}
      </p>
      <h1>{q.question}</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        {q.answers.map((answer, i) => (
          <label key={i} style={{ display: "block" }}>
            <input
              type="radio"
              name="choice"
              checked={selected === LETTERS[i]}
              onChange={() => setSelected(LETTERS[i])}
            />{" "}
            {answer}
          </label>
        ))}
      </form>
      <button disabled={!selected} onClick={handleNext}>
        {index + 1 === generated.questions.length ? "submit" : "next"}
      </button>
    </main>
  );
}