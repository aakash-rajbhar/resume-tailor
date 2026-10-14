"use client";

import { useState } from "react";
import GapAnalysisPanel from "./GapAnalysisPanel";
import DocumentCanvas from "./DocumentCanvas";
import type { TailoredResume } from "@/lib/types";

interface ResultsWorkspaceNewProps {
  result: TailoredResume;
  originalText?: string;
  downloading: boolean;
  singlePage?: boolean;
  onToggleSinglePage?: (single: boolean) => void;
  onDownloadDocx: () => void;
  onStartOver: () => void;
  onUpdateResume?: (updated: TailoredResume) => void;
}

export default function ResultsWorkspaceNew({
  result,
  originalText,
  downloading,
  singlePage = true,
  onToggleSinglePage,
  onDownloadDocx,
  onStartOver,
  onUpdateResume,
}: ResultsWorkspaceNewProps) {
  // Mobile tab toggle: "analysis" vs "document"
  const [mobileTab, setMobileTab] = useState<"analysis" | "document">("document");

  return (
    <div className="space-y-6">
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
        <button
          type="button"
          onClick={() => setMobileTab("analysis")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mobileTab === "analysis"
              ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Gap Analysis ({result.atsScoreAfter}%)
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("document")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mobileTab === "document"
              ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Tailored Resume
        </button>
      </div>

      {/* Grid: 12-column layout (Left ~38% = col-span-5, Right ~62% = col-span-7) */}
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Left Pane: Gap Analysis */}
        <div
          className={`md:col-span-5 space-y-4 md:sticky md:top-20 ${
            mobileTab === "analysis" ? "block" : "hidden md:block"
          }`}
        >
          <GapAnalysisPanel
            beforeScore={result.atsScoreBefore}
            afterScore={result.atsScoreAfter}
            matchedKeywords={result.matchedKeywords}
            missingKeywords={result.missingKeywords}
            notes={result.notes}
          />
        </div>

        {/* Right Pane: Document Canvas */}
        <div
          className={`md:col-span-7 ${
            mobileTab === "document" ? "block" : "hidden md:block"
          }`}
        >
          <DocumentCanvas
            tailored={result}
            originalText={originalText}
            downloading={downloading}
            singlePage={singlePage}
            onToggleSinglePage={onToggleSinglePage}
            onDownloadDocx={onDownloadDocx}
            onStartOver={onStartOver}
            onUpdateResume={onUpdateResume}
          />
        </div>
      </div>
    </div>
  );
}
