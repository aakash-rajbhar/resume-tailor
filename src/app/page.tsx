"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailoredResume | null>(null);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const updateSettings = (next: typeof settings) => writeSettings(next);

  const isDark = settings.theme === "dark" || (settings.theme === "system" && systemDark);

  const toggleTheme = () => updateSettings({ ...settings, theme: isDark ? "light" : "dark" });

  const hasKey = settings.provider === "gemini" ? !!settings.geminiKey : !!settings.groqKey;

  async function handleSubmit(payload: InputPayload) {
    setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
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
          <div className="pt-10 sm:pt-14 pb-8 max-w-2xl">
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
          </div>

          {/* Split grid */}
          <div className="grid lg:grid-cols-[minmax(360px,420px)_1fr] gap-8 items-start pb-16">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:sticky lg:top-24"
            >
              <InputPanel
                provider={settings.provider}
                loading={loading}
                error={error}
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
    </div>
  );
}
