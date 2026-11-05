"use client";
import { useState } from "react";
import { NewQuestion } from "../data/questionEngine";
import { saveAnswers } from "../data/questionEngine";

type AnswerLetter = "A" | "B" | "C" | "D";

interface QuestionProps {
  question: string;
  answers: string[];
  index: number;
  diagnosis: Record<AnswerLetter, string>;
  difficulty: number;
  setIndex: (index: number) => void;
  onAnswer?: (letter: AnswerLetter, answer: NewQuestion) => void;
}

function Question(props: QuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerLetter | null>(
    null,
  );

  return (
    <section className="app-panel">
      <h1 className="mb-6 text-xl font-medium leading-snug text-[var(--app-text)]">
        {props.question}
      </h1>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!selectedAnswer) return;

          const diagnosis = props.diagnosis[selectedAnswer];
          const answer = new NewQuestion(
            diagnosis,
            props.index,
            props.difficulty,
            diagnosis === "correct",
          );
          saveAnswers(answer);
          props.onAnswer?.(selectedAnswer, answer);
          props.setIndex(props.index + 1);
          setSelectedAnswer(null);
        }}
      >
        <label className="app-choice" htmlFor="q1A">
          <input
            id="q1A"
            type="radio"
            name="mcq"
            value="A"
            checked={selectedAnswer === "A"}
            onChange={() => setSelectedAnswer("A")}
          />
          {props.answers[0]}
        </label>
        <label className="app-choice" htmlFor="q1B">
          <input
            id="q1B"
            type="radio"
            value="B"
            name="mcq"
            checked={selectedAnswer === "B"}
            onChange={() => setSelectedAnswer("B")}
          />
          {props.answers[1]}
        </label>
        <label className="app-choice" htmlFor="q1C">
          <input
            id="q1C"
            name="mcq"
            type="radio"
            value="C"
            checked={selectedAnswer === "C"}
            onChange={() => setSelectedAnswer("C")}
          />
          {props.answers[2]}
        </label>
        <label className="app-choice" htmlFor="q1D">
          <input
            id="q1D"
            type="radio"
            name="mcq"
            value="D"
            checked={selectedAnswer === "D"}
            onChange={() => setSelectedAnswer("D")}
          />
          {props.answers[3]}
        </label>
        <button
          disabled={!selectedAnswer}
          id="nextButton"
          className="app-action app-action--primary mt-2 justify-self-start"
          type="submit"
        >
          Next
        </button>
      </form>
    </section>
  );
}
export default Question;
