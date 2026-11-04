"use client";
import { useState } from "react";

import React from "react";
import { NewQuestion } from "../data/questionEngine";
import { saveAnswers } from "../data/questionEngine";

interface QuestionProps {
  question: string;
  answers: string[];
  index: number;
  diagnosis: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  difficulty: number;

  setIndex: React.Dispatch<React.SetStateAction<number>>;
}

function Question(props: QuestionProps) {
  const [selected, setSelected] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  return (
    <div>
      <h1>{props.question}</h1>
      <form>
        <br></br>

        <br></br>

        <label htmlFor="q1A">
          <input
            id="q1A"
            type="radio"
            name="mcq"
            value="A"
            onChange={() => {
              setSelectedAnswer("A");
              setSelected(true);
            }}
          />
          {props.answers[0]}
        </label>
        <br></br>
        <label htmlFor="q1B">
          <input
            id="q1B"
            type="radio"
            value="B"
            name="mcq"
            onChange={() => {
              setSelectedAnswer("B");
              setSelected(true);
            }}
          />
          {props.answers[1]}
        </label>
        <br></br>
        <label htmlFor="q1C">
          <input
            id="q1C"
            name="mcq"
            type="radio"
            value="C"
            onChange={() => {
              setSelectedAnswer("C");
              setSelected(true);
            }}
          />
          {props.answers[2]}
        </label>
        <br></br>
        <label htmlFor="q1D">
          <input
            id="q1D"
            type="radio"
            name="mcq"
            value="D"
            onChange={() => {
              setSelectedAnswer("D");
              setSelected(true);
            }}
          />
          {props.answers[3]}
        </label>
      </form>
      <div></div>

      <button
        disabled={!selected}
        id="nextButton"
        onClick={() => {
          const answerA = document.getElementById("q1A") as HTMLInputElement;
          const answerB = document.getElementById("q1B") as HTMLInputElement;
          const answerC = document.getElementById("q1C") as HTMLInputElement;
          const answerD = document.getElementById("q1D") as HTMLInputElement;

          const diagnosis =
            props.diagnosis[selectedAnswer as keyof typeof props.diagnosis];
          if (!diagnosis) return;

          const newQuestion = new NewQuestion(
            diagnosis,
            props.index,
            props.difficulty,
            diagnosis === "correct",
          );

          props.setIndex(props.index + 1);
          saveAnswers(newQuestion);

          if (answerA.checked) {
            answerA.checked = false;
          } else if (answerB.checked) {
            answerB.checked = false;
          } else if (answerC.checked) {
            answerC.checked = false;
          } else if (answerD.checked) {
            answerD.checked = false;
          }
          setSelected(false);
        }}
      >
        next
      </button>
    </div>
  );
}
export default Question;
