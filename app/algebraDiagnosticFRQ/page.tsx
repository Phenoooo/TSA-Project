"use client";
import { useState } from "react";
import Link from "next/link";
import FRQS from "../data/diagnosticFRQ";
import Question from "../components/FRQ";
import { answers, questions } from "../components/FRQ";

export default function AlgebraDiagonosticFRQ() {
  const [index, setIndex] = useState(0);

  if (index == 5) {
    return (
      <Link
        href="/dashboard"
        onClick={async () => {
          const response = await fetch("/api/Check Question", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ answers: answers, questions: questions }),
          });
          const data = await response.json();
          console.log(data.feedback);
        }}
      >
        Dashboard
      </Link>
    );
  }

  return (
    <main>
      <Question
        question={FRQS[index].question}
        index={index}
        setIndex={setIndex}
      />
      <div></div>
    </main>
  );
}
