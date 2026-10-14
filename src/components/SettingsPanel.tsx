"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Sun,
  Moon,
  Monitor,
  Sparkles,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Plug,
  ShieldCheck,
  ChevronRight,
  Cpu,
  RefreshCw,
} from "lucide-react";
import type { AppSettings, ThemePreference } from "@/lib/settings";
import {
  type AIProvider,
  type AIModelOption,
  GEMINI_FREE_MODELS,
  GROQ_FREE_MODELS,
} from "@/lib/ai";
import Link from "next/link";

const PROVIDER_META: Record<
  AIProvider,
  { label: string; keyName: string; placeholder: string; hint: string; link: string; badge: string }
> = {
  gemini: {
    label: "Google Gemini",
    keyName: "GEMINI_API_KEY",
    placeholder: "AIzaSy…",
    hint: "Free tier via Google AI Studio. Get a key at ",
    link: "https://aistudio.google.com/apikey",
    badge: "Google",
  },
  groq: {
    label: "Groq Cloud",
    keyName: "GROQ_API_KEY",
    placeholder: "gsk_…",
    hint: "Ultra-fast open models. Get a free key at ",
    link: "https://console.groq.com/keys",
    badge: "Open Models",
  },
};

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

type TestState = { provider: AIProvider; ok: boolean; message: string } | null;

