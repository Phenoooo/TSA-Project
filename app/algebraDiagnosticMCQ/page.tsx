"use client";
import { useState } from "react";
import Link from "next/link";
import MCQS from "../data/diagnosticMCQ";
import Question from "../components/MCQ";
import { calculateTotal } from "../data/questionEngine";
import calculateQuestion from "../data/questionEngine";
export default function AlgebraDiagonosticMCQ() {
  const array = JSON.parse(localStorage.getItem("questionArray") || "[]");
  const [index, setIndex] = useState(0);
  if (index == 20) {
    calculateQuestion(array);
    calculateTotal(MCQS);
    return <Link href="/algebraDiagnosticFRQ">FRQS</Link>;
  }

  return (
    <main>
      <Question
        question={MCQS[index].question}
        answers={MCQS[index].answers}
        index={index}
        setIndex={setIndex}
        difficulty={MCQS[index].difficulty}
        diagnosis={MCQS[index].diagnosis}
      />
      <div></div>
    </main>
  );
}
