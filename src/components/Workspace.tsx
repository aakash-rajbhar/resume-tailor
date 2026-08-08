"use client";

import { motion } from "motion/react";
import { Ruler, Check, ArrowCounterClockwise, CheckCircle } from "@phosphor-icons/react";
import CropMarks from "./CropMarks";
import ResultsWorkspace from "./ResultsWorkspace";
import type { TailoredResume } from "@/lib/types";

const FEATURES = ["Honest gap analysis", "Realistic match score", ".docx export"];

const LOADING_STEPS = [
  { delay: 0.4, text: "Parsing structure & contact info" },
  { delay: 1.1, text: "Running keyword intersection vs job description" },
  { delay: 1.9, text: "Aligning experience bullet points" },
  { delay: 2.7, text: "Preparing single-page layout", active: true },
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="paper-card rounded-2xl relative overflow-hidden h-full min-h-[480px] lg:min-h-[720px] flex flex-col items-center justify-center text-center px-8"
    >
      <div className="absolute inset-0 bg-dotgrid opacity-30 pointer-events-none" />
      <CropMarks />
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[var(--line)] flex items-center justify-center text-[var(--muted)] mb-6 rotate-3 bg-[var(--surface-2)]/40 mx-auto">
          <Ruler size={28} weight="duotone" />
        </div>
        <h3 className="font-display text-2xl tracking-tight">Match engine idle</h3>
        <p className="text-sm text-[var(--muted)] max-w-sm mx-auto mt-2 leading-relaxed">
          Feed in your resume and the target job description on the left, then fire the scanner for an
          honest gap report and a tailored rewrite.
        </p>
        <div className="mt-7 flex flex-wrap gap-2 justify-center">
          {FEATURES.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] px-2.5 py-1 rounded-full border border-[var(--line)] bg-[var(--surface)]"
            >
              <Check size={11} weight="bold" className="text-[var(--green)]" />
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
    <div className="paper-card rounded-2xl relative overflow-hidden h-full min-h-[480px] lg:min-h-[720px] flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="absolute inset-0 bg-dotgrid opacity-20 pointer-events-none" />
      <div className="scanline absolute inset-0 pointer-events-none" />
      <CropMarks />
      <div className="relative">
        <div className="relative mb-7 flex items-center justify-center">
          <div className="absolute -inset-5 rounded-full border border-[var(--green)]/30 animate-ping" />
          <div className="w-16 h-16 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink)] shadow-inner">
            <ArrowCounterClockwise size={26} weight="bold" className="animate-spin" />
          </div>
        </div>

        <h3 className="overline text-[var(--accent)] mb-6">Analyzing Resume Integrity</h3>

        <div className="max-w-sm space-y-2.5 text-left font-mono text-xs text-[var(--muted)] border-l border-[var(--line)] pl-4 py-1">
          {LOADING_STEPS.map((s) => (
            <motion.p
              key={s.text}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: s.delay }}
              className="flex items-center gap-2.5"
            >
              {s.active ? (
                <span className="w-3.5 h-3.5 rounded-full border border-dashed border-[var(--green)] animate-spin flex-shrink-0" />
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
