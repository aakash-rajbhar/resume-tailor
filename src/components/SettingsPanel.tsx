"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Sun,
  Moon,
  Monitor,
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
  {
    label: string;
    keyName: string;
    placeholder: string;
    hint: string;
    link: string;
    badge: string;
  }
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

export default function SettingsPanel({
  open,
  onClose,
  settings,
  onChange,
}: SettingsPanelProps) {
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    gemini: false,
    groq: false,
  });
  const [testing, setTesting] = useState<AIProvider | null>(null);
  const [testResult, setTestResult] = useState<TestState>(null);
  const [fetchingLiveModels, setFetchingLiveModels] = useState(false);
  const [liveGroqModels, setLiveGroqModels] = useState<AIModelOption[] | null>(
    null,
  );
  const [liveModelNotice, setLiveModelNotice] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = "settings-panel-title";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus management: move focus into the dialog, trap Tab, close on Escape,
  // and restore focus to the trigger when closed.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function getFocusable(): HTMLElement[] {
      const panel = panelRef.current;
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const setKey = (provider: AIProvider, value: string) =>
    onChange({
      ...settings,
      [provider === "gemini" ? "geminiKey" : "groqKey"]: value,
    });

  const setModel = (provider: AIProvider, model: string) =>
    onChange({
      ...settings,
      [provider === "gemini" ? "geminiModel" : "groqModel"]: model,
    });

  const setProvider = (provider: AIProvider) =>
    onChange({ ...settings, provider });

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
        setLiveModelNotice(
          `Found ${data.models.length} active models available on your Groq key!`,
        );
      } else {
        setLiveModelNotice("No compatible text models returned by Groq.");
      }
    } catch (err) {
      setLiveModelNotice(
        err instanceof Error ? err.message : "Failed to load models from Groq.",
      );
    } finally {
      setFetchingLiveModels(false);
    }
  }

  async function handleTest(provider: AIProvider) {
    const key = provider === "gemini" ? settings.geminiKey : settings.groqKey;
    const model =
      provider === "gemini"
        ? settings.geminiModel || "gemini-3.8-flash"
        : settings.groqModel || "llama-3.3-70b-versatile";

    if (!key) {
      setTestResult({
        provider,
        ok: false,
        message: "Enter an API key first.",
      });
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
        message: data.ok
          ? `Connected to ${model} successfully in ${elapsed}ms!`
          : data.error || "Connection test failed",
      });
    } catch {
      setTestResult({
        provider,
        ok: false,
        message: "Network connection error.",
      });
    } finally {
      setTesting(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-modal">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-surface border-l border-line shadow-float flex flex-col outline-none"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-line flex items-center justify-between gap-4">
              <div>
                <h2
                  id={titleId}
                  className="text-base font-semibold tracking-tight text-ink"
                >
                  Engine & Studio Settings
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Configure your AI models, free API keys, and theme.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* THEME PREFERENCE */}
              <section className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Appearance
                </label>
                <div className="grid grid-cols-3 p-1 rounded-lg bg-surface-2 border border-line gap-1">
                  {(
                    [
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "system", label: "Auto", icon: Monitor },
                    ] as {
                      value: ThemePreference;
                      label: string;
                      icon: typeof Sun;
                    }[]
                  ).map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setTheme(o.value)}
                      aria-pressed={settings.theme === o.value}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        settings.theme === o.value
                          ? "bg-surface text-ink shadow-xs font-semibold"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      <o.icon size={13} />
                      <span>{o.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* AI ENGINE SELECTOR */}
              <section className="space-y-3 pt-3 border-t border-line">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
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
                        aria-pressed={active}
                        className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                          active
                            ? "border-accent bg-accent-soft"
                            : "border-line bg-surface hover:border-line-strong"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-ink">
                            {meta.label}
                          </span>
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-muted">
                          {meta.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Provider Details */}
                {(["gemini", "groq"] as AIProvider[]).map((p) => {
                  const meta = PROVIDER_META[p];
                  const isActive = settings.provider === p;
                  const key =
                    p === "gemini" ? settings.geminiKey : settings.groqKey;
                  const show = showKeys[p];
                  const isTesting = testing === p;
                  const isResult = testResult?.provider === p;
                  const currentModel =
                    p === "gemini"
                      ? settings.geminiModel || "gemini-3.8-flash"
                      : settings.groqModel || "llama-3.3-70b-versatile";
                  const modelList =
                    p === "gemini"
                      ? GEMINI_FREE_MODELS
                      : liveGroqModels || GROQ_FREE_MODELS;
                  const isCustomModel = modelList.every(
                    (m) => m.id !== currentModel,
                  );

                  if (!isActive) return null;

                  return (
                    <div
                      key={p}
                      className="p-4 rounded-xl border border-line bg-surface-2/30 space-y-4"
                    >
                      {/* Model Selector */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                            <Cpu size={13} className="text-accent" />
                            <span>Select Model</span>
                          </label>
                          <div className="flex items-center gap-2">
                            {p === "groq" && (
                              <button
                                type="button"
                                onClick={handleFetchLiveModels}
                                disabled={fetchingLiveModels}
                                className="text-[11px] text-accent hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw
                                  size={11}
                                  className={
                                    fetchingLiveModels ? "animate-spin" : ""
                                  }
                                />
                                <span>
                                  {fetchingLiveModels
                                    ? "Checking…"
                                    : "Discover Groq Models"}
                                </span>
                              </button>
                            )}
                            <span className="text-[10px] font-mono text-green">
                              Free Tier
                            </span>
                          </div>
                        </div>

                        {liveModelNotice && p === "groq" && (
                          <div className="text-[11px] px-2.5 py-1.5 rounded-md bg-surface border border-line text-ink">
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
                                aria-pressed={isSelected}
                                className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                  isSelected
                                    ? "border-accent bg-surface shadow-xs"
                                    : "border-line bg-surface hover:border-line-strong"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-medium text-ink truncate">
                                      {m.name}
                                    </span>
                                    {m.badge && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-surface-2 border border-line text-muted">
                                        {m.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted mt-0.5 line-clamp-1">
                                    {m.desc}
                                  </p>
                                </div>
                                <div
                                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "border-accent bg-accent"
                                      : "border-line-strong"
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Model ID Override */}
                        <div className="pt-1.5 border-t border-line/60">
                          <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                            <span>Or enter custom model ID:</span>
                            {isCustomModel && (
                              <span className="text-[10px] text-accent font-mono font-medium">
                                Custom active
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder={
                              p === "gemini"
                                ? "e.g. gemini-3.8-flash"
                                : "e.g. llama-3.3-70b-versatile"
                            }
                            value={currentModel}
                            onChange={(e) => setModel(p, e.target.value.trim())}
                            className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-mono placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
                          />
                        </div>
                      </div>

                      {/* API Key Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${key ? "bg-green" : "bg-muted"}`}
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
                              className="w-full pl-3 pr-8 py-2 rounded-lg border border-line bg-surface text-xs font-mono placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowKeys((s) => ({ ...s, [p]: !s[p] }))
                              }
                              aria-label={show ? "Hide key" : "Show key"}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                            >
                              {show ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTest(p)}
                            disabled={isTesting}
                            className="px-3 py-2 rounded-lg border border-line bg-surface text-xs font-medium text-ink hover:bg-surface-2 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plug
                              size={13}
                              className={isTesting ? "animate-spin" : ""}
                            />
                            <span>{isTesting ? "Testing" : "Test"}</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-muted">
                          {meta.hint}
                          <Link
                            href={meta.link}
                            target="_blank"
                            className="text-accent hover:underline inline-flex items-center gap-0.5 ml-0.5 font-medium"
                          >
                            Get key
                          </Link>
                        </p>

                        {/* Test Status Feedback */}
                        {isResult && (
                          <div
                            className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                              testResult.ok
                                ? "border-green-border bg-green-soft text-green"
                                : "border-danger-border bg-danger-soft text-danger"
                            }`}
                          >
                            {testResult.ok ? (
                              <CheckCircle2
                                size={14}
                                className="shrink-0 mt-0.5"
                              />
                            ) : (
                              <AlertCircle
                                size={14}
                                className="shrink-0 mt-0.5"
                              />
                            )}
                            <span className="leading-tight">
                              {testResult.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* PRIVACY & DATA NOTE */}
              <section className="p-4 rounded-xl border border-line bg-surface-2/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <ShieldCheck size={16} className="text-green" />
                  <span>Private by Design</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Your keys and resume text remain strictly in your
                  browser&apos;s{" "}
                  <code className="font-mono text-[11px] text-ink">
                    localStorage
                  </code>
                  . Data is sent directly to your chosen AI provider without
                  intermediary logging.
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-line bg-surface flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-hover text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
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
