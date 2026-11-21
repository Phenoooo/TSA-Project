"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMathLevelFromScore } from "@/lib/eloEngine";

interface PlacementQuestion {
  question: string;
  choices: string[];
  correctLetter: string;
  topicTag: string;
  problemScore: number;
}

export default function PlacementDiagnosticPage() {
  const router = useRouter();
  const [estimatedScore, setEstimatedScore] = useState(100);
  const [questionNum, setQuestionNum] = useState(1);
  const [currentQ, setCurrentQ] = useState<PlacementQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  const TOTAL_QUESTIONS = 5;

  const fetchPlacementQuestion = async (targetScore: number) => {
    setLoading(true);
    setSelected(null);
    try {
      const res = await fetch("/api/generate-universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: targetScore,
          type: "mcq",
          avoid: askedQuestions,
        }),
      });
      const data = await res.json();
      setCurrentQ(data);
      if (data.question) {
        setAskedQuestions((prev) => [...prev, data.question]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacementQuestion(100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    if (!selected || !currentQ) return;

    const isCorrect = selected === currentQ.correctLetter;
    const swing = isCorrect ? 180 : -120;
    const nextScore = Math.max(0, Math.min(1000, estimatedScore + swing));
    setEstimatedScore(nextScore);

    if (questionNum >= TOTAL_QUESTIONS) {
      localStorage.setItem("mathScore", nextScore.toString());
      router.push("/scrolling");
    } else {
      setQuestionNum((q) => q + 1);
      fetchPlacementQuestion(nextScore);
    }
  };

  const levelInfo = getMathLevelFromScore(estimatedScore);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8 shadow-2xl">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
          <span>Math Placement Diagnostic ({questionNum}/{TOTAL_QUESTIONS})</span>
          <span className="font-mono text-emerald-400">
            Score: {estimatedScore}/1000 • {levelInfo.tierName}
          </span>
        </div>

        <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(questionNum / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>

        {loading || !currentQ ? (
          <div className="py-16 text-center text-sm text-neutral-400 animate-pulse font-mono">
            Calibrating {levelInfo.tierName} problem...
          </div>
        ) : (
          <>
            <div className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">
              Topic: {currentQ.topicTag}
            </div>
            <h2 className="text-lg font-mono text-neutral-100 mb-6 leading-relaxed">
              {currentQ.question}
            </h2>

            <div className="space-y-3 mb-8">
              {currentQ.choices?.map((choice, idx) => {
                const letter = ["A", "B", "C", "D"][idx];
                const isSelected = selected === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => setSelected(letter)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border font-mono text-sm transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                        : "border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    <span className="text-neutral-500 mr-3 font-bold">{letter}.</span>
                    {choice}
                  </button>
                );
              })}
            </div>

            <button
              disabled={!selected}
              onClick={handleSubmit}
              className="w-full py-3.5 rounded-xl bg-neutral-100 text-neutral-950 font-semibold text-sm hover:bg-white disabled:opacity-40 transition-all"
            >
              {questionNum === TOTAL_QUESTIONS
                ? "Lock In Score & Launch Stream"
                : "Submit & Next"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}