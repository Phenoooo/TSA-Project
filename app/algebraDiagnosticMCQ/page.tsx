"use client";
import { useState } from "react";
import Link from "next/link";
import MCQS from "../data/diagnosticMCQ";
import Question from "../components/MCQ";

export default function AlgebraDiagonosticMCQ() {
  const [index, setIndex] = useState(0);
  if (index == 20) {
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
