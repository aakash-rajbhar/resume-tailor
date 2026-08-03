"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileDoc, ArrowCounterClockwise, Lightbulb, CaretRight } from "@phosphor-icons/react";
import ScoreGauge from "./ScoreGauge";
import KeywordPanels from "./KeywordPanels";
import DocumentPreview from "./DocumentPreview";
import type { TailoredResume } from "@/lib/types";

type WorkspaceTab = "analysis" | "document";

interface ResultsWorkspaceProps {
  result: TailoredResume;
  downloading: boolean;
  onDownload: () => void;
}

export default function ResultsWorkspace({ result, downloading, onDownload }: ResultsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("analysis");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Tabs + download */}
      <div className="flex items-center justify-between border-b border-[var(--line)] gap-3">
        <div className="flex gap-1">
          {(
            [
              { value: "analysis", label: "Analysis & Gaps", icon: CaretRight },
              { value: "document", label: "Document Canvas", icon: FileDoc },
            ] as { value: WorkspaceTab; label: string; icon: typeof CaretRight }[]
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setActiveTab(t.value)}
              className={`relative font-mono text-xs uppercase tracking-widest py-3 px-1 mr-4 transition-colors ${
                activeTab === t.value ? "font-bold text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {t.label}
              {activeTab === t.value && (
                <motion.span
                  layoutId="active-tab-line"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="font-mono text-xs px-3.5 py-1.5 rounded-lg border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5 transition-all hover:bg-[var(--accent)] hover:text-white active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
        >
          {downloading ? (
            <>
              <ArrowCounterClockwise size={14} weight="bold" className="animate-spin" />
              <span>Weaving…</span>
            </>
          ) : (
            <>
              <FileDoc size={14} weight="bold" />
              <span>Download .docx</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "analysis" ? (
          <motion.div
            key="analysis-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-[260px_1fr] gap-6 items-start"
          >
            <ScoreGauge before={result.atsScoreBefore} after={result.atsScoreAfter} />
            <KeywordPanels matched={result.matchedKeywords} missing={result.missingKeywords} />
          </motion.div>
        ) : (
          <motion.div
            key="document-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <DocumentPreview result={result} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes */}
      {result.notes?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border border-dashed border-[var(--amber)] p-5 rounded-xl flex gap-3 relative overflow-hidden bg-[var(--amber-soft)]/40"
        >
          <Lightbulb size={20} weight="fill" className="flex-shrink-0 text-[var(--amber)] mt-0.5" />
          <div>
            <p className="overline text-[var(--amber)] mb-2.5">ATS Strategic Advisory Notes</p>
            <ul className="text-sm space-y-2 leading-relaxed">
              {result.notes.map((n, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CaretRight size={14} weight="bold" className="text-[var(--amber)] flex-shrink-0 mt-0.5" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
