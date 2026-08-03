"use client";

import { GearSix } from "@phosphor-icons/react";
import ThemeToggle from "./ThemeToggle";
import ProviderChip from "./ProviderChip";
import type { AIProvider } from "@/lib/ai";

interface HeaderBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  provider: AIProvider;
  hasKey: boolean;
  onOpenSettings: () => void;
}

export default function HeaderBar({
  isDark,
  onToggleTheme,
  provider,
  hasKey,
  onOpenSettings,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-xl bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center font-display text-base font-semibold tracking-tight shadow-sm group-hover:scale-105 transition-transform">
            R<span className="text-[var(--accent)]">T</span>
          </span>
          <span className="leading-none">
            <span className="block font-display text-lg tracking-tight">Resume Tailor</span>
            <span className="block overline text-[var(--muted)] mt-1">ATS Match Studio</span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          <ProviderChip provider={provider} hasKey={hasKey} onClick={onOpenSettings} />
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="w-9 h-9 rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors flex items-center justify-center"
          >
            <GearSix size={16} weight="bold" />
          </button>
        </div>
      </div>
    </header>
  );
}
