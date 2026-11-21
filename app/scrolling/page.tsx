"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import FRQ from "@/app/components/FRQ";
import { calculateNewScore, getMathLevelFromScore } from "@/lib/eloEngine";

interface StreamItem {
  id: string;
  type: "mcq" | "frq";
  question: string;
  choices?: string[];
  correctLetter?: string;
  solution: string;
  topicTag: string;
  problemScore: number;
  completed?: boolean;
  wasCorrect?: boolean;
  scoreDelta?: number;
  feedback?: string;
}

export default function UniversalScrollingStream() {
  const [score, setScore] = useState<number>(100);
  const [streak, setStreak] = useState<number>(0);
  const [feed, setFeed] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedScore = localStorage.getItem("mathScore");
    const startingScore = savedScore ? parseInt(savedScore, 10) : 100;
    setScore(startingScore);
    generateNext(startingScore, "mcq", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateNext = async (
    targetScore: number,
    nextType: "mcq" | "frq",
    currentFeed: StreamItem[]
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: targetScore,
          type: nextType,
          avoid: currentFeed.map((item) => item.question),
        }),
      });
      const data = await res.json();

      if (data.question) {
        setFeed((prev) => [
          ...prev,
          {
            id: `${nextType}-${Date.now()}`,
            type: nextType,
            question: data.question,
            choices: data.choices,
            correctLetter: data.correctLetter,
            solution: data.solution,
            topicTag: data.topicTag,
            problemScore: targetScore,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMCQSubmit = (item: StreamItem) => {
    const chosen = selectedChoices[item.id];
    if (!chosen) return;

    const isCorrect = chosen === item.correctLetter;
    const updatedScore = calculateNewScore(score, item.problemScore, isCorrect, streak);
    const delta = updatedScore - score;
    const nextStreak = isCorrect ? streak + 1 : 0;

    setScore(updatedScore);
    setStreak(nextStreak);
    localStorage.setItem("mathScore", updatedScore.toString());

    const updatedFeed = feed.map((f) =>
      f.id === item.id
        ? { ...f, completed: true, wasCorrect: isCorrect, scoreDelta: delta }
        : f
    );
    setFeed(updatedFeed);

    generateNext(updatedScore, "frq", updatedFeed);
  };

  const handleFRQSubmit = async (item: StreamItem, work: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/check-frq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: item.question, work }),
      });
      const result = await res.json();
      const isCorrect = Boolean(result.correct || result.isCorrect || result.score > 0);

      const updatedScore = calculateNewScore(score, item.problemScore, isCorrect, streak);
      const delta = updatedScore - score;
      const nextStreak = isCorrect ? streak + 1 : 0;

      setScore(updatedScore);
      setStreak(nextStreak);
      localStorage.setItem("mathScore", updatedScore.toString());

      const updatedFeed = feed.map((f) =>
        f.id === item.id
          ? {
              ...f,
              completed: true,
              wasCorrect: isCorrect,
              scoreDelta: delta,
              feedback: result.feedback || item.solution,
            }
          : f
      );
      setFeed(updatedFeed);

      generateNext(updatedScore, "mcq", updatedFeed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const levelInfo = getMathLevelFromScore(score);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-20 border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-sm font-semibold text-neutral-100">
              {levelInfo.tierName}
            </h1>
            <Link
              href="/placement"
              className="text-xs text-emerald-400 hover:underline"
            >
              Retake Placement Diagnostic →
            </Link>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-neutral-200">
              Score: <strong className="text-emerald-400">{score}/1000</strong>
            </span>
            <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-neutral-200">
              🔥 {streak}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        {feed.map((item, idx) => (
          <article
            key={item.id}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6"
          >
            <div className="mb-4 flex items-center justify-between text-xs text-neutral-400">
              <span className="uppercase tracking-wider">
                {item.type} • {item.topicTag} • #{idx + 1}
              </span>
              <span className="font-mono text-neutral-300">
                Difficulty Score {item.problemScore}
              </span>
            </div>

            {item.completed ? (
              <div className="space-y-2">
                <p className="font-mono text-sm text-neutral-200">{item.question}</p>
                <div
                  className={`inline-block rounded-md px-3 py-1 text-xs font-mono ${
                    item.wasCorrect
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {item.wasCorrect ? "✓ Solved" : "✕ Missed"} (
                  {item.scoreDelta && item.scoreDelta >= 0
                    ? `+${item.scoreDelta}`
                    : item.scoreDelta}{" "}
                  pts)
                </div>
                <p className="text-xs text-neutral-400 pt-1">
                  Solution: {item.feedback || item.solution}
                </p>
              </div>
            ) : item.type === "mcq" ? (
              <div className="space-y-4 font-mono">
                <p className="text-base text-neutral-100 leading-relaxed">
                  {item.question}
                </p>
                <div className="space-y-2.5">
                  {item.choices?.map((choice, cIdx) => {
                    const letter = ["A", "B", "C", "D"][cIdx];
                    const isPicked = selectedChoices[item.id] === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() =>
                          setSelectedChoices((prev) => ({ ...prev, [item.id]: letter }))
                        }
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          isPicked
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                            : "border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700"
                        }`}
                      >
                        <span className="text-neutral-500 mr-2.5">{letter}.</span>
                        {choice}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={!selectedChoices[item.id]}
                  onClick={() => handleMCQSubmit(item)}
                  className="px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-sans font-semibold hover:bg-white disabled:opacity-40"
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              <div className="font-mono">
                <FRQ
                  question={item.question}
                  isLast={false}
                  disabled={loading}
                  onSubmit={(work) => handleFRQSubmit(item, work)}
                />
              </div>
            )}
          </article>
        ))}

        {loading && (
          <div className="py-6 text-center text-xs font-mono text-neutral-400 animate-pulse">
            Generating next {levelInfo.tierName} problem...
          </div>
        )}
      </div>
    </main>
  );
}