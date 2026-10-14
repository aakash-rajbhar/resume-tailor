"use client";

import { useEffect, useState, useSyncExternalStore, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import HeaderBar from "@/components/HeaderBar";
import Stepper, { type FlowStep } from "@/components/ui/Stepper";
import Step1Resume from "@/components/workspace/Step1Resume";
import Step2Job from "@/components/workspace/Step2Job";
import Step3Loading from "@/components/workspace/Step3Loading";
import ResultsWorkspaceNew from "@/components/results/ResultsWorkspaceNew";
import LandingHero from "@/components/landing/LandingHero";
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

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

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
    setLoading(true);
    setResult(null);
    setCurrentStep(3);

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

      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setResult(data as TailoredResume);
      toast.success("Resume tailored successfully", {
        description: `Match score: ${data.atsScoreBefore}% → ${data.atsScoreAfter}% (${data.atsScoreAfter - data.atsScoreBefore >= 0 ? "+" : ""}${data.atsScoreAfter - data.atsScoreBefore} pts)`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
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
      // Return to step 2 so user can retry or adjust
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
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
    setResult(null);
    setCurrentStep(1);
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
        <HeaderBar
          isDark={isDark}
          onToggleTheme={toggleTheme}
          provider={settings.provider}
          hasKey={hasKey}
          onOpenSettings={() => setSettingsOpen(true)}
          onHowItWorksClick={handleScrollToWorkspace}
        />

        <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 flex-1 py-8 sm:py-10 space-y-10">
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
                )}
              </motion.div>
            )}
          </div>
        </main>

        {/* Minimal Footer with essential links */}
        <footer className="border-t border-line py-4 mt-12 bg-surface">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
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
