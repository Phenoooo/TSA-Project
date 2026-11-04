"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FRQS from "../data/diagnosticFRQ";
import Question from "../components/FRQ";

interface Item {
  question: string;
  work: string;
}

export default function AlgebraDiagonosticFRQ() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<"answering" | "grading" | "error">(
    "answering",
  );

  async function grade(allItems: Item[]) {
    setStatus("grading");
    try {
      const res = await fetch("/api/check-frq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: allItems }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const result = await res.json();

      localStorage.setItem("latestFRQResult", JSON.stringify(result));
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  function handleSubmit(work: string) {
    const next = [...items, { question: FRQS[index].question, work }];
    setItems(next);
    if (index + 1 === FRQS.length) {
      grade(next);
    } else {
      setIndex(index + 1);
    }
  }

  if (status === "grading") return <main>Analyzing your work...</main>;
  if (status === "error") {
    return (
      <main>
        <p>Something went wrong analyzing your work.</p>
        <button onClick={() => grade(items)}>Try again</button>
      </main>
    );
  }

  return (
    <main>
      <Question
        key={index}
        question={FRQS[index].question}
        isLast={index + 1 === FRQS.length}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
