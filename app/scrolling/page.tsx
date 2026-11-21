"use client";

import React, { useState, useEffect } from "react";
import { calculateNewScore, getMathLevelFromScore } from "@/lib/eloEngine";
import FRQ from "@/app/components/FRQ";

interface QuestionItem {
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
  revealed?: boolean;
}

export default function UnifiedMathPlatform() {
  const [activeTab, setActiveTab] = useState<"diagnostic" | "scrolling" | "stats">("diagnostic");
  const [loading, setLoading] = useState<boolean>(false);

  const [score, setScore] = useState<number>(100);
  const [streak, setStreak] = useState<number>(0);

  const [placementNum, setPlacementNum] = useState<number>(1);
  const [placementQ, setPlacementQ] = useState<QuestionItem | null>(null);
  const [placementSelected, setPlacementSelected] = useState<string | null>(null);
  const [askedPlacement, setAskedPlacement] = useState<string[]>([]);
  const TOTAL_PLACEMENT = 5;

  const [feed, setFeed] = useState<QuestionItem[]>([]);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("mathScore");
    if (saved) {
      const parsed = parseInt(saved, 10);
      setScore(parsed);
      setActiveTab("scrolling");
      fetchScrollingProblem(parsed, "mcq", []);
    } else {
      fetchDiagnosticQuestion(100, []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDiagnosticQuestion = async (targetScore: number, avoidList: string[]) => {
    setLoading(true);
    setPlacementSelected(null);
    try {
      const res = await fetch("/api/generate-universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: targetScore, type: "mcq", avoid: avoidList }),
      });
      const data = await res.json();
      if (data.question) {
        setPlacementQ({
          id: `diag-${Date.now()}`,
          type: "mcq",
          question: data.question,
          choices: data.choices,
          correctLetter: data.correctLetter,
          solution: data.solution,
          topicTag: data.topicTag,
          problemScore: targetScore,
        });
        setAskedPlacement((prev) => [...prev, data.question]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnosticSubmit = () => {
    if (!placementSelected || !placementQ) return;

    const isCorrect = placementSelected === placementQ.correctLetter;
    const swing = isCorrect ? 180 : -120;
    const nextScore = Math.max(0, Math.min(1000, score + swing));
    setScore(nextScore);

    if (placementNum >= TOTAL_PLACEMENT) {
      localStorage.setItem("mathScore", nextScore.toString());
      setActiveTab("scrolling");
      fetchScrollingProblem(nextScore, "mcq", []);
    } else {
      setPlacementNum((n) => n + 1);
      fetchDiagnosticQuestion(nextScore, askedPlacement);
    }
  };

  const fetchScrollingProblem = async (targetScore: number, nextType: "mcq" | "frq", currentFeed: QuestionItem[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: targetScore,
          type: nextType,
          avoid: currentFeed.map((i) => i.question),
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

  const handleStreamMCQSubmit = (item: QuestionItem) => {
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
      f.id === item.id ? { ...f, completed: true, wasCorrect: isCorrect, scoreDelta: delta } : f
    );
    setFeed(updatedFeed);
    fetchScrollingProblem(updatedScore, "frq", updatedFeed);
  };

  const handleMCQGiveUp = (item: QuestionItem) => {
    const nextStreak = 0;
    setStreak(nextStreak);

    const updatedFeed = feed.map((f) =>
      f.id === item.id
        ? {
            ...f,
            completed: true,
            wasCorrect: false,
            scoreDelta: 0,
            revealed: true,
            feedback: `Correct Answer was (${item.correctLetter}). Solution: ${item.solution}`,
          }
        : f
    );
    setFeed(updatedFeed);
    fetchScrollingProblem(score, "frq", updatedFeed);
  };

  const handleStreamFRQSubmit = async (item: QuestionItem, work: string) => {
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
      fetchScrollingProblem(updatedScore, "mcq", updatedFeed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const levelInfo = getMathLevelFromScore(score);

  const completedProblems = feed.filter((f) => f.completed);
  const correctCount = completedProblems.filter((f) => f.wasCorrect).length;
  const accuracyRate = completedProblems.length > 0 ? Math.round((correctCount / completedProblems.length) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30">
      {/* SIDEBAR */}
      <aside className="w-20 border-r border-neutral-900 bg-neutral-950 flex flex-col items-center py-6 justify-between select-none">
        <div className="space-y-6 flex flex-col items-center">
          <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-mono text-emerald-400">
            Ω
          </div>
          <div className="w-8 h-[1px] bg-neutral-900" />
          <div className="space-y-2 flex flex-col items-center">
            <button
              onClick={() => setActiveTab("diagnostic")}
              title="Diagnostic & Calibration"
              className={`p-3 rounded-xl transition-all ${
                activeTab === "diagnostic"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                  : "text-neutral-500 hover:bg-neutral-900/60 hover:text-neutral-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </button>

            <button
              onClick={() => {
                setActiveTab("scrolling");
                if (feed.length === 0) fetchScrollingProblem(score, "mcq", []);
              }}
              title="Scrolling Practice Stream"
              className={`p-3 rounded-xl transition-all ${
                activeTab === "scrolling"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                  : "text-neutral-500 hover:bg-neutral-900/60 hover:text-neutral-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              title="Statistics & Performance"
              className={`p-3 rounded-xl transition-all ${
                activeTab === "stats"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                  : "text-neutral-500 hover:bg-neutral-900/60 hover:text-neutral-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center justify-center font-mono text-xs font-semibold">
          {score}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {activeTab === "diagnostic" ? (
          <div className="min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-xl rounded-2xl border border-neutral-900 bg-neutral-900/40 p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-3 font-mono">
                <span>Placement Diagnostic ({placementNum}/{TOTAL_PLACEMENT})</span>
                <span className="text-emerald-400">
                  Est. Score: {score}/1000 • {levelInfo.tierName}
                </span>
              </div>

              <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden mb-8">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(placementNum / TOTAL_PLACEMENT) * 100}%` }}
                />
              </div>

              {loading || !placementQ ? (
                <div className="py-16 text-center text-xs text-neutral-400 animate-pulse font-mono">
                  Generating {levelInfo.tierName} question...
                </div>
              ) : (
                <>
                  <div className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500 font-mono">
                    Topic: {placementQ.topicTag}
                  </div>
                  <h2 className="text-lg font-mono text-neutral-100 mb-6 leading-relaxed">
                    {placementQ.question}
                  </h2>

                  <div className="space-y-3 mb-8 font-mono">
                    {placementQ.choices?.map((choice, idx) => {
                      const letter = ["A", "B", "C", "D"][idx];
                      const isSelected = placementSelected === letter;
                      return (
                        <button
                          key={letter}
                          onClick={() => setPlacementSelected(letter)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all ${
                            isSelected
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                              : "border-neutral-900 bg-neutral-950/60 text-neutral-300 hover:border-neutral-800"
                          }`}
                        >
                          <span className="text-neutral-600 mr-3 font-bold">{letter}.</span>
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      disabled={!placementSelected}
                      onClick={handleDiagnosticSubmit}
                      className="px-6 py-3.5 rounded-xl bg-neutral-100 text-neutral-950 font-semibold text-xs uppercase tracking-wider hover:bg-white disabled:opacity-30 transition-all"
                    >
                      {placementNum === TOTAL_PLACEMENT ? "Lock In Score & Open Stream" : "Submit & Next →"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : activeTab === "scrolling" ? (
          <div className="max-w-2xl mx-auto px-6 py-10">
            <header className="sticky top-0 z-20 pb-6 mb-6 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between">
              <div>
                <h1 className="text-sm font-semibold text-neutral-100">{levelInfo.tierName}</h1>
                <p className="text-xs text-neutral-500 font-mono">Endless Adaptive Math Stream</p>
              </div>

              <div className="flex items-center gap-2.5 text-xs font-mono">
                <span className="rounded-xl border border-neutral-900 bg-neutral-900/50 px-3.5 py-1.5 text-neutral-300">
                  Score: <strong className="text-emerald-400">{score}/1000</strong>
                </span>
                <span className="rounded-xl border border-neutral-900 bg-neutral-900/50 px-3.5 py-1.5 text-neutral-300">
                  🔥 {streak}
                </span>
              </div>
            </header>

            <div className="space-y-6">
              {feed.map((item, idx) => (
                <article key={item.id} className="rounded-2xl border border-neutral-900 bg-neutral-900/30 p-6 backdrop-blur-md">
                  <div className="mb-4 flex items-center justify-between text-xs text-neutral-500 font-mono">
                    <span className="uppercase tracking-wider">
                      {item.type} • {item.topicTag} • #{idx + 1}
                    </span>
                    <span className="text-neutral-400">Difficulty Score {item.problemScore}</span>
                  </div>

                  {item.completed ? (
                    <div className="space-y-2">
                      <p className="font-mono text-sm text-neutral-200">{item.question}</p>
                      <div
                        className={`inline-block rounded-lg px-3 py-1 text-xs font-mono ${
                          item.wasCorrect
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {item.wasCorrect ? "✓ Solved" : item.revealed ? "✕ Given Up" : "✕ Missed"} ({item.scoreDelta && item.scoreDelta >= 0 ? `+${item.scoreDelta}` : item.scoreDelta} pts)
                      </div>
                      <p className="text-xs text-neutral-400 pt-1">Solution: {item.feedback || item.solution}</p>
                    </div>
                  ) : item.type === "mcq" ? (
                    <div className="space-y-4 font-mono">
                      <p className="text-base text-neutral-100 leading-relaxed">{item.question}</p>
                      <div className="space-y-2.5">
                        {item.choices?.map((choice, cIdx) => {
                          const letter = ["A", "B", "C", "D"][cIdx];
                          const isPicked = selectedChoices[item.id] === letter;
                          return (
                            <button
                              key={letter}
                              onClick={() => setSelectedChoices((prev) => ({ ...prev, [item.id]: letter }))}
                              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                                isPicked
                                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                                  : "border-neutral-900 bg-neutral-950/60 text-neutral-300 hover:border-neutral-800"
                              }`}
                            >
                              <span className="text-neutral-600 mr-2.5">{letter}.</span>
                              {choice}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right-aligned Give Up & Submit buttons for MCQ */}
                      <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => handleMCQGiveUp(item)}
                          className="px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 text-xs hover:bg-neutral-800 hover:text-neutral-200 transition-all"
                        >
                          Give Up
                        </button>
                        <button
                          disabled={!selectedChoices[item.id]}
                          onClick={() => handleStreamMCQSubmit(item)}
                          className="px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-sans font-semibold hover:bg-white disabled:opacity-30 transition-all shadow-lg"
                        >
                          Submit Answer →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono">
                      <FRQ
                        question={item.question}
                        isLast={false}
                        disabled={loading}
                        onSubmit={(work) => handleStreamFRQSubmit(item, work)}
                      />
                    </div>
                  )}
                </article>
              ))}

              {loading && (
                <div className="py-6 text-center text-xs font-mono text-neutral-500 animate-pulse">
                  Generating next {levelInfo.tierName} problem...
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-12">
            <h1 className="text-lg font-mono font-semibold text-neutral-100 mb-2">Performance Analytics</h1>
            <p className="text-xs text-neutral-500 font-mono mb-8">Review your mathematical standing and activity stats.</p>

            <div className="grid grid-cols-2 gap-4 mb-8 font-mono">
              <div className="rounded-2xl border border-neutral-900 bg-neutral-900/30 p-6">
                <div className="text-xs text-neutral-500 mb-1">CURRENT ELO SCORE</div>
                <div className="text-2xl font-bold text-emerald-400">{score} <span className="text-xs text-neutral-500 font-normal">/ 1000</span></div>
                <div className="text-xs text-neutral-300 mt-2">{levelInfo.tierName}</div>
              </div>

              <div className="rounded-2xl border border-neutral-900 bg-neutral-900/30 p-6">
                <div className="text-xs text-neutral-500 mb-1">ACTIVE STREAK</div>
                <div className="text-2xl font-bold text-emerald-400">🔥 {streak}</div>
                <div className="text-xs text-neutral-300 mt-2">Consecutive correct answers</div>
              </div>

              <div className="rounded-2xl border border-neutral-900 bg-neutral-900/30 p-6">
                <div className="text-xs text-neutral-500 mb-1">ACCURACY RATE</div>
                <div className="text-2xl font-bold text-neutral-100">{accuracyRate}%</div>
                <div className="text-xs text-neutral-300 mt-2">{correctCount} of {completedProblems.length} solved</div>
              </div>

              <div className="rounded-2xl border border-neutral-900 bg-neutral-900/30 p-6">
                <div className="text-xs text-neutral-500 mb-1">PROBLEMS ATTEMPTED</div>
                <div className="text-2xl font-bold text-neutral-100">{completedProblems.length}</div>
                <div className="text-xs text-neutral-300 mt-2">Total practice session items</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}