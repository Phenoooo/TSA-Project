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
import calculateQuestion from "../data/questionEngine";
export default function AlgebraDiagonosticMCQ() {
  const array = JSON.parse(localStorage.getItem("questionArray") || "[]");
  const [index, setIndex] = useState(0);
  if (index == 20) {
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