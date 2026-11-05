"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import MCQS from "../data/diagnosticMCQ";
import Question from "../components/MCQ";
import {
  calculateTotal,
  NewQuestion,
} from "../data/questionEngine";
import CalculateAnswers from "../data/questionEngine";

type AnswerLetter = "A" | "B" | "C" | "D";

export default function AlgebraDiagonosticMCQ() {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<AnswerLetter[]>([]);
  const [answers, setAnswers] = useState<NewQuestion[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const finished = index === MCQS.length;
  const submitted = useRef(false);

  const save = useCallback(async (allPicks: AnswerLetter[]) => {
    try {
      const res = await fetch("/api/placement-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks: allPicks }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveStatus("saved");
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("questionArray", "[]");
  }, []);

  useEffect(() => {
    if (!finished || submitted.current) return;
    submitted.current = true;
    CalculateAnswers(answers);
    calculateTotal(MCQS);
    void save(picks);
  }, [answers, finished, picks, save]);

  if (finished) {
    return (
      <main className="app-page app-status">
        <p>
          {saveStatus === "saved" && "Multiple-choice results saved."}
          {saveStatus === "idle" && "Saving your results..."}
          {saveStatus === "error" &&
            "We couldn't save your multiple-choice results."}
        </p>
        {saveStatus === "error" && (
          <button className="app-action app-action--primary" onClick={() => save(picks)}>Try again</button>
        )}
        <Link className="app-action app-action--secondary" href="/algebraDiagnosticFRQ">FRQS</Link>
      </main>
    );
  }

  return (
    <main className="app-page">
      <Question
        question={MCQS[index].question}
        answers={MCQS[index].answers}
        index={index}
        setIndex={setIndex}
        difficulty={MCQS[index].difficulty}
        diagnosis={MCQS[index].diagnosis}
        onAnswer={(letter, answer) => {
          setPicks((previous) => [...previous, letter]);
          setAnswers((previous) => [...previous, answer]);
        }}
      />
      <div></div>
    </main>
  );
}
