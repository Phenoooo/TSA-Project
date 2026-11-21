
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  calculateNewScore,
  getMathLevelFromScore,
} from "@/lib/eloEngine";

import FRQ from "@/app/components/FRQ";

type Question = {
  question: string;
  choices?: string[];
  correctLetter?: string;
  solution?: string;
  topicTag?: string;
  problemScore?: number;
};

type FeedItem = Question & {
  id: string;
  type: "mcq" | "frq";
};

type AnswerRecord = {
  id: string;
  question: string;
  topic: string;
  type: "mcq" | "frq" | "diagnostic";
  correct: boolean;
  score: number;
  date: number;
};

type ScorePoint = {
  score: number;
  date: number;
};

type StatsData = {
  answers: AnswerRecord[];
  scoreHistory: ScorePoint[];
};

const TOTAL_PLACEMENT = 15;

const EMPTY_STATS: StatsData = {
  answers: [],
  scoreHistory: [],
};

// Safely read JSON responses and expose actual API errors.
async function readApiResponse(response: Response) {
  let data: any;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    console.error("API request failed:", {
      status: response.status,
      response: data,
    });

    throw new Error(
      data.details ||
      data.error ||
      `Request failed with status ${response.status}.`
    );
  }

  return data;
}

export default function UnifiedMathPlatform() {
  const [activeTab, setActiveTab] = useState<
    "diagnostic" | "scrolling" | "statistics"
  >("diagnostic");

  const [score, setScore] = useState(100);
  const [streak, setStreak] = useState(0);

  const [stats, setStats] = useState<StatsData>(EMPTY_STATS);
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Diagnostic
  const [placementNum, setPlacementNum] = useState(0);
  const [placementQ, setPlacementQ] = useState<Question | null>(null);
  const [placementSelected, setPlacementSelected] = useState("");
  const [askedPlacement, setAskedPlacement] = useState<string[]>([]);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState("");

  const diagnosticStarted = useRef(false);

  // Practice feed
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [selectedChoices, setSelectedChoices] = useState<
    Record<string, string>
  >({});
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const level = getMathLevelFromScore(score);

  // -------------------------------
  // LOAD SAVED DATA
  // -------------------------------

  useEffect(() => {
    try {
      const savedScore = localStorage.getItem("mathScore");
      const savedStats = localStorage.getItem("mathStats");

      if (savedScore !== null) {
        const parsedScore = Number(savedScore);

        if (
          Number.isFinite(parsedScore) &&
          parsedScore >= 0 &&
          parsedScore <= 1000
        ) {
          setScore(parsedScore);
        }
      }

      if (savedStats) {
        const parsed = JSON.parse(savedStats);

        if (
          Array.isArray(parsed.answers) &&
          Array.isArray(parsed.scoreHistory)
        ) {
          setStats(parsed);
        }
      }
    } catch (error) {
      console.error("Could not load saved data:", error);
    }

    setStatsLoaded(true);
  }, []);

  // -------------------------------
  // SAVE DATA
  // -------------------------------

  useEffect(() => {
    if (!statsLoaded) return;

    localStorage.setItem("mathScore", String(score));
    localStorage.setItem("mathStats", JSON.stringify(stats));
  }, [score, stats, statsLoaded]);

  // -------------------------------
  // RECORD STATISTICS
  // -------------------------------

  const recordResult = (
    question: string,
    topic: string,
    type: AnswerRecord["type"],
    correct: boolean,
    newScore: number
  ) => {
    const now = Date.now();

    const record: AnswerRecord = {
      id: `${now}-${Math.random()}`,
      question,
      topic,
      type,
      correct,
      score: newScore,
      date: now,
    };

    setStats((previous) => ({
      answers: [...previous.answers, record].slice(-500),
      scoreHistory: [
        ...previous.scoreHistory,
        {
          score: newScore,
          date: now,
        },
      ].slice(-50),
    }));
  };

  // -------------------------------
  // GENERATE DIAGNOSTIC QUESTION
  // -------------------------------

  const fetchDiagnosticQuestion = useCallback(
    async (currentScore: number, avoid: string[] = []) => {
      setDiagnosticLoading(true);
      setDiagnosticError("");
      setPlacementQ(null);
      setPlacementSelected("");

      try {
        const response = await fetch("/api/generate-universal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score: currentScore,
            type: "mcq",
            avoid,
          }),
        });

        const data = await readApiResponse(response);

        if (
          typeof data.question !== "string" ||
          !Array.isArray(data.choices) ||
          data.choices.length !== 4 ||
          !["A", "B", "C", "D"].includes(
            String(data.correctLetter).toUpperCase()
          )
        ) {
          throw new Error(
            "The generated diagnostic question was incomplete or invalid."
          );
        }

        setPlacementQ(data);
      } catch (error) {
        console.error("Diagnostic generation failed:", error);

        setDiagnosticError(
          error instanceof Error
            ? error.message
            : "Could not generate a diagnostic question."
        );
      } finally {
        setDiagnosticLoading(false);
      }
    },
    []
  );

  // -------------------------------
  // GENERATE PRACTICE QUESTION
  // -------------------------------

  const fetchScrollingProblem = useCallback(
    async (
      currentScore: number,
      type: "mcq" | "frq",
      avoid: string[] = []
    ) => {
      setLoadingFeed(true);
      setFeedError("");

      try {
        const response = await fetch("/api/generate-universal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score: currentScore,
            type,
            avoid,
          }),
        });

        const data = await readApiResponse(response);

        if (
          typeof data.question !== "string" ||
          !data.question.trim()
        ) {
          throw new Error("The generated question was incomplete.");
        }

        if (
          type === "mcq" &&
          (
            !Array.isArray(data.choices) ||
            data.choices.length !== 4 ||
            !["A", "B", "C", "D"].includes(
              String(data.correctLetter).toUpperCase()
            )
          )
        ) {
          throw new Error("The generated multiple-choice question is invalid.");
        }

        const newItem: FeedItem = {
          id: `${Date.now()}-${Math.random()}`,
          type,
          question: data.question,
          choices: data.choices,
          correctLetter: data.correctLetter,
          solution: data.solution,
          topicTag: data.topicTag,
          problemScore: data.problemScore,
        };

        setFeed((previous) => [...previous, newItem]);
      } catch (error) {
        console.error("Practice generation failed:", error);

        setFeedError(
          error instanceof Error
            ? error.message
            : "Could not generate the next question."
        );
      } finally {
        setLoadingFeed(false);
      }
    },
    []
  );

  // -------------------------------
  // START DIAGNOSTIC AFTER LOADING
  // -------------------------------

  useEffect(() => {
    if (!statsLoaded || diagnosticStarted.current) return;

    diagnosticStarted.current = true;
    void fetchDiagnosticQuestion(score);
  }, [statsLoaded, score, fetchDiagnosticQuestion]);

  // -------------------------------
  // DIAGNOSTIC SUBMISSION
  // -------------------------------

  const handleDiagnosticSubmit = () => {
    if (!placementQ || !placementSelected) return;

    const correct =
      placementSelected.toUpperCase() ===
      placementQ.correctLetter?.toUpperCase();

    const nextScore = calculateNewScore(
      score,
      placementQ.problemScore ?? score,
      correct,
      streak
    );

    const nextStreak = correct ? streak + 1 : 0;

    setScore(nextScore);
    setStreak(nextStreak);

    recordResult(
      placementQ.question,
      placementQ.topicTag || "General Mathematics",
      "diagnostic",
      correct,
      nextScore
    );

    const updatedAsked = [
      ...askedPlacement,
      placementQ.question,
    ];

    setAskedPlacement(updatedAsked);

    const nextNumber = placementNum + 1;
    setPlacementNum(nextNumber);

    if (nextNumber >= TOTAL_PLACEMENT) {
      setActiveTab("scrolling");
      setFeed([]);
      setSelectedChoices({});
      setAnsweredIds([]);
      setResults({});

      void fetchScrollingProblem(nextScore, "mcq", updatedAsked);
    } else {
      void fetchDiagnosticQuestion(nextScore, updatedAsked);
    }
  };

  // -------------------------------
  // START PRACTICE
  // -------------------------------

  const openPractice = () => {
    setActiveTab("scrolling");

    if (feed.length === 0 && !loadingFeed) {
      void fetchScrollingProblem(score, "mcq");
    }
  };

  // -------------------------------
  // MCQ PRACTICE SUBMISSION
  // -------------------------------

  const handleScrollingMCQSubmit = async (item: FeedItem) => {
    const selected = selectedChoices[item.id];

    if (
      !selected ||
      !item.correctLetter ||
      submitting ||
      answeredIds.includes(item.id)
    ) {
      return;
    }

    setSubmitting(true);

    const correct =
      selected.toUpperCase() ===
      item.correctLetter.toUpperCase();

    const nextScore = Math.max(
      0,
      Math.min(1000, score + (correct ? 1 : -1))
    );

    const nextStreak = correct ? streak + 1 : 0;

    setScore(nextScore);
    setStreak(nextStreak);

    setAnsweredIds((previous) => [...previous, item.id]);

    setResults((previous) => ({
      ...previous,
      [item.id]: correct,
    }));

    recordResult(
      item.question,
      item.topicTag || "General Mathematics",
      "mcq",
      correct,
      nextScore
    );

    setSubmitting(false);

    await fetchScrollingProblem(
      nextScore,
      "frq",
      feed.map((question) => question.question)
    );
  };

  // -------------------------------
  // FRQ PRACTICE SUBMISSION
  // -------------------------------

  const handleFRQSubmit = async (
    item: FeedItem,
    work: string
  ) => {
    if (submitting || answeredIds.includes(item.id)) return;

    setSubmitting(true);

    if (work === "__GIVE_UP__") {
      const nextScore = Math.max(0, score - 1);

      setScore(nextScore);
      setStreak(0);

      setAnsweredIds((previous) => [...previous, item.id]);

      setResults((previous) => ({
        ...previous,
        [item.id]: false,
      }));

      recordResult(
        item.question,
        item.topicTag || "General Mathematics",
        "frq",
        false,
        nextScore
      );

      setSubmitting(false);

      await fetchScrollingProblem(
        nextScore,
        "mcq",
        feed.map((question) => question.question)
      );

      return;
    }

    try {
      const response = await fetch("/api/check-frq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: item.question,
          work,
        }),
      });

      const data = await readApiResponse(response);

      const correct = Boolean(
        data.correct ?? data.isCorrect
      );

      const nextScore = Math.max(
        0,
        Math.min(1000, score + (correct ? 1 : -1))
      );

      const nextStreak = correct ? streak + 1 : 0;

      setScore(nextScore);
      setStreak(nextStreak);

      setAnsweredIds((previous) => [...previous, item.id]);

      setResults((previous) => ({
        ...previous,
        [item.id]: correct,
      }));

      recordResult(
        item.question,
        item.topicTag || "General Mathematics",
        "frq",
        correct,
        nextScore
      );

      setFeedError("");

      await fetchScrollingProblem(
        nextScore,
        "mcq",
        feed.map((question) => question.question)
      );
    } catch (error) {
      console.error("FRQ submission failed:", error);

      setFeedError(
        error instanceof Error
          ? error.message
          : "Could not submit your answer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------
  // RETRY GENERATION
  // -------------------------------

  const retryDiagnostic = () => {
    void fetchDiagnosticQuestion(score, askedPlacement);
  };

  const retryFeed = () => {
    const last = feed[feed.length - 1];

    const nextType: "mcq" | "frq" =
      !last || last.type === "frq" ? "mcq" : "frq";

    void fetchScrollingProblem(
      score,
      nextType,
      feed.map((item) => item.question)
    );
  };

  // -------------------------------
  // STATISTICS
  // -------------------------------

  const totalAnswered = stats.answers.length;

  const correctAnswers = stats.answers.filter(
    (answer) => answer.correct
  ).length;

  const accuracy =
    totalAnswered > 0
      ? Math.round((correctAnswers / totalAnswered) * 100)
      : 0;

  const mcqAnswers = stats.answers.filter(
    (answer) => answer.type === "mcq"
  );

  const frqAnswers = stats.answers.filter(
    (answer) => answer.type === "frq"
  );

  const diagnosticAnswers = stats.answers.filter(
    (answer) => answer.type === "diagnostic"
  );

  const topicStats = useMemo(() => {
    const groups: Record<
      string,
      { total: number; correct: number }
    > = {};

    stats.answers.forEach((answer) => {
      const topic = answer.topic || "Other";

      if (!groups[topic]) {
        groups[topic] = {
          total: 0,
          correct: 0,
        };
      }

      groups[topic].total++;

      if (answer.correct) {
        groups[topic].correct++;
      }
    });

    return Object.entries(groups)
      .map(([topic, data]) => ({
        topic,
        total: data.total,
        accuracy: Math.round(
          (data.correct / data.total) * 100
        ),
      }))
      .sort((a, b) => b.total - a.total);
  }, [stats.answers]);

  const strongestTopic = [...topicStats]
    .filter((topic) => topic.total >= 2)
    .sort((a, b) => b.accuracy - a.accuracy)[0];

  const weakestTopic = [...topicStats]
    .filter((topic) => topic.total >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)[0];

  const scoreHistory = stats.scoreHistory;

  const graphMin =
    scoreHistory.length > 0
      ? Math.min(...scoreHistory.map((point) => point.score))
      : 0;

  const graphMax =
    scoreHistory.length > 0
      ? Math.max(...scoreHistory.map((point) => point.score))
      : 100;

  // -------------------------------
  // PAGE
  // -------------------------------

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#101012] p-6 md:flex">
          <h1 className="mb-10 text-xl font-bold tracking-tight">
            Math<span className="text-blue-400">Lab</span>
          </h1>

          <nav className="space-y-3">
            <button
              onClick={() => setActiveTab("diagnostic")}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm ${
                activeTab === "diagnostic"
                  ? "bg-blue-500/15 text-blue-300"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              Diagnostic
            </button>

            <button
              onClick={openPractice}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm ${
                activeTab === "scrolling"
                  ? "bg-blue-500/15 text-blue-300"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              Practice Feed
            </button>

            <button
              onClick={() => setActiveTab("statistics")}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm ${
                activeTab === "statistics"
                  ? "bg-blue-500/15 text-blue-300"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              Statistics
            </button>
          </nav>

          <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-gray-500">CURRENT LEVEL</p>
            <p className="mt-2 text-sm font-semibold">
              {level.tierName}
            </p>

            <p className="mt-4 text-xs text-gray-500">YOUR SCORE</p>
            <p className="mt-1 text-2xl font-bold text-blue-400">
              {score}
            </p>

            <p className="mt-3 text-xs text-gray-500">
              Current streak: {streak}
            </p>
          </div>
        </aside>

        {/* MAIN */}

        <main className="min-w-0 flex-1 px-5 py-8 md:px-12">

          {/* MOBILE NAVIGATION */}

          <div className="mb-8 flex flex-wrap gap-2 md:hidden">
            {(
              ["diagnostic", "scrolling", "statistics"] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "scrolling") {
                    openPractice();
                  } else {
                    setActiveTab(tab);
                  }
                }}
                className={`rounded-lg px-4 py-2 text-sm capitalize ${
                  activeTab === tab
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-gray-300"
                }`}
              >
                {tab === "scrolling" ? "Practice" : tab}
              </button>
            ))}
          </div>

          {/* DIAGNOSTIC */}

          {activeTab === "diagnostic" && (
            <section className="mx-auto max-w-3xl">
              <div className="mb-8">
                <p className="text-sm font-medium text-blue-400">
                  PERSONALIZED ASSESSMENT
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Find your math level
                </h2>

                <p className="mt-3 text-sm text-gray-400">
                  Answer {TOTAL_PLACEMENT} questions to establish
                  your starting level. Questions adapt based on
                  your performance.
                </p>
              </div>

              <div className="mb-6 flex justify-between">
                <span className="text-sm text-gray-400">
                  Question {Math.min(
                    placementNum + 1,
                    TOTAL_PLACEMENT
                  )} of {TOTAL_PLACEMENT}
                </span>

                <span className="text-sm text-gray-400">
                  Score: {score}
                </span>
              </div>

              <div className="mb-8 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${
                      (placementNum / TOTAL_PLACEMENT) * 100
                    }%`,
                  }}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#121215] p-6 md:p-9">
                {diagnosticLoading ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />

                    <p className="text-gray-400">
                      Generating your next question...
                    </p>
                  </div>
                ) : diagnosticError ? (
                  <div className="py-12 text-center">
                    <p className="text-lg font-semibold text-red-400">
                      Unable to load question
                    </p>

                    <p className="mt-2 break-words text-sm text-gray-400">
                      {diagnosticError}
                    </p>

                    <button
                      onClick={retryDiagnostic}
                      className="mt-6 rounded-xl bg-blue-500 px-6 py-3 font-medium"
                    >
                      Try again
                    </button>
                  </div>
                ) : !placementQ ? (
                  <div className="py-12 text-center text-gray-400">
                    No question available.

                    <button
                      onClick={retryDiagnostic}
                      className="ml-2 text-blue-400 underline"
                    >
                      Generate one
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                        {placementQ.topicTag || "Mathematics"}
                      </span>

                      <span className="text-xs text-gray-500">
                        Adaptive question
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold leading-relaxed md:text-2xl">
                      {placementQ.question}
                    </h3>

                    <div className="mt-8 space-y-3">
                      {placementQ.choices?.map((choice, index) => {
                        const letter = String.fromCharCode(65 + index);

                        const selected = placementSelected === letter;

                        return (
                          <button
                            key={`${letter}-${choice}`}
                            onClick={() => setPlacementSelected(letter)}
                            className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left ${
                              selected
                                ? "border-blue-400 bg-blue-500/10"
                                : "border-white/10 bg-white/[0.02] hover:border-white/30"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                                selected
                                  ? "bg-blue-500 text-white"
                                  : "bg-white/10 text-gray-300"
                              }`}
                            >
                              {letter}
                            </span>

                            <span className="text-sm text-gray-200">
                              {choice}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleDiagnosticSubmit}
                      disabled={!placementSelected}
                      className="mt-8 w-full rounded-xl bg-blue-500 px-6 py-4 font-semibold hover:bg-blue-600 disabled:opacity-40"
                    >
                      {placementNum + 1 >= TOTAL_PLACEMENT
                        ? "Finish diagnostic"
                        : "Submit answer"}
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          {/* PRACTICE FEED */}

          {activeTab === "scrolling" && (
            <section className="mx-auto max-w-3xl">
              <div className="mb-8">
                <p className="text-sm font-medium text-blue-400">
                  ADAPTIVE PRACTICE
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Your practice feed
                </h2>

                <p className="mt-3 text-sm text-gray-400">
                  Correct answers earn one point. Incorrect answers
                  subtract one point.
                </p>
              </div>

              <div className="mb-8 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-[#121215] p-4">
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="mt-1 text-xl font-bold text-blue-400">
                    {score}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#121215] p-4">
                  <p className="text-xs text-gray-500">Streak</p>
                  <p className="mt-1 text-xl font-bold">{streak}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#121215] p-4">
                  <p className="text-xs text-gray-500">Accuracy</p>
                  <p className="mt-1 text-xl font-bold">{accuracy}%</p>
                </div>
              </div>

              {feed.map((item) => (
                <article
                  key={item.id}
                  className="mb-6 rounded-2xl border border-white/10 bg-[#121215] p-6 md:p-8"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                      {item.topicTag || "Mathematics"}
                    </span>

                    <span className="text-xs uppercase tracking-wider text-gray-500">
                      {item.type}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold leading-relaxed">
                    {item.question}
                  </h3>

                  {item.type === "mcq" && item.choices && (
                    <>
                      <div className="mt-6 space-y-3">
                        {item.choices.map((choice, index) => {
                          const letter = String.fromCharCode(65 + index);

                          const selected =
                            selectedChoices[item.id] === letter;

                          return (
                            <button
                              key={`${item.id}-${letter}`}
                              disabled={answeredIds.includes(item.id)}
                              onClick={() =>
                                setSelectedChoices((previous) => ({
                                  ...previous,
                                  [item.id]: letter,
                                }))
                              }
                              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                                selected
                                  ? "border-blue-400 bg-blue-500/10"
                                  : "border-white/10 hover:border-white/30"
                              } disabled:opacity-60`}
                            >
                              <span className="font-semibold text-blue-300">
                                {letter}
                              </span>

                              <span className="text-sm text-gray-200">
                                {choice}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {!answeredIds.includes(item.id) ? (
                        <button
                          onClick={() => void handleScrollingMCQSubmit(item)}
                          disabled={
                            !selectedChoices[item.id] || submitting
                          }
                          className="mt-6 rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold hover:bg-blue-600 disabled:opacity-40"
                        >
                          Submit answer
                        </button>
                      ) : (
                        <div
                          className={`mt-5 rounded-xl p-4 text-sm ${
                            results[item.id]
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          {results[item.id]
                            ? "Correct! +1 point"
                            : `Incorrect. -1 point. Correct answer: ${item.correctLetter}`}
                        </div>
                      )}
                    </>
                  )}

                  {item.type === "frq" && (
                    <div className="mt-6">
                      {!answeredIds.includes(item.id) ? (
                        <FRQ
                          question={item.question}
                          isLast={false}
                          disabled={submitting}
                          onSubmit={(work) => {
                            void handleFRQSubmit(item, work);
                          }}
                        />
                      ) : (
                        <div
                          className={`rounded-xl p-4 text-sm ${
                            results[item.id]
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          {results[item.id]
                            ? "FRQ recorded as correct! +1 point"
                            : "FRQ recorded as incorrect. -1 point"}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}

              {feedError && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                  <p className="break-words text-sm text-red-400">
                    {feedError}
                  </p>

                  <button
                    onClick={retryFeed}
                    className="mt-3 text-sm font-medium text-blue-400 underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {loadingFeed && (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />

                  <p className="text-sm text-gray-400">
                    Generating your next question...
                  </p>
                </div>
              )}

              {!loadingFeed && feed.length === 0 && !feedError && (
                <div className="rounded-xl border border-white/10 p-8 text-center">
                  <p className="text-gray-400">
                    Your practice feed is empty.
                  </p>

                  <button
                    onClick={() => void fetchScrollingProblem(score, "mcq")}
                    className="mt-4 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold"
                  >
                    Start practicing
                  </button>
                </div>
              )}
            </section>
          )}

          {/* STATISTICS DASHBOARD */}

          {activeTab === "statistics" && (
            <section className="mx-auto max-w-5xl">
              <div className="mb-8">
                <p className="text-sm font-medium text-blue-400">
                  PERFORMANCE ANALYTICS
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Statistics
                </h2>

                <p className="mt-3 text-sm text-gray-400">
                  Track your progress and identify areas to improve.
                </p>
              </div>

              {/* TOP STATS */}

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "Current Score", value: score.toString() },
                  { label: "Questions Answered", value: totalAnswered.toString() },
                  { label: "Accuracy", value: `${accuracy}%` },
                  { label: "Current Streak", value: streak.toString() },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-[#121215] p-5"
                  >
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-bold text-blue-400">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* LEVEL */}

              <div className="mt-6 rounded-xl border border-white/10 bg-[#121215] p-6">
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  CURRENT MATHEMATICS LEVEL
                </p>

                <h3 className="mt-3 text-2xl font-bold">
                  {level.tierName}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {level.topicFocus}
                </p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${(score / 1000) * 100}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>1000</span>
                </div>
              </div>

              {/* SCORE GRAPH */}

              <div className="mt-6 rounded-xl border border-white/10 bg-[#121215] p-6">
                <h3 className="text-lg font-semibold">
                  Score Progression
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Your score after each recorded answer.
                </p>

                {scoreHistory.length === 0 ? (
                  <p className="py-12 text-center text-sm text-gray-500">
                    Answer some questions to generate your graph.
                  </p>
                ) : (
                  <div className="mt-8 flex h-48 items-end gap-2 overflow-x-auto pb-2">
                    {scoreHistory.map((point, index) => {
                      const range = Math.max(1, graphMax - graphMin);

                      const height = Math.max(
                        8,
                        ((point.score - graphMin) / range) * 75 + 20
                      );

                      return (
                        <div
                          key={`${point.date}-${index}`}
                          className="group flex h-full min-w-3 flex-1 flex-col items-center justify-end"
                          title={`Score: ${point.score}`}
                        >
                          <div
                            className="w-full max-w-8 rounded-t-md bg-blue-500/80 transition hover:bg-blue-400"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {scoreHistory.length > 0 && (
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Oldest</span>
                    <span>Latest</span>
                  </div>
                )}
              </div>

              {/* PERFORMANCE BY TYPE */}

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  { label: "Diagnostic", answers: diagnosticAnswers },
                  { label: "Multiple Choice", answers: mcqAnswers },
                  { label: "Free Response", answers: frqAnswers },
                ].map((group) => {
                  const total = group.answers.length;

                  const correct = group.answers.filter(
                    (answer) => answer.correct
                  ).length;

                  const percent =
                    total > 0
                      ? Math.round((correct / total) * 100)
                      : 0;

                  return (
                    <div
                      key={group.label}
                      className="rounded-xl border border-white/10 bg-[#121215] p-5"
                    >
                      <p className="text-sm text-gray-400">
                        {group.label}
                      </p>

                      <p className="mt-3 text-2xl font-bold">
                        {percent}%
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {correct} correct out of {total}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* TOPIC PERFORMANCE */}

              <div className="mt-6 rounded-xl border border-white/10 bg-[#121215] p-6">
                <h3 className="text-lg font-semibold">
                  Topic Performance
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Accuracy grouped by generated topic tags.
                </p>

                {topicStats.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-500">
                    Topic statistics will appear after you answer questions.
                  </p>
                ) : (
                  <div className="mt-6 space-y-5">
                    {topicStats.map((topic) => (
                      <div key={topic.topic}>
                        <div className="mb-2 flex justify-between gap-4">
                          <span className="text-sm text-gray-300">
                            {topic.topic}
                          </span>

                          <span className="shrink-0 text-sm text-gray-400">
                            {topic.accuracy}% ({topic.total})
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${topic.accuracy}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* STRENGTHS AND WEAKNESSES */}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#121215] p-6">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Strongest Topic
                  </p>

                  <h3 className="mt-3 text-lg font-semibold text-emerald-400">
                    {strongestTopic?.topic || "Not enough data"}
                  </h3>

                  <p className="mt-2 text-sm text-gray-400">
                    {strongestTopic
                      ? `${strongestTopic.accuracy}% accuracy`
                      : "Answer at least two questions in a topic."}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#121215] p-6">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Topic to Improve
                  </p>

                  <h3 className="mt-3 text-lg font-semibold text-orange-400">
                    {weakestTopic?.topic || "Not enough data"}
                  </h3>

                  <p className="mt-2 text-sm text-gray-400">
                    {weakestTopic
                      ? `${weakestTopic.accuracy}% accuracy`
                      : "Answer at least two questions in a topic."}
                  </p>
                </div>
              </div>

              {/* RECENT HISTORY */}

              <div className="mt-6 rounded-xl border border-white/10 bg-[#121215] p-6">
                <h3 className="text-lg font-semibold">
                  Recent Question History
                </h3>

                {stats.answers.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-500">
                    No recorded answers yet.
                  </p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {[...stats.answers]
                      .reverse()
                      .slice(0, 10)
                      .map((answer) => (
                        <div
                          key={answer.id}
                          className="flex items-center justify-between gap-4 border-b border-white/5 pb-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-gray-200">
                              {answer.question}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {answer.topic} · {answer.type}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p
                              className={`text-sm font-semibold ${
                                answer.correct
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {answer.correct ? "Correct" : "Incorrect"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Score: {answer.score}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
