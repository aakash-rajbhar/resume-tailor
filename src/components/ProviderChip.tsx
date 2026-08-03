"use client";

import type { AIProvider } from "@/lib/ai";

const LABELS: Record<AIProvider, string> = {
  gemini: "Gemini",
  groq: "Groq",
};

interface ProviderChipProps {
  provider: AIProvider;
  hasKey: boolean;
  onClick: () => void;
}

export default function ProviderChip({ provider, hasKey, onClick }: ProviderChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg border border-[var(--line)] bg-[var(--surface)] font-mono text-[11px] uppercase tracking-wider font-semibold text-[var(--ink)] hover:border-[var(--accent)] transition-colors"
    >
      <span className={`w-2 h-2 rounded-full ${hasKey ? "bg-[var(--green)] animate-pulse" : "bg-[var(--amber)]"}`} />
      {LABELS[provider]}
      <span className="text-[var(--muted)] font-medium normal-case tracking-normal">
        {hasKey ? "· key set" : "· add key"}
      </span>
    </button>
  );
}
