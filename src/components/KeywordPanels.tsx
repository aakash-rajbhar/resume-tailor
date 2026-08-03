"use client";

import { motion } from "motion/react";
import { Check, Warning, CheckCircle } from "@phosphor-icons/react";

interface KeywordPanelsProps {
  matched: string[];
  missing: string[];
}

export default function KeywordPanels({ matched, missing }: KeywordPanelsProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {/* MATCHED */}
      <div className="paper-card rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--green)]" />
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-3">
          <p className="overline text-[var(--green)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            Matched ({matched.length})
          </p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--green-soft)] text-[var(--green)] border border-[var(--green)]/25">
            In Resume
          </span>
        </div>

        {matched.length > 0 ? (
          <ul className="text-sm space-y-2 max-h-60 overflow-y-auto thin-scrollbar pr-1">
            {matched.map((k) => (
              <motion.li
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                key={k}
                className="font-mono text-[13px] flex items-start gap-2 py-0.5 border-b border-dashed border-[var(--line)]/70"
              >
                <Check size={15} weight="bold" className="text-[var(--green)] flex-shrink-0 mt-0.5" />
                <span>{k}</span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted)] py-4 italic text-center">No matches found yet.</p>
        )}
      </div>

      {/* GAPS */}
      <div className="paper-card rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--amber)]" />
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-3">
          <p className="overline text-[var(--amber)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
            Gaps ({missing.length})
          </p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--amber-soft)] text-[var(--amber)] border border-[var(--amber)]/25">
            Missing
          </span>
        </div>

        {missing.length > 0 ? (
          <ul className="text-sm space-y-2 max-h-60 overflow-y-auto thin-scrollbar pr-1">
            {missing.map((k) => (
              <motion.li
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                key={k}
                className="font-mono text-[13px] flex items-start gap-2 py-0.5 border-b border-dashed border-[var(--line)]/70"
              >
                <Warning size={15} weight="fill" className="text-[var(--amber)] flex-shrink-0 mt-0.5" />
                <span>{k}</span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-[var(--green)] font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle size={17} weight="fill" /> 100% Core Skill Match!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
