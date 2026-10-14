"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

interface Step3LoadingProps {
  providerName?: string;
}

const STAGES = [
  { id: 1, label: "Reading resume structure & credentials", duration: 1200 },
  {
    id: 2,
    label: "Analyzing job description & core requirements",
    duration: 2500,
  },
  {
    id: 3,
    label: "Evaluating keyword match and identifying gaps",
    duration: 3800,
  },
  {
    id: 4,
    label: "Synthesizing ATS-aligned single-page rewrite",
    duration: 5200,
  },
];

export default function Step3Loading({
  providerName = "AI Engine",
}: Step3LoadingProps) {
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [currentStageId, setCurrentStageId] = useState(1);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    STAGES.forEach((stage) => {
      const timer = setTimeout(() => {
        setCompletedStages((prev) => [...prev, stage.id]);
        if (stage.id < 4) {
          setCurrentStageId(stage.id + 1);
        }
      }, stage.duration);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="paper-card p-8 sm:p-12 space-y-10 w-full shadow-xs">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent/20 text-xs font-semibold text-accent">
          <Sparkles size={14} className="animate-spin" />
          <span>Tailoring in progress</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
          Analyzing and optimizing your resume
        </h2>
        <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
          {providerName} is cross-referencing your experience with the job
          posting to generate an honest ATS gap analysis.
        </p>
      </div>

      {/* Progress Stages */}
      <div className="max-w-md mx-auto space-y-3.5">
        {STAGES.map((s) => {
          const isDone = completedStages.includes(s.id);
          const isCurrent = currentStageId === s.id && !isDone;

          return (
            <div
              key={s.id}
              className={`p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                isDone
                  ? "border-green-border bg-green-soft/20 text-ink"
                  : isCurrent
                    ? "border-line-strong bg-surface-2/80 text-ink"
                    : "border-line bg-surface-2/30 text-muted opacity-60"
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isDone ? (
                  <CheckCircle2 size={18} className="text-green" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-line-strong bg-surface" />
                )}
              </div>
              <span className="text-xs font-medium leading-tight">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Skeleton preview of result layout */}
      <div className="pt-6 border-t border-line space-y-4">
        <p className="text-center font-mono text-[11px] text-muted uppercase tracking-wider">
          Preparing workspace layout
        </p>
        <div className="grid sm:grid-cols-12 gap-4">
          {/* Left panel skeleton */}
          <div className="sm:col-span-5 p-4 rounded-xl border border-line bg-surface-2/40 space-y-3 animate-shimmer">
            <div className="h-4 w-24 bg-line rounded" />
            <div className="h-16 w-full bg-line/60 rounded-lg" />
            <div className="space-y-1.5 pt-2">
              <div className="h-3 w-full bg-line/50 rounded" />
              <div className="h-3 w-4/5 bg-line/50 rounded" />
              <div className="h-3 w-3/5 bg-line/50 rounded" />
            </div>
          </div>

          {/* Right panel skeleton */}
          <div className="sm:col-span-7 p-4 rounded-xl border border-line bg-surface space-y-3 animate-shimmer">
            <div className="h-6 w-1/3 bg-line rounded" />
            <div className="h-3 w-1/2 bg-line/60 rounded" />
            <div className="h-1 w-full bg-line/40 rounded mt-2" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-line/40 rounded" />
              <div className="h-3 w-full bg-line/40 rounded" />
              <div className="h-3 w-2/3 bg-line/40 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
