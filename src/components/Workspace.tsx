"use client";

import { motion } from "motion/react";
import { Ruler, Check, ArrowCounterClockwise, CheckCircle } from "@phosphor-icons/react";
import ResultsWorkspace from "./ResultsWorkspace";
import type { TailoredResume } from "@/lib/types";
const FEATURES = ["Honest gap analysis", "ATS match score", ".docx single-page export"];

const LOADING_STEPS = [
  { delay: 0.3, text: "Extracting skills and experience structure" },
  { delay: 0.9, text: "Analyzing job description requirements" },
  { delay: 1.5, text: "Calculating true keyword alignment & score" },
  { delay: 2.1, text: "Formatting ATS-optimized single-page rewrite", active: true },
];

interface WorkspaceProps {
  result: TailoredResume | null;
  loading: boolean;
  downloading: boolean;
  onDownload: () => void;
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className="paper-card rounded-2xl relative overflow-hidden h-full min-h-[460px] lg:min-h-[640px] flex flex-col items-center justify-center text-center p-8 sm:p-12 shadow-xs"
    >
      <div className="max-w-md mx-auto flex flex-col items-center">
        {/* Minimalist document preview illustration */}
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] mb-5 shadow-xs">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--ink)]">
          Ready to optimize your resume
        </h3>
        <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
          Provide your current resume and the target job description to run an ATS integrity check, identify missing requirements, and generate a tailored rewrite.
        </p>

        {/* Feature badges */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {FEATURES.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)] px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--surface-2)]/60"
            >
              <Check size={12} weight="bold" className="text-[var(--green)]" />
              {f}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="paper-card rounded-2xl relative overflow-hidden h-full min-h-[460px] lg:min-h-[640px] flex flex-col items-center justify-center text-center p-8 sm:p-12 shadow-xs">
      <div className="max-w-sm mx-auto flex flex-col items-center w-full">
        <div className="w-12 h-12 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink)] mb-6 shadow-xs">
          <ArrowCounterClockwise size={22} weight="bold" className="animate-spin text-[var(--ink)]" />
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--ink)] mb-1">
          Tailoring in Progress
        </h3>
        <p className="text-xs text-[var(--muted)] mb-6">
          Analyzing resume against job requirements
        </p>

        <div className="w-full space-y-2.5 text-left font-mono text-xs text-[var(--muted)] border-l border-[var(--line)] pl-4 py-1">
          {LOADING_STEPS.map((s) => (
            <motion.p
              key={s.text}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: s.delay }}
              className="flex items-center gap-2.5"
            >
              {s.active ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--ink)] border-t-transparent animate-spin flex-shrink-0" />
              ) : (
                <CheckCircle size={15} weight="fill" className="text-[var(--green)] flex-shrink-0" />
              )}
              <span className="text-[var(--ink)]">{s.text}</span>
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Workspace({ result, loading, downloading, onDownload }: WorkspaceProps) {
  return (
    <div className="flex flex-col gap-6 lg:min-h-[600px]">
      {!result && !loading && <EmptyState />}
      {loading && !result && <LoadingState />}
      {result && <ResultsWorkspace result={result} downloading={downloading} onDownload={onDownload} />}
    </div>
  );
}