export default function SettingsPanel({ open, onClose, settings, onChange }: SettingsPanelProps) {
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({ gemini: false, groq: false });
  const [testing, setTesting] = useState<AIProvider | null>(null);
  const [testResult, setTestResult] = useState<TestState>(null);
  const [fetchingLiveModels, setFetchingLiveModels] = useState(false);
  const [liveGroqModels, setLiveGroqModels] = useState<AIModelOption[] | null>(null);
  const [liveModelNotice, setLiveModelNotice] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const setKey = (provider: AIProvider, value: string) =>
    onChange({ ...settings, [provider === "gemini" ? "geminiKey" : "groqKey"]: value });

  const setModel = (provider: AIProvider, model: string) =>
    onChange({ ...settings, [provider === "gemini" ? "geminiModel" : "groqModel"]: model });

  const setProvider = (provider: AIProvider) => onChange({ ...settings, provider });

  const setTheme = (theme: ThemePreference) => onChange({ ...settings, theme });

  async function handleFetchLiveModels() {
    if (!settings.groqKey) {
      setLiveModelNotice("Enter your Groq API key below first.");
      return;
    }

    setFetchingLiveModels(true);
    setLiveModelNotice(null);
    try {
      const res = await fetch("/api/groq-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settings.groqKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to query Groq models API.");
      }
      if (Array.isArray(data.models) && data.models.length > 0) {
        setLiveGroqModels(data.models);
        setLiveModelNotice(`Found ${data.models.length} active models available on your Groq key!`);
      } else {
        setLiveModelNotice("No compatible text models returned by Groq.");
      }
    } catch (err) {
      setLiveModelNotice(err instanceof Error ? err.message : "Failed to load models from Groq.");
    } finally {
      setFetchingLiveModels(false);
    }
  }

  async function handleTest(provider: AIProvider) {
    const key = provider === "gemini" ? settings.geminiKey : settings.groqKey;
    const model = provider === "gemini" ? (settings.geminiModel || "gemini-3.8-flash") : (settings.groqModel || "llama-3.3-70b-versatile");

    if (!key) {
      setTestResult({ provider, ok: false, message: "Enter an API key first." });
      return;
    }

    setTesting(provider);
    setTestResult(null);
    const start = performance.now();
    try {
      const res = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key, model }),
      });
      const elapsed = Math.round(performance.now() - start);
      const data = (await res.json()) as { ok: boolean; error?: string };
      setTestResult({
        provider,
        ok: data.ok,
        message: data.ok ? `Connected to ${model} successfully in ${elapsed}ms!` : data.error || "Connection test failed",
      });
    } catch {
      setTestResult({ provider, ok: false, message: "Network connection error." });
    } finally {
      setTesting(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--surface)] border-l border-[var(--line)] shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--line)] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">
                  Engine & Studio Settings
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Configure your AI models, free API keys, and theme.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* THEME PREFERENCE */}
              <section className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Appearance
                </label>
                <div className="grid grid-cols-3 p-1 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] gap-1">
                  {(
                    [
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "system", label: "Auto", icon: Monitor },
                    ] as { value: ThemePreference; label: string; icon: typeof Sun }[]
                  ).map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setTheme(o.value)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        settings.theme === o.value
                          ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs font-semibold"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <o.icon size={13} />
                      <span>{o.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* AI ENGINE SELECTOR */}
              <section className="space-y-3 pt-3 border-t border-[var(--line)]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Default AI Provider
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {(["gemini", "groq"] as AIProvider[]).map((p) => {
                    const meta = PROVIDER_META[p];
                    const active = settings.provider === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProvider(p)}
                        className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-[var(--ink)]">{meta.label}</span>
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[var(--muted)]">{meta.badge}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Provider Details */}
                {(["gemini", "groq"] as AIProvider[]).map((p) => {
                  const meta = PROVIDER_META[p];
                  const isActive = settings.provider === p;
                  const key = p === "gemini" ? settings.geminiKey : settings.groqKey;
                  const show = showKeys[p];
                  const isTesting = testing === p;
                  const isResult = testResult?.provider === p;
                  const currentModel =
                    p === "gemini"
                      ? (settings.geminiModel || "gemini-3.8-flash")
                      : (settings.groqModel || "llama-3.3-70b-versatile");
                  const modelList = p === "gemini" ? GEMINI_FREE_MODELS : (liveGroqModels || GROQ_FREE_MODELS);
                  const isCustomModel = modelList.every((m) => m.id !== currentModel);

                  if (!isActive) return null;

                  return (
                    <div
                      key={p}
                      className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/30 space-y-4"
                    >
                      {/* Model Selector */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-[var(--ink)] flex items-center gap-1.5">
                            <Cpu size={13} className="text-[var(--accent)]" />
                            <span>Select Model</span>
                          </label>
                          <div className="flex items-center gap-2">
                            {p === "groq" && (
                              <button
                                type="button"
                                onClick={handleFetchLiveModels}
                                disabled={fetchingLiveModels}
                                className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw size={11} className={fetchingLiveModels ? "animate-spin" : ""} />
                                <span>{fetchingLiveModels ? "Checking…" : "Discover Groq Models"}</span>
                              </button>
                            )}
                            <span className="text-[10px] font-mono text-[var(--green)]">Free Tier</span>
                          </div>
                        </div>

                        {liveModelNotice && p === "groq" && (
                          <div className="text-[11px] px-2.5 py-1.5 rounded-md bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]">
                            {liveModelNotice}
                          </div>
                        )}

                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                          {modelList.map((m) => {
                            const isSelected = currentModel === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setModel(p, m.id)}
                                className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                  isSelected
                                    ? "border-[var(--accent)] bg-[var(--surface)] shadow-xs"
                                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-medium text-[var(--ink)] truncate">{m.name}</span>
                                    {m.badge && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[var(--surface-2)] border border-[var(--line)] text-[var(--muted)]">
                                        {m.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-1">{m.desc}</p>
                                </div>
                                <div
                                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                    isSelected
                                      ? "border-[var(--accent)] bg-[var(--accent)]"
                                      : "border-[var(--line-strong)]"
                                  }`}
                                >
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Model ID Override */}
                        <div className="pt-1.5 border-t border-[var(--line)]/60">
                          <div className="flex items-center justify-between text-[11px] text-[var(--muted)] mb-1">
                            <span>Or enter custom model ID:</span>
                            {isCustomModel && (
                              <span className="text-[10px] text-[var(--accent)] font-mono font-medium">Custom active</span>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder={p === "gemini" ? "e.g. gemini-3.8-flash" : "e.g. llama-3.3-70b-versatile"}
                            value={currentModel}
                            onChange={(e) => setModel(p, e.target.value.trim())}
                            className="w-full px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs font-mono placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                          />
                        </div>
                      </div>

                      {/* API Key Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-[var(--ink)] flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${key ? "bg-[var(--green)]" : "bg-[var(--muted)]"}`}
                            />
                            <span>{meta.label} API Key</span>
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={show ? "text" : "password"}
                              value={key}
                              onChange={(e) => setKey(p, e.target.value)}
                              placeholder={meta.placeholder}
                              autoComplete="off"
                              spellCheck={false}
                              className="w-full pl-3 pr-8 py-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs font-mono placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowKeys((s) => ({ ...s, [p]: !s[p] }))}
                              aria-label={show ? "Hide key" : "Show key"}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                            >
                              {show ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTest(p)}
                            disabled={isTesting}
                            className="px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plug size={13} className={isTesting ? "animate-spin" : ""} />
                            <span>{isTesting ? "Testing" : "Test"}</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-[var(--muted)]">
                          {meta.hint}
                          <Link
                            href={meta.link}
                            target="_blank"
                            className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 ml-0.5 font-medium"
                          >
                            Get key
                          </Link>
                        </p>

                        {/* Test Status Feedback */}
                        {isResult && (
                          <div
                            className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                              testResult.ok
                                ? "border-[var(--green-border)] bg-[var(--green-soft)] text-[var(--green)]"
                                : "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]"
                            }`}
                          >
                            {testResult.ok ? (
                              <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                            )}
                            <span className="leading-tight">{testResult.message}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* PRIVACY & DATA NOTE */}
              <section className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
                  <ShieldCheck size={16} className="text-[var(--green)]" />
                  <span>Private by Design</span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Your keys and resume text remain strictly in your browser&apos;s <code className="font-mono text-[11px] text-[var(--ink)]">localStorage</code>. Data is sent directly to your chosen AI provider without intermediary logging.
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--line)] bg-[var(--surface)] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Done</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
