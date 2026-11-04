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
    <div>
      <h1>{question}</h1>
      <textarea
        maxLength={1000}
        placeholder="Show your work here..."
        rows={8}
        value={work}
        onChange={(e) => setWork(e.target.value)}
      />
      <br />
      <button
        disabled={!enoughWritten || disabled}
        onClick={() => {
          onSubmit(work);
          setWork("");
        }}
      >
        {isLast ? "submit" : "next"}
      </button>
    </div>
  );
}
export default Question;
