"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  UploadSimple,
  Trash,
  Check,
  ArrowCounterClockwise,
  Sparkle,
  ArrowRight,
} from "@phosphor-icons/react";
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

const STORAGE_KEY = "resume-tailor-resume";

interface StoredResume {
  mode: "upload" | "paste";
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileData?: string; // base64
  text?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToFile(base64: string, fileName: string, fileType: string): File {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || fileType;
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
}

function StepHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center w-5 h-5 rounded text-[11px] font-mono font-semibold bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)]">
        {step}
      </span>
      <span className="text-xs font-semibold tracking-wide text-[var(--ink)] uppercase">{title}</span>
    </div>
  );
}

interface InputPanelProps {
  provider: AIProvider;
  loading: boolean;
  onSubmit: (payload: InputPayload) => void;
  onOpenSettings: () => void;
}

export default function InputPanel({
  provider,
  loading,
  onSubmit,
  onOpenSettings,
}: InputPanelProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredResume = JSON.parse(stored);
        setMode(data.mode);
        if (data.mode === "upload" && data.fileData && data.fileName) {
          const file = base64ToFile(data.fileData, data.fileName, data.fileType || "application/octet-stream");
          setResumeFile(file);
        } else if (data.mode === "paste" && data.text) {
          setResumeText(data.text);
        }
      }
    } catch (e) {
      console.warn("Failed to load resume from localStorage:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save to localStorage whenever resume data changes
  const saveToStorage = useCallback(() => {
    if (!hydrated) return;
    try {
      const data: StoredResume = { mode };
      if (mode === "upload" && resumeFile) {
        fileToBase64(resumeFile).then((base64) => {
          const toStore: StoredResume = {
            mode: "upload",
            fileName: resumeFile.name,
            fileSize: resumeFile.size,
            fileType: resumeFile.type,
            fileData: base64,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        });
      } else if (mode === "paste") {
        data.text = resumeText;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn("Failed to save resume to localStorage:", e);
    }
  }, [hydrated, mode, resumeFile, resumeText]);

  useEffect(() => {
    saveToStorage();
  }, [saveToStorage]);

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
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }
  };

  const clearText = () => {
    setResumeText("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }
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
      className="paper-card rounded-2xl p-6 relative flex flex-col gap-6 shadow-xs"
    >
      {/* STEP 1 — RESUME SOURCE */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-2">
          <StepHeader step="1" title="Resume Source" />
          <div className="flex p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
            {(["upload", "paste"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`relative z-10 text-xs font-medium px-3 py-1 rounded-md transition-all ${
                  mode === m
                    ? "text-[var(--paper)] font-semibold"
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
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <div
                onDragOver={handleDrag}
                onDragEnter={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-[var(--green)] bg-[var(--green-soft)]/50 scale-[0.99]"
                    : resumeFile
                      ? "border-[var(--line)] bg-[var(--surface-2)]/40"
                      : "border-[var(--line)] bg-[var(--surface-2)]/20 hover:bg-[var(--surface-2)]/50 hover:border-[var(--muted)]"
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
                    <div className="w-10 h-10 rounded-full bg-[var(--green-soft)] flex items-center justify-center text-[var(--green)]">
                      <Check size={18} weight="bold" />
                    </div>
                    <p className="text-sm font-medium text-[var(--ink)] max-w-[240px] truncate">{resumeFile.name}</p>
                    <p className="font-mono text-[11px] text-[var(--muted)]">
                      {(resumeFile.size / 1024).toFixed(1)} KB · Ready
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-xs text-[var(--ink)] hover:underline flex items-center gap-1 transition-colors"
                      >
                        <ArrowCounterClockwise size={13} weight="bold" /> Replace
                      </button>
                      <span className="text-[var(--line)]">·</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="text-xs text-[var(--red)] hover:underline flex items-center gap-1 transition-colors"
                      >
                        <Trash size={13} weight="bold" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-10 h-10 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] mb-2 shadow-xs">
                      <UploadSimple size={20} weight="regular" />
                    </span>
                    <p className="text-sm font-medium text-[var(--ink)]">Upload resume file</p>
                    <p className="text-xs text-[var(--muted)]">Drag & drop or click to browse</p>
                    <span className="font-mono text-[10px] mt-2 px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)]">
                      PDF · DOCX · TXT
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="paste"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <div className="relative">
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your original resume text here…"
                  rows={7}
                  className="w-full p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] font-mono text-xs leading-relaxed resize-y min-h-[140px] focus:outline-none focus:border-[var(--ink)] transition-colors thin-scrollbar pr-20"
                />
                {resumeText && (
                  <button
                    type="button"
                    onClick={clearText}
                    className="absolute right-3 bottom-3 text-xs text-[var(--muted)] hover:text-[var(--red)] flex items-center gap-1 font-mono transition-colors"
                  >
                    <Trash size={12} weight="bold" /> Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STEP 2 — JOB DESCRIPTION */}
      <div className="border-t border-[var(--line)] pt-5">
        <div className="mb-3">
          <StepHeader step="2" title="Target Job Description" />
        </div>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the target job description or requirements here…"
          rows={7}
          className="w-full p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm leading-relaxed resize-y min-h-[140px] focus:outline-none focus:border-[var(--ink)] transition-colors thin-scrollbar"
        />
        <div className="flex justify-between items-center mt-2 font-mono text-[11px] text-[var(--muted)]">
          <span>Min 20 characters</span>
          <span>{jdText.trim().length} chars</span>
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3.5 px-4 rounded-xl font-sans text-sm font-semibold tracking-wide flex items-center justify-center gap-2 bg-[var(--ink)] text-[var(--paper)] hover:opacity-90 active:scale-[0.99] transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? (
          <>
            <ArrowCounterClockwise size={16} weight="bold" className="animate-spin" />
            <span>Analyzing & Optimizing…</span>
          </>
        ) : (
          <>
            <Sparkle size={16} weight="fill" />
            <span>Match & Tailor Resume</span>
            <ArrowRight size={15} weight="bold" />
          </>
        )}
      </button>

      <p className="text-center font-mono text-[11px] text-[var(--muted)] -mt-2">
        Engine: <span className="text-[var(--ink)] font-semibold">{PROVIDER_LABEL[provider]}</span>
        {" · "}
        <button
          type="button"
          onClick={onOpenSettings}
          className="underline underline-offset-2 hover:text-[var(--ink)] transition-colors"
        >
          configure
        </button>
      </p>
    </form>
  );
}