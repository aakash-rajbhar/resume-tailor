"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

interface GapAnalysisPanelProps {
  beforeScore: number;
  afterScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  notes?: string[];
}

export default function GapAnalysisPanel({
  beforeScore,
  afterScore,
  matchedKeywords,
  missingKeywords,
  notes = [],
}: GapAnalysisPanelProps) {
  const [openSections, setOpenSections] = useState({
    matched: true,
    missing: true,
    suggestions: true,
  });

  const delta = afterScore - beforeScore;

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* Match Score Card */}
      <div className="paper-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            ATS Match Score
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
              delta >= 0
                ? "bg-[var(--green-soft)] text-[var(--green)]"
                : "bg-[var(--danger-soft)] text-[var(--danger)]"
            }`}
          >
            <TrendingUp size={12} />
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
        </div>

        {/* Linear progress comparison */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-[var(--ink)]">
              {afterScore}%
            </span>
            <span className="text-xs text-[var(--muted)] font-mono">
              Original: <span className="text-[var(--ink)]">{beforeScore}%</span>
            </span>
          </div>

          {/* Bar comparison */}
          <div className="h-2.5 w-full bg-[var(--surface-2)] rounded-full overflow-hidden flex border border-[var(--line)]">
            <div
              style={{ width: `${Math.min(100, Math.max(0, afterScore))}%` }}
              className="bg-[var(--accent)] h-full rounded-full transition-all duration-700 ease-out"
            />
          </div>
        </div>

        <p className="text-xs text-[var(--muted)] leading-relaxed border-t border-[var(--line)] pt-3">
          {afterScore >= 80
            ? "Strong match. Your tailored resume directly reflects core job requirements."
            : afterScore >= 60
              ? "Good alignment. Review the missing skill recommendations below to close remaining gaps."
              : "Moderate match. Consider adding specific relevant project experience."}
        </p>
      </div>

      {/* Matched Keywords Card */}
      <div className="paper-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("matched")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--surface-2)]/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--green)]" />
            <span className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider">
              Matched Keywords ({matchedKeywords.length})
            </span>
          </div>
          {openSections.matched ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openSections.matched && (
          <div className="px-4 pb-4 pt-1 border-t border-[var(--line)]">
            <div className="flex flex-wrap gap-1.5 pt-2">
              {matchedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--green-soft)] text-[var(--green)] border border-[var(--green-border)] flex items-center gap-1.5"
                >
                  <CheckCircle2 size={12} />
                  <span>{kw}</span>
                </span>
              ))}
              {matchedKeywords.length === 0 && (
                <p className="text-xs text-[var(--muted)] italic py-1">No keywords matched.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Missing Keywords / Gaps Card */}
      <div className="paper-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("missing")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--surface-2)]/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--amber)]" />
            <span className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider">
              Missing Keywords ({missingKeywords.length})
            </span>
          </div>
          {openSections.missing ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openSections.missing && (
          <div className="px-4 pb-4 pt-1 border-t border-[var(--line)]">
            <div className="flex flex-wrap gap-1.5 pt-2">
              {missingKeywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--amber-soft)] text-[var(--amber)] border border-[var(--amber-border)] flex items-center gap-1.5"
                  title="Mentioned in job description but absent or weak in original resume"
                >
                  <AlertTriangle size={12} />
                  <span>{kw}</span>
                </span>
              ))}
              {missingKeywords.length === 0 && (
                <div className="py-2 text-xs text-[var(--green)] flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>100% of core skills matched!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Strategic Suggestions */}
      {notes.length > 0 && (
        <div className="paper-card overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection("suggestions")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--surface-2)]/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb size={14} className="text-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider">
                Strategic Suggestions ({notes.length})
              </span>
            </div>
            {openSections.suggestions ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {openSections.suggestions && (
            <div className="px-4 pb-4 pt-1 border-t border-[var(--line)] space-y-2">
              {notes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[var(--surface-2)]/60 border border-[var(--line)] text-xs text-[var(--ink)] leading-relaxed flex items-start gap-2"
                >
                  <span className="font-mono text-[11px] font-bold text-[var(--muted)] flex-shrink-0 mt-0.5">
                    {idx + 1}.
                  </span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
