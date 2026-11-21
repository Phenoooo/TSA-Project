
"use client";

import React, { useState } from "react";

interface FRQProps {
  question: string;
  isLast: boolean;
  disabled: boolean;
  onSubmit: (work: string) => void;
}

export default function FRQ({
  question,
  isLast,
  disabled,
  onSubmit,
}: FRQProps) {
  const [work, setWork] = useState("");
  const [validating, setValidating] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const handleCheckWork = async () => {
    if (!work.trim() || validating || disabled) return;

    setValidating(true);
    setHint(null);

    try {
      const res = await fetch("/api/check-frq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          work,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not check work.");
      }

      setHint(
        data.feedback ||
          "Work checked. Submit when you're ready."
      );
    } catch (err) {
      console.error(err);
      setHint("Unable to check your work right now. You can still submit it.");
    } finally {
      setValidating(false);
    }
  };

  const handleGiveUp = () => {
    if (disabled || validating) return;

    onSubmit("__GIVE_UP__");
  };

  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault();

    if (!work.trim() || disabled || validating) return;

    onSubmit(work);
  };

  return (
    <form
      onSubmit={handleSubmitWork}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start"
    >
      {/* LEFT: QUESTION */}
      <div className="space-y-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Free Response
        </div>

        <p className="text-lg md:text-xl text-neutral-100 leading-relaxed font-medium">
          {question}
        </p>

        <p className="text-xs text-neutral-500 leading-relaxed">
          Show your reasoning and mathematical steps.
        </p>
      </div>

      {/* RIGHT: WORK AREA */}
      <div className="space-y-4">

        <textarea
          value={work}
          onChange={(e) => setWork(e.target.value)}
          placeholder="Write your solution and calculations..."
          rows={6}
          disabled={disabled}
          className="w-full min-h-36 rounded-lg border border-neutral-800/70 bg-transparent p-4 text-sm text-neutral-200 placeholder-neutral-600 focus:border-emerald-500/60 focus:outline-none transition-all resize-y leading-relaxed"
        />

        {/* FEEDBACK */}
        {hint && (
          <div className="border-l-2 border-emerald-500/50 pl-3 py-2 text-xs text-neutral-400 leading-relaxed">
            {hint}
          </div>
        )}

        {/* RIGHT-ALIGNED CONTROLS */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">

          <button
            type="button"
            disabled={disabled || validating}
            onClick={handleGiveUp}
            className="px-3 py-2.5 text-xs text-neutral-500 hover:text-rose-400 transition-colors disabled:opacity-30"
          >
            Give Up
          </button>

          <button
            type="button"
            disabled={!work.trim() || validating || disabled}
            onClick={handleCheckWork}
            className="px-4 py-2.5 rounded-lg border border-neutral-800 text-neutral-300 text-xs hover:bg-neutral-900 disabled:opacity-30 transition-all"
          >
            {validating ? "Checking..." : "Check Work"}
          </button>

          <button
            type="submit"
            disabled={!work.trim() || validating || disabled}
            className="px-5 py-2.5 rounded-lg bg-neutral-100 text-neutral-950 text-xs font-semibold hover:bg-white disabled:opacity-30 transition-all"
          >
            {isLast ? "Submit Answer" : "Submit Answer"}
          </button>

        </div>
      </div>
    </form>
  );
}
