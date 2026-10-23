"use client";

import { Settings } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ProviderChip from "./ProviderChip";
import AuthControls from "@/components/auth/AuthControls";
import { SessionProvider } from "next-auth/react";
import type { AIProvider } from "@/lib/ai";
import Link from "next/link";

interface HeaderBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  provider: AIProvider;
  hasKey: boolean;
  onOpenSettings: () => void;
  onHowItWorksClick?: () => void;
  /** Sign-in controls are only rendered when the Master Profile is enabled. */
  authEnabled?: boolean;
}

export default function HeaderBar({
  isDark,
  onToggleTheme,
  provider,
  hasKey,
  onOpenSettings,
  onHowItWorksClick,
  authEnabled = false,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center text-ink shadow-xs group-hover:border-muted transition-all">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-sans text-[15px] sm:text-base font-semibold tracking-tight text-ink">
              Resume<span className="text-muted font-normal">Tailor</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-muted bg-surface-2 border border-line">
              Studio
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {onHowItWorksClick && (
            <button
              type="button"
              onClick={onHowItWorksClick}
              className="hidden md:inline-block text-xs font-medium text-muted hover:text-ink transition-colors cursor-pointer mr-1"
            >
              How it works
            </button>
          )}
          <ProviderChip provider={provider} hasKey={hasKey} onClick={onOpenSettings} />
          {authEnabled && (
            <SessionProvider>
              <AuthControls />
            </SessionProvider>
          )}
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Open settings"
            className="w-8 h-8 rounded-lg border border-line bg-surface text-muted hover:text-ink hover:bg-surface-2 transition-all flex items-center justify-center shadow-xs cursor-pointer"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
