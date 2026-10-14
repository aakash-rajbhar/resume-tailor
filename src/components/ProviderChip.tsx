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

export default function ProviderChip({
  provider,
  hasKey,
  onClick,
}: ProviderChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg border border-line bg-surface font-mono text-[11px] uppercase tracking-wider font-semibold text-ink hover:border-accent transition-colors"
    >
      <span
        className={`w-2 h-2 rounded-full ${hasKey ? "bg-green animate-pulse" : "bg-amber"}`}
      />
      {LABELS[provider]}
      <span className="text-muted font-medium normal-case tracking-normal">
        {hasKey ? "· key set" : "· add key"}
      </span>
    </button>
  );
}
