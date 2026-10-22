"use client";

import { useEffect, useState, useSyncExternalStore, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Toaster, toast } from "sonner";
import HeaderBar from "@/components/HeaderBar";
import Stepper, { type FlowStep } from "@/components/ui/Stepper";
import Step1Resume from "@/components/workspace/Step1Resume";
import Step2Job from "@/components/workspace/Step2Job";
import Step3Loading from "@/components/workspace/Step3Loading";
import ErrorBoundary from "@/components/ErrorBoundary";

// Results view (gap analysis + document canvas) is only needed after an
// analysis completes, so keep it out of the initial bundle.
const ResultsWorkspaceNew = dynamic(
  () => import("@/components/results/ResultsWorkspaceNew"),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 rounded-lg border border-line bg-surface animate-pulse" role="status" aria-label="Loading results">
        <div className="h-5 w-40 rounded bg-surface-2 mb-4" />
        <div className="h-40 rounded bg-surface-2" />
      </div>
    ),
  },
);
import LandingHero from "@/components/landing/LandingHero";
import SettingsPanel from "@/components/SettingsPanel";
import {
  subscribeSettings,
  getSettingsSnapshot,
  writeSettings,
  applyTheme,
  DEFAULT_SETTINGS,
} from "@/lib/settings";
import { normalizeTailoredResume } from "@/lib/normalizeResume";
import {
  loadWorkspace,
  saveWorkspace,
  getUrlStep,
  setUrlStep,
  type WorkspaceSnapshot,
} from "@/lib/workspaceStore";
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
    () => DEFAULT_SETTINGS,
  );
  const systemDark = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    () => false,
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<FlowStep>(1);

  // Resume state
  const [resumeMode, setResumeMode] = useState<"upload" | "paste">("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");

  // Job description state
  const [jdText, setJdText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [focusTone, setFocusTone] = useState("ats");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [singlePage, setSinglePage] = useState(true);

  // Output state
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<TailoredResume | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const rateLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hydratedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Restore persisted workspace on mount. Reading localStorage is only
  // possible client-side after mount (SSR cannot), so setState here is required.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadWorkspace();
    if (!saved) {
      hydratedRef.current = true;
      return;
    }
    setResumeMode(saved.resumeMode === "paste" ? "paste" : "upload");
    setResumeText(saved.resumeText ?? "");
    setJdText(saved.jdText ?? "");
    setJobTitle(saved.jobTitle ?? "");
    setCompany(saved.company ?? "");
    setFocusTone(saved.focusTone ?? "ats");
    setAdditionalPrompt(saved.additionalPrompt ?? "");
    setSinglePage(saved.singlePage ?? true);

    const hasResumeText = !!(saved.resumeText && saved.resumeText.trim().length > 0);
    const hasJd = !!(saved.jdText && saved.jdText.trim().length > 0);
    const urlStep = getUrlStep();
    const desiredStep = urlStep ?? saved.step ?? 1;

    if (saved.result) {
      setResult(normalizeTailoredResume(saved.result));
      setCurrentStep(3);
    } else if (desiredStep >= 2 && hasResumeText && hasJd) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
    hydratedRef.current = true;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist workspace (debounced; cancelled if state changes again first).
  useEffect(() => {
    if (!hydratedRef.current) return;
    const snapshot: WorkspaceSnapshot = {
      version: 1,
      resumeMode,
      resumeText,
      jdText,
      jobTitle,
      company,
      focusTone,
      additionalPrompt,
      singlePage,
      step: currentStep,
      result,
    };
    const t = setTimeout(() => saveWorkspace(snapshot), 400);
    return () => clearTimeout(t);
  }, [
    resumeMode,
    resumeText,
    jdText,
    jobTitle,
    company,
    focusTone,
    additionalPrompt,
    singlePage,
    currentStep,
    result,
  ]);

  // Reflect the current step in the URL (?step=) for reload/deeplink.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (currentStep === 3 && !result) return;
    setUrlStep(currentStep);
  }, [currentStep, result]);

  // Warn before leaving while an analysis is in flight.
  useEffect(() => {
    if (!loading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading]);

  // Cancel any in-flight request on unmount.
  useEffect(() => {
    return () => {
      if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const updateSettings = (next: typeof settings) => writeSettings(next);
  const isDark =
    settings.theme === "dark" || (settings.theme === "system" && systemDark);
  const toggleTheme = () =>
    updateSettings({ ...settings, theme: isDark ? "light" : "dark" });
  const hasKey =
    settings.provider === "gemini" ? !!settings.geminiKey : !!settings.groqKey;

  // Format errors
  function formatErrorMessage(error: string): {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  } {
    if (
      error.includes("quota") ||
      error.includes("QUOTA_EXCEEDED") ||
      error.includes("rate limit") ||
      error.includes("RATE_LIMIT_EXCEEDED")
    ) {
      const isGemini =
        error.includes("generativelanguage.googleapis.com") ||
        error.includes("gemini") ||
        error.includes("Gemini");
      if (isGemini) {
        return {
          title: "Gemini API quota reached",
          description:
            "You've hit the free tier quota limit. Wait a minute or switch to Groq in settings for higher limits.",
        };
      }
      return {
        title: "API rate limit reached",
        description:
          "Too many requests. Please wait a moment before trying again.",
      };
    }

    if (
      error.includes("API key") ||
      error.includes("API_KEY") ||
      error.includes("authentication") ||
      error.includes("unauthorized") ||
      error.includes("401") ||
      error.includes("403")
    ) {
      return {
        title: "Invalid or missing API key",
        description:
          "Your API key appears to be invalid or missing. Please check your key in settings.",
        action: {
          label: "Open settings",
          onClick: () => setSettingsOpen(true),
        },
      };
    }

    if (
      error.includes("network") ||
      error.includes("fetch") ||
      error.includes("Failed to fetch") ||
      error.includes("ECONNREFUSED")
    ) {
      return {
        title: "Network error",
        description:
          "Unable to connect to the AI service. Please check your internet connection.",
      };
    }

    return {
      title: "Failed to analyze resume",
      description: error.length > 200 ? error.slice(0, 200) + "…" : error,
    };
  }

  // Handle Submit
  async function handleSubmit() {
    if (loading) return; // guard against double-submit / double Enter
    setLoading(true);
    setResult(null);
    setCurrentStep(3);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("You're offline", {
        description: "Reconnect to the internet, then try again.",
      });
      setLoading(false);
      setCurrentStep(2);
      return;
    }

    // Cancel any previous in-flight request and start a new one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    try {
      const fd = new FormData();
      fd.set("jdText", jdText);
      fd.set("provider", settings.provider);
      fd.set("geminiKey", settings.geminiKey);
      fd.set("groqKey", settings.groqKey);
      fd.set("geminiModel", settings.geminiModel || "gemini-3.8-flash");
      fd.set("groqModel", settings.groqModel || "llama-3.3-70b-versatile");
      fd.set("additionalPrompt", additionalPrompt);
      fd.set("singlePage", singlePage ? "true" : "false");
      if (resumeFile) {
        fd.set("resumeFile", resumeFile);
      } else {
        fd.set("resumeText", resumeText);
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });

      // Ignore responses from a superseded request.
      if (requestId !== requestIdRef.current) return;

      // Parse defensively: the API may return non-JSON (5xx HTML, truncated body).
      const raw = await res.text();
      let data: unknown = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw Object.assign(
          new Error(
            res.ok
              ? "The server returned an unexpected response. Please try again."
              : `The server returned an error (${res.status}). Please try again.`,
          ),
          { status: res.status },
        );
      }

      if (!res.ok) {
        const message =
          (data as { error?: string } | null)?.error ||
          `Something went wrong (${res.status}).`;
        throw Object.assign(new Error(message), { status: res.status });
      }

      if (requestId !== requestIdRef.current || controller.signal.aborted) return;

      const normalized = normalizeTailoredResume(data);
      setResult(normalized);
      const delta = normalized.atsScoreAfter - normalized.atsScoreBefore;
      toast.success("Resume tailored successfully", {
        description: `Match score: ${normalized.atsScoreBefore}% → ${normalized.atsScoreAfter}% (${delta >= 0 ? "+" : ""}${delta} pts)`,
      });
    } catch (err) {
      // A user-initiated cancel is not an error — stay silent.
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      const status =
        typeof (err as { status?: unknown })?.status === "number"
          ? ((err as { status: number }).status)
          : undefined;

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        toast.error("You're offline", {
          description: "Reconnect to the internet, then try again.",
        });
      } else if (status === 429) {
        showRateLimitToast(message);
      } else {
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
      }
      // Return to step 2 so user can retry or adjust
      setCurrentStep(2);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  }

  function showRateLimitToast(message: string) {
    if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);
    const id = "rate-limit";
    let seconds = 30;
    const render = () =>
      toast.error("Rate limit reached", {
        id,
        description: `${message.slice(0, 120)} Try again in ${seconds}s.`,
        duration: 35000,
      });
    render();
    rateLimitTimerRef.current = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);
        rateLimitTimerRef.current = null;
        toast.dismiss(id);
        return;
      }
      render();
    }, 1000);
  }

  // Handle Download DOCX
  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: result, singlePage }),
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
      toast.success("Document downloaded", {
        description: ".docx file generated successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed.";
      toast.error("Export failed", { description: message });
    } finally {
      setDownloading(false);
    }
  }

  const handleStartOver = () => {
    if (
      result &&
      typeof window !== "undefined" &&
      !window.confirm(
        "Start over? This clears your tailored results. Your resume and job description stay so you can adjust and re-run."
      )
    ) {
      return;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    setResult(null);
    setCurrentStep(1);
    setUrlStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      id="top"
      className="min-h-[100dvh] flex flex-col antialiased bg-background text-ink"
    >
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-dotgrid opacity-20" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-toast focus:px-4 focus:py-2 focus:rounded-md focus:bg-surface focus:border focus:border-line focus:text-ink focus:text-sm"
        >
          Skip to content
        </a>
        <HeaderBar
          isDark={isDark}
          onToggleTheme={toggleTheme}
          provider={settings.provider}
          hasKey={hasKey}
          onOpenSettings={() => setSettingsOpen(true)}
          onHowItWorksClick={handleScrollToWorkspace}
        />

        <main id="main" className="max-w-7xl w-full mx-auto px-4 sm:px-6 flex-1 py-8 sm:py-10 space-y-10 scroll-mt-16">
          {/* Landing hero visible when idle at step 1 without active result */}
          {currentStep === 1 && !result && (
            <LandingHero onStart={handleScrollToWorkspace} />
          )}

          {/* Core Workspace Stepper & Cards */}
          <div ref={workspaceRef} className="space-y-6 pt-2">
            <Stepper
              currentStep={currentStep}
              onSelectStep={(step) => {
                if (step <= 2 || result) {
                  setCurrentStep(step);
                }
              }}
              canNavigateToStep={(step) => {
                if (step === 1) return true;
                if (step === 2)
                  return (
                    (resumeMode === "upload" && !!resumeFile) ||
                    resumeText.trim().length >= 30
                  );
                if (step === 3) return !!result || loading;
                return false;
              }}
            />

            {/* Screen 1: Add Resume */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Step1Resume
                  mode={resumeMode}
                  onChangeMode={setResumeMode}
                  file={resumeFile}
                  onSelectFile={setResumeFile}
                  text={resumeText}
                  onChangeText={setResumeText}
                  onNext={() => setCurrentStep(2)}
                />
              </motion.div>
            )}

            {/* Screen 2: Add Job Description */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Step2Job
                  jdText={jdText}
                  onChangeJdText={setJdText}
                  additionalPrompt={additionalPrompt}
                  onChangeAdditionalPrompt={setAdditionalPrompt}
                  singlePage={singlePage}
                  onChangeSinglePage={setSinglePage}
                  jobTitle={jobTitle}
                  onChangeJobTitle={setJobTitle}
                  company={company}
                  onChangeCompany={setCompany}
                  focusTone={focusTone}
                  onChangeFocusTone={setFocusTone}
                  onBack={() => setCurrentStep(1)}
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              </motion.div>
            )}

            {/* Screen 3: Loading or Results */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {loading && (
                  <Step3Loading
                    providerName={
                      settings.provider === "gemini" ? "Gemini" : "Groq"
                    }
                  />
                )}

                {result && !loading && (
                  <ErrorBoundary>
                    <ResultsWorkspaceNew
                      result={result}
                      originalText={resumeText}
                      downloading={downloading}
                      singlePage={singlePage}
                      onToggleSinglePage={setSinglePage}
                      onDownloadDocx={handleDownload}
                      onStartOver={handleStartOver}
                      onUpdateResume={(updated) => setResult(updated)}
                    />
                  </ErrorBoundary>
                )}
              </motion.div>
            )}
          </div>
        </main>

        {/* Minimal Footer with essential links */}
        <footer className="border-t border-line py-4 mt-12 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">
                ResumeTailor
              </span>
              <span>·</span>
              <span>Calm, accurate career optimization</span>
            </div>

            <div className="flex items-center gap-6 font-medium">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="hover:text-ink transition-colors cursor-pointer"
              >
                AI Settings
              </button>
              <a
                href="#top"
                className="hover:text-ink transition-colors"
              >
                Back to top
              </a>
            </div>
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
