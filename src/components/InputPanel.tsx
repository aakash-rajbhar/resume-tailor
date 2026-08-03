"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  UploadSimple,
  Trash,
  Check,
  Warning,
  ArrowCounterClockwise,
  Sparkle,
  ArrowRight,
} from "@phosphor-icons/react";
import CropMarks from "./CropMarks";
import type { AIProvider } from "@/lib/ai";

export interface InputPayload {
  jdText: string;
  resumeFile?: File | null;
  resumeText?: string;
}

const PROVIDER_LABEL: Record<AIProvider, string> = {
  gemini: "Gemini",
  groq: "Groq",
};

function StepHeader({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--ink)] text-[var(--paper)] text-[11px] font-mono font-bold">
        {step}
      </span>
      <span className="overline text-[var(--ink)] opacity-70">{children}</span>
    </div>
  );
}

interface InputPanelProps {
  provider: AIProvider;
  loading: boolean;
  error: string | null;
  onSubmit: (payload: InputPayload) => void;
  onOpenSettings: () => void;
}

export default function InputPanel({
  provider,
  loading,
  error,
  onSubmit,
  onOpenSettings,
}: InputPanelProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    jdText.trim().length > 20 &&
    (mode === "upload" ? !!resumeFile : resumeText.trim().length > 20) &&
    !loading;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      jdText,
      resumeFile: mode === "upload" ? resumeFile : undefined,
      resumeText: mode === "paste" ? resumeText : undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="paper-card rounded-2xl p-6 relative overflow-hidden flex flex-col gap-6"
    >
      <CropMarks />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--ink)]" />

      {/* STEP 1 — RESUME SOURCE */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-2">
          <StepHeader step="1">Resume Source</StepHeader>
          <div className="flex p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] relative">
            {(["upload", "paste"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`relative z-10 font-mono text-[11px] px-3 py-1.5 rounded-md transition-colors ${
                  mode === m
                    ? "text-[var(--paper)] font-bold"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {mode === m && (
                  <motion.span
                    layoutId="mode-bg"
                    className="absolute inset-0 bg-[var(--ink)] rounded-md -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {m === "upload" ? "File" : "Text"}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div
                onDragOver={handleDrag}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? "border-[var(--green)] bg-[var(--green-soft)]/60 scale-[0.99]"
                    : resumeFile
                      ? "border-[var(--green)] bg-[var(--green-soft)]/40"
                      : "border-[var(--line)] hover:border-[var(--ink)] hover:bg-[var(--surface-2)]/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf,.txt"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />

                {resumeFile ? (
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <div className="w-11 h-11 rounded-full bg-[var(--green-soft)] flex items-center justify-center text-[var(--green)]">
                      <Check size={20} weight="bold" />
                    </div>
                    <p className="text-sm font-semibold max-w-[220px] truncate">{resumeFile.name}</p>
                    <p className="font-mono text-[10px] text-[var(--muted)]">
                      {(resumeFile.size / 1024).toFixed(1)} KB · PDF/DOCX/TXT
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="mt-1 text-xs text-[var(--red)] hover:underline flex items-center gap-1 font-mono"
                    >
                      <Trash size={14} weight="bold" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted)] mb-2 rotate-3">
                      <UploadSimple size={22} weight="duotone" />
                    </span>
                    <p className="text-sm font-semibold">Drag &amp; drop resume file here</p>
                    <p className="text-xs text-[var(--muted)]">or click to browse your files</p>
                    <span className="font-mono text-[9px] mt-2 px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] uppercase tracking-wider">
                      PDF · DOCX · TXT
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="paste"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your original resume text here…"
                rows={7}
                className="w-full p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] font-mono text-sm leading-relaxed resize-y min-h-[140px] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors thin-scrollbar"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STEP 2 — JOB DESCRIPTION */}
      <div className="border-t border-[var(--line)] pt-6">
        <StepHeader step="2">Target Job Description</StepHeader>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description or core requirements here…"
          rows={8}
          className="w-full p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm leading-relaxed resize-y min-h-[150px] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors thin-scrollbar"
        />
        <div className="flex justify-between items-center mt-2 font-mono text-[10px] text-[var(--muted)]">
          <span>Minimum 20 characters required</span>
          <span>{jdText.trim().length} chars</span>
        </div>
      </div>

      {/* ERROR */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="text-xs p-3.5 rounded-xl border border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)] flex gap-2.5">
              <Warning size={16} weight="fill" className="flex-shrink-0 mt-0.5" />
              <p className="font-mono leading-relaxed break-words">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="group relative w-full py-4 px-5 rounded-xl font-mono text-xs tracking-[0.18em] font-bold uppercase flex items-center justify-center gap-2.5 bg-[var(--ink)] text-[var(--paper)] transition-all duration-300 hover:shadow-[0_10px_36px_-14px_var(--accent)] active:scale-[0.985] disabled:opacity-35 disabled:pointer-events-none overflow-hidden"
      >
        {loading ? (
          <>
            <ArrowCounterClockwise size={16} weight="bold" className="animate-spin" />
            <span>Analyzing &amp; re-weaving…</span>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute w-full h-0.5 bg-[var(--accent)] top-0 left-0 animate-[bounce_1.5s_infinite]" />
            </div>
          </>
        ) : (
          <>
            <Sparkle size={16} weight="fill" className="text-[var(--accent)] group-hover:rotate-12 transition-transform" />
            <span>Scan · Match · Tailor</span>
            <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <p className="text-center font-mono text-[10px] uppercase tracking-widest text-[var(--muted)] -mt-2">
        Engine: <span className="text-[var(--accent)] font-bold">{PROVIDER_LABEL[provider]}</span>
        {" · "}
        <button
          type="button"
          onClick={onOpenSettings}
          className="underline decoration-dotted hover:text-[var(--ink)] transition-colors"
        >
          configure
        </button>
      </p>
    </form>
  );
}
