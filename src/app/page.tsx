"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { Toaster, toast } from "sonner";
import HeaderBar from "@/components/HeaderBar";
import InputPanel, { type InputPayload } from "@/components/InputPanel";
import Workspace from "@/components/Workspace";
import SettingsPanel from "@/components/SettingsPanel";
import {
  subscribeSettings,
  getSettingsSnapshot,
  writeSettings,
  applyTheme,
  DEFAULT_SETTINGS,
} from "@/lib/settings";
import type { TailoredResume } from "@/lib/types";

function subscribeSystemTheme(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSystemThemeSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function Home() {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS
  );
  const systemDark = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    () => false
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<TailoredResume | null>(null);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const updateSettings = (next: typeof settings) => writeSettings(next);

  const isDark = settings.theme === "dark" || (settings.theme === "system" && systemDark);

  const toggleTheme = () => updateSettings({ ...settings, theme: isDark ? "light" : "dark" });

  const hasKey = settings.provider === "gemini" ? !!settings.geminiKey : !!settings.groqKey;

  // Parse and format quota/rate-limit errors for user-friendly display
  function formatErrorMessage(error: string): { title: string; description: string; action?: { label: string; onClick: () => void } } {
    // Check for Gemini quota exceeded error
    if (error.includes("quota") || error.includes("QUOTA_EXCEEDED") || error.includes("rate limit") || error.includes("RATE_LIMIT_EXCEEDED")) {
      const isGemini = error.includes("generativelanguage.googleapis.com") || error.includes("gemini") || error.includes("Gemini");

      if (isGemini) {
        return {
          title: "Gemini API quota exceeded",
          description: "You've hit the free tier limit for Gemini. Please wait a moment before trying again, or add a Groq API key in settings for higher limits.",
        };
      }
      // Generic quota error
      return {
        title: "API rate limit reached",
        description: "Too many requests. Please wait a bit before trying again.",
      };
    }

    // Check for missing/invalid API key
    if (error.includes("API key") || error.includes("API_KEY") || error.includes("authentication") || error.includes("unauthorized") || error.includes("401") || error.includes("403")) {
      return {
        title: "Invalid or missing API key",
        description: "Your API key appears to be invalid or missing. Please check your key in settings.",
        action: {
          label: "Open settings",
          onClick: () => setSettingsOpen(true),
        },
      };
    }

    // Check for network errors
    if (error.includes("network") || error.includes("fetch") || error.includes("Failed to fetch") || error.includes("ECONNREFUSED")) {
      return {
        title: "Network error",
        description: "Unable to connect to the AI service. Check your internet connection.",
      };
    }

    // Default fallback
    return {
      title: "Failed to analyze resume",
      description: error.length > 200 ? error.slice(0, 200) + "…" : error,
    };
  }

  async function handleSubmit(payload: InputPayload) {
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.set("jdText", payload.jdText);
      fd.set("provider", settings.provider);
      fd.set("geminiKey", settings.geminiKey);
      fd.set("groqKey", settings.groqKey);
      if (payload.resumeFile) {
        fd.set("resumeFile", payload.resumeFile);
      } else {
        fd.set("resumeText", payload.resumeText ?? "");
      }

      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data as TailoredResume);
      toast.success("Resume tailored successfully", {
        description: `Match score: ${data.atsScoreBefore}% → ${data.atsScoreAfter}% (${data.atsScoreAfter - data.atsScoreBefore >= 0 ? "+" : ""}${data.atsScoreAfter - data.atsScoreBefore} pts)`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      const formatted = formatErrorMessage(message);
      toast.error(formatted.title, {
        description: formatted.description,
        action: formatted.action
          ? {
              label: formatted.action.label,
              onClick: formatted.action.onClick,
            }
          : undefined,
        duration: formatted.action ? 10000 : 6000,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error("Could not generate the .docx file.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(result.name || "Resume").replace(/\s+/g, "_")}_Tailored.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Document exported", { description: ".docx file downloaded successfully" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed.";
      toast.error("Export failed", { description: message });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div id="top" className="min-h-[100dvh] flex flex-col antialiased">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-dotgrid opacity-[0.45]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_520px_at_72%_-12%,var(--accent)_0%,transparent_55%)] opacity-[0.07]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_-10%_110%,var(--green)_0%,transparent_50%)] opacity-[0.05]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <HeaderBar
          isDark={isDark}
          onToggleTheme={toggleTheme}
          provider={settings.provider}
          hasKey={hasKey}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 flex-1">
          {/* Hero */}
          {/*<div className="pt-10 sm:pt-14 pb-8 max-w-2xl">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="overline text-[var(--accent)]">Intelligent Tailoring Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
            </div>
            <h1 className="font-display text-4xl sm:text-6xl tracking-tight leading-[1.05]">
              Resume <em className="text-[var(--accent)] italic font-semibold">Tailor</em>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[var(--muted)] max-w-xl leading-relaxed">
              Paste a job description, feed in your resume, and get an honest ATS gap analysis plus a
              tailored single-page rewrite you can export as a{" "}
              <span className="font-mono text-[var(--ink)]">.docx</span>. No invented experience, ever.
            </p>
          </div>*/}

          {/* Split grid */}
          <div className="grid lg:grid-cols-[minmax(360px,420px)_1fr] gap-8 items-start py-4">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:sticky lg:top-24"
            >
              <InputPanel
                provider={settings.provider}
                loading={loading}
                onSubmit={handleSubmit}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Workspace
                result={result}
                loading={loading}
                downloading={downloading}
                onDownload={handleDownload}
              />
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--line)] py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:justify-between items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            <span>Resume Tailor · ATS Match Studio</span>
            <span>Keys stay in your browser · Data sent only to your AI provider</span>
          </div>
        </footer>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={updateSettings}
      />
      <Toaster
        position="top-center"
        theme="system"
        className="z-50"
        toastOptions={{
          duration: 4000,
        }}
      />
    </div>
  );
}