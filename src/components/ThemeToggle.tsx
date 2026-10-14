"use client";

import { Sun, Moon } from "@phosphor-icons/react";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-8 h-8 rounded-lg border border-line bg-surface text-muted hover:text-ink hover:bg-surface-2 transition-all flex items-center justify-center shadow-xs"
    >
      {isDark ? <Sun size={15} weight="bold" /> : <Moon size={15} weight="bold" />}
    </button>
  );
}
