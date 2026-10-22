"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Cpu,
  BookOpen,
  ListChecks,
} from "lucide-react";
import Badge from "@/components/ui/Badge";

interface GapAnalysisPanelProps {
  beforeScore: number;
  afterScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  notes?: string[];
  addedKeywords?: string[];
  modelUsed?: string;
  fallbackUsed?: boolean;
  extractionModelUsed?: string;
  extractionFallback?: boolean;
  educationRequirement?: string | null;
  otherRequirements?: string[];
}

export default function GapAnalysisPanel({
  beforeScore,
  afterScore,
  matchedKeywords,
  missingKeywords,
  notes = [],
  addedKeywords = [],
  modelUsed,
  fallbackUsed = false,
  extractionModelUsed,
  extractionFallback = false,
  educationRequirement = null,
  otherRequirements = [],
}: GapAnalysisPanelProps) {
  const [openSections, setOpenSections] = useState({
    matched: true,
    missing: true,
    added: true,
    other: true,
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
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            ATS Match Score
          </span>
          <span
            className={`px-2 py-0.5 rounded-sm text-xs font-mono font-bold flex items-center gap-1 text-numeric ${
              delta >= 0
                ? "bg-green-soft text-green"
                : "bg-danger-soft text-danger"
            }`}
          >
            <TrendingUp size={12} aria-hidden />
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
        </div>

        {/* Linear progress comparison */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-ink text-numeric">
              {afterScore}%
            </span>
            <span className="text-xs text-muted font-mono text-numeric">
              Original: <span className="text-ink">{beforeScore}%</span>
            </span>
          </div>

          {/* Bar comparison */}
          <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden flex border border-line">
            <div
              style={{ width: `${Math.min(100, Math.max(0, afterScore))}%` }}
              className="bg-accent h-full rounded-full transition-all duration-700 ease-out"
            />
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed border-t border-line pt-3">
          {afterScore >= 80
            ? "Strong match. Your tailored resume directly reflects core job requirements."
            : afterScore >= 60
              ? "Good alignment. Review the missing skill recommendations below to close remaining gaps."
              : "Moderate match. Consider adding specific relevant project experience."}
        </p>

        {modelUsed && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
            <span className="flex items-center gap-1.5 min-w-0">
              <Cpu size={12} aria-hidden className="shrink-0" />
              <span className="truncate">
                Tailored with{" "}
                <span className="font-mono text-ink">{modelUsed}</span>
              </span>
            </span>
            {extractionModelUsed && (
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="truncate">
                  Extracted with{" "}
                  <span className="font-mono text-ink">{extractionModelUsed}</span>
                </span>
                {extractionFallback && (
                  <Badge variant="partial" size="sm" className="shrink-0">
                    fallback model
                  </Badge>
                )}
              </span>
            )}
            {fallbackUsed && (
              <Badge variant="partial" size="sm" className="shrink-0">
                fallback model
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Matched Keywords Card */}
      <div className="paper-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("matched")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-2/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              Matched Keywords ({matchedKeywords.length})
            </span>
          </div>
          {openSections.matched ? (
            <ChevronUp size={15} />
          ) : (
            <ChevronDown size={15} />
          )}
        </button>

        {openSections.matched && (
          <div className="px-4 pb-4 pt-1 border-t border-line">
            <div className="flex flex-wrap gap-1.5 pt-2">
              {matchedKeywords.map((kw, idx) => (
                <Badge
                  key={`${kw}-${idx}`}
                  variant="matched"
                  icon={<CheckCircle2 size={12} aria-hidden />}
                >
                  {kw}
                </Badge>
              ))}
              {matchedKeywords.length === 0 && (
                <p className="text-xs text-muted italic py-1">
                  No keywords matched.
                </p>
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
          className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-2/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              Missing Keywords ({missingKeywords.length})
            </span>
          </div>
          {openSections.missing ? (
            <ChevronUp size={15} />
          ) : (
            <ChevronDown size={15} />
          )}
        </button>

        {openSections.missing && (
          <div className="px-4 pb-4 pt-1 border-t border-line">
            <div className="flex flex-wrap gap-1.5 pt-2">
              {missingKeywords.map((kw, idx) => (
                <Badge
                  key={`${kw}-${idx}`}
                  variant="missing"
                  title="Mentioned in job description but absent or weak in original resume"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={12} aria-hidden />
                    <span>{kw}</span>
                  </span>
                </Badge>
              ))}
              {missingKeywords.length === 0 && (
                <div className="py-2 text-xs text-green flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>100% of core skills matched!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Added Keywords - needs candidate confirmation */}
      <div className="paper-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("added")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-2/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              Added Keywords ({addedKeywords.length})
            </span>
          </div>
          {openSections.added ? (
            <ChevronUp size={15} />
          ) : (
            <ChevronDown size={15} />
          )}
        </button>

        {openSections.added && (
          <div className="px-4 pb-4 pt-1 border-t border-line">
            {addedKeywords.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {addedKeywords.map((kw, idx) => (
                    <Badge
                      key={`${kw}-${idx}`}
                      variant="accent"
                      title="Appears in the tailored resume but was not in the original"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted leading-relaxed pt-3">
                  Confirm these are true. The tailored resume should only claim
                  what you can defend in an interview.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted italic py-2">
                No keywords were added by the tailoring step.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Other requirements - not scored */}
      {(educationRequirement || otherRequirements.length > 0) && (
        <div className="paper-card overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection("other")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-2/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue" />
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Other Requirements (
                {otherRequirements.length + (educationRequirement ? 1 : 0)})
              </span>
            </div>
            {openSections.other ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
          </button>

          {openSections.other && (
            <div className="px-4 pb-4 pt-1 border-t border-line space-y-2">
              {educationRequirement && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-surface-2/60 border border-line text-xs text-ink">
                  <BookOpen size={13} className="text-blue shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Education: </span>
                    {educationRequirement}
                  </span>
                </div>
              )}
              {otherRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-lg bg-surface-2/60 border border-line text-xs text-ink"
                >
                  <ListChecks size={13} className="text-blue shrink-0 mt-0.5" />
                  <span>{req}</span>
                </div>
              ))}
              <p className="text-xs text-muted leading-relaxed">
                These requirements are listed for context. They do not affect
                the match score.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Strategic Suggestions */}
      {notes.length > 0 && (
        <div className="paper-card overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection("suggestions")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-2/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb size={14} className="text-accent" />
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Strategic Suggestions ({notes.length})
              </span>
            </div>
            {openSections.suggestions ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
          </button>

          {openSections.suggestions && (
            <div className="px-4 pb-4 pt-1 border-t border-line space-y-2">
              {notes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-surface-2/60 border border-line text-xs text-ink leading-relaxed flex items-start gap-2"
                >
                  <span className="font-mono text-[11px] font-bold text-muted shrink-0 mt-0.5">
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
