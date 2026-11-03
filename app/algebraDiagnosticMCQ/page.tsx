// "use client";
// import { useState } from "react";
// import Link from "next/link";
// import MCQS from "../data/diagnosticMCQ";
// import Question from "../components/MCQ";
// import { calculateTotal } from "../data/questionEngine";

// export default function AlgebraDiagonosticMCQ() {
//   const [index, setIndex] = useState(0);
//   if (index == 20) {
//     calculateTotal(MCQS);
//     return <Link href="/algebraDiagnosticFRQ">FRQS</Link>;
//   }

//   return (
//     <main>
//       <Question
//         question={MCQS[index].question}
//         answers={MCQS[index].answers}
//         index={index}
//         setIndex={setIndex}
//         difficulty={MCQS[index].difficulty}
//         diagnosis={MCQS[index].diagnosis}
//       />
//       <div></div>
//     </main>
//   );
// }


"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MCQS from "../data/diagnosticMCQ";
import Question from "../components/MCQ";
import { calculateTotal } from "../data/questionEngine";

export default function AlgebraDiagonosticMCQ() {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const finished = index === MCQS.length;
  const submitted = useRef(false);

  async function save(allPicks: string[]) {
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
  }

  useEffect(() => {
    if (!finished || submitted.current) return;
    submitted.current = true;
    calculateTotal(MCQS);
    save(picks);
  }, [finished, picks]);

  if (finished) {
    return (
      <main>
        <p>
          {saveStatus === "saved" && "Multiple-choice results saved."}
          {saveStatus === "idle" && "Saving your results..."}
          {saveStatus === "error" &&
            "We couldn't save your multiple-choice results."}
        </p>
        {saveStatus === "error" && (
          <button onClick={() => save(picks)}>Try again</button>
        )}
        <Link href="/algebraDiagnosticFRQ">FRQS</Link>
      </main>
    );
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
        onAnswer={(letter) => setPicks((p) => [...p, letter])}
      />
      <div></div>
    </main>
  );
}