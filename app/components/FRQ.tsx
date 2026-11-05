"use client";
import { useState } from "react";

interface QuestionProps {
  question: string;
  isLast: boolean;
  disabled?: boolean;
  onSubmit: (work: string) => void;
}

function Question({ question, isLast, disabled, onSubmit }: QuestionProps) {
  const [work, setWork] = useState("");
  const enoughWritten = work.trim().length >= 20;

  return (
    <section className="app-panel">
      <h1 className="mb-6 text-xl font-medium leading-snug text-[var(--app-text)]">
        {question}
      </h1>
      <textarea
        className="app-textarea"
        maxLength={1000}
        placeholder="Show your work here..."
        rows={8}
        value={work}
        onChange={(e) => setWork(e.target.value)}
      />
      <button
        className="app-action app-action--primary mt-4"
        disabled={!enoughWritten || disabled}
        onClick={() => {
          onSubmit(work);
          setWork("");
        }}
      >
        {isLast ? "Submit" : "Next"}
      </button>
    </section>
  );
}
export default Question;
