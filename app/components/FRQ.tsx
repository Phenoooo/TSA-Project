"use client";
import { useState } from "react";

interface QuestionProps {
  question: string;
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
}
export const questions: string[] = [];
export const answers: string[] = [];

function Question(props: QuestionProps) {
  const [enoughWordsTypes, setWordsTyped] = useState(false);
  return (
    <div>
      <h1>{props.question}</h1>
      <textarea
        maxLength={1000}
        placeholder="Show your work here..."
        rows={8}
        id="textArea"
        onChange={() => {
          const textArea = document.getElementById(
            "textArea",
          ) as HTMLTextAreaElement;
          if (textArea.value.length >= 20) {
            setWordsTyped(true);
          } else {
            setWordsTyped(false);
          }
        }}
      ></textarea>

      <br></br>

      <button
        id="nextButton"
        onClick={() => {
          const textArea = document.getElementById(
            "textArea",
          ) as HTMLTextAreaElement;
          answers.push(textArea.value);
          questions.push(props.question);
          props.setIndex(props.index + 1);

          textArea.value = "";
          setWordsTyped(false);
        }}
      >
        next
      </button>
    </div>
  );
}
export default Question;
