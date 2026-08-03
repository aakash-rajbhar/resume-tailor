"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Sun,
  Moon,
  Desktop,
  Sparkle,
  X,
  Eye,
  EyeSlash,
  CheckCircle,
  Warning,
  Plugs,
  LockKey,
  ShieldCheck,
  CaretRight,
} from "@phosphor-icons/react";
import type { AppSettings, ThemePreference } from "@/lib/settings";
import type { AIProvider } from "@/lib/ai";

const PROVIDER_META: Record<
  AIProvider,
  { label: string; keyName: string; placeholder: string; hint: string; badge: string }
> = {
  gemini: {
    label: "Gemini",
    keyName: "GEMINI_API_KEY",
    placeholder: "AIzaSy…",
    hint: "Google's free tier. Get a key at aistudio.google.com/apikey",
    badge: "Google",
  },
  groq: {
    label: "Groq",
    keyName: "GROQ_API_KEY",
    placeholder: "gsk_…",
    hint: "Blazing-fast open models. Get a key at console.groq.com/keys",
    badge: "Open models",
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

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const setKey = (provider: AIProvider, value: string) =>
    onChange({ ...settings, [provider === "gemini" ? "geminiKey" : "groqKey"]: value });

  const setProvider = (provider: AIProvider) => onChange({ ...settings, provider });

  const setTheme = (theme: ThemePreference) => onChange({ ...settings, theme });

  async function handleTest(provider: AIProvider) {
    const key = provider === "gemini" ? settings.geminiKey : settings.groqKey;
    if (!key) {
      setTestResult({ provider, ok: false, message: "Enter a key first." });
      return;
    }
    setTesting(provider);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      setTestResult({ provider, ok: data.ok, message: data.ok ? "Connected — key works" : data.error || "Failed" });
    } catch {
      setTestResult({ provider, ok: false, message: "Network error" });
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--surface)] border-l border-[var(--line)] shadow-2xl flex flex-col"
            style={{ boxShadow: "0 24px 80px -24px rgba(0,0,0,0.45)" }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-[var(--line)] flex items-start justify-between gap-4">
              <div>
                <p className="overline text-[var(--accent)]">Configuration</p>
                <h2 className="font-display text-2xl mt-1 tracking-tight">Studio Settings</h2>
                <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                  Choose the AI engine, drop in your keys, and set the look of the studio.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close settings"
                className="p-2 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {/* APPEARANCE */}
              <section className="px-6 py-6 border-b border-[var(--line)]">
                <div className="flex items-center gap-2 mb-4">
                  <Sun size={15} className="text-[var(--accent)]" weight="bold" />
                  <h3 className="overline">Appearance</h3>
                </div>
                <div className="flex p-1 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                  {(
                    [
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "system", label: "Auto", icon: Desktop },
                    ] as { value: ThemePreference; label: string; icon: typeof Sun }[]
                  ).map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setTheme(o.value)}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-semibold rounded-md transition-colors ${
                        settings.theme === o.value
                          ? "text-[var(--surface)]"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {settings.theme === o.value && (
                        <motion.span
                          layoutId="theme-pill"
                          className="absolute inset-0 bg-[var(--ink)] rounded-md"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <o.icon size={14} weight="bold" className="relative z-10" />
                      <span className="relative z-10">{o.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* AI PROVIDER */}
              <section className="px-6 py-6 border-b border-[var(--line)]">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkle size={15} className="text-[var(--accent)]" weight="fill" />
                  <h3 className="overline">AI Engine</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {(["gemini", "groq"] as AIProvider[]).map((p) => {
                    const meta = PROVIDER_META[p];
                    const active = settings.provider === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setProvider(p)}
                        className={`relative rounded-xl border p-4 text-left transition-all ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent)]/[0.07]"
                            : "border-[var(--line)] bg-[var(--surface-2)]/40 hover:border-[var(--muted)]"
                        }`}
                      >
                        {active && (
                          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                        )}
                        <span className="font-display text-lg block">{meta.label}</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
                          {meta.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {(["gemini", "groq"] as AIProvider[]).map((p) => {
                  const meta = PROVIDER_META[p];
                  const isActive = settings.provider === p;
                  const key = p === "gemini" ? settings.geminiKey : settings.groqKey;
                  const show = showKeys[p];
                  const isTesting = testing === p;
                  const isResult = testResult?.provider === p;

                  return (
                    <div
                      key={p}
                      className={`mb-4 p-4 rounded-xl border transition-all ${
                        isActive
                          ? "border-[var(--line)] bg-[var(--surface-2)]/30"
                          : "border-[var(--line)] opacity-55"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-mono text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${key ? "bg-[var(--green)]" : "bg-[var(--muted)]"}`}
                          />
                          {meta.label} API Key
                        </label>
                        {isActive && (
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--accent)] font-bold">
                            Active
                          </span>
                        )}
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
                            className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-sm font-mono placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKeys((s) => ({ ...s, [p]: !s[p] }))}
                            aria-label={show ? "Hide key" : "Show key"}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                          >
                            {show ? <EyeSlash size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTest(p)}
                          disabled={isTesting}
                          className="px-3 py-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] font-mono text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--muted)] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                        >
                          <Plugs size={14} weight="bold" className={isTesting ? "animate-pulse" : ""} />
                          {isTesting ? "Testing" : "Test"}
                        </button>
                      </div>

                      <p className="text-[11px] text-[var(--muted)] mt-2 leading-relaxed">{meta.hint}</p>

                      {isResult && (
                        <div
                          className={`mt-2 text-xs px-3 py-2 rounded-lg border flex items-start gap-2 font-mono ${
                            testResult.ok
                              ? "border-[var(--green)] bg-[var(--green-soft)] text-[var(--green)]"
                              : "border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]"
                          }`}
                        >
                          {testResult.ok ? (
                            <CheckCircle size={14} weight="fill" className="flex-shrink-0 mt-0.5" />
                          ) : (
                            <Warning size={14} weight="fill" className="flex-shrink-0 mt-0.5" />
                          )}
                          <span className="break-words leading-relaxed">{testResult.message}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>

              {/* PRIVACY NOTE */}
              <section className="px-6 py-6">
                <div className="flex gap-3 p-4 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)]/30">
                  <ShieldCheck size={18} className="text-[var(--green)] flex-shrink-0 mt-0.5" weight="fill" />
                  <div className="text-[11px] leading-relaxed text-[var(--muted)]">
                    <p className="font-mono uppercase tracking-wider font-bold text-[var(--ink)] text-[10px] mb-1">
                      Keys stay in your browser
                    </p>
                    <p>
                      Keys are stored in <span className="font-mono text-[var(--ink)]">localStorage</span> and sent
                      only to your chosen provider&apos;s API during analysis. They are never logged or stored on a
                      server. For self-hosted setups you can instead set{" "}
                      <span className="font-mono text-[var(--ink)]">{PROVIDER_META[settings.provider].keyName}</span>{" "}
                      and <span className="font-mono text-[var(--ink)]">AI_PROVIDER</span> in{" "}
                      <span className="font-mono text-[var(--ink)]">.env.local</span>.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
                    <LockKey size={12} weight="bold" /> Current engine: {PROVIDER_META[settings.provider].label}
                  </span>
                  <button
                    onClick={onClose}
                    className="flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] hover:underline"
                  >
                    Done <CaretRight size={12} weight="bold" />
                  </button>
                </div>
              </section>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
