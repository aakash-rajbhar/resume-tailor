"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowLeft,
  ClipboardPaste,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Sliders,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Step2JobProps {
  jdText: string;
  onChangeJdText: (text: string) => void;
  additionalPrompt?: string;
  onChangeAdditionalPrompt?: (prompt: string) => void;
  singlePage?: boolean;
  onChangeSinglePage?: (singlePage: boolean) => void;
  jobTitle?: string;
  onChangeJobTitle?: (title: string) => void;
  company?: string;
  onChangeCompany?: (company: string) => void;
  focusTone?: string;
  onChangeFocusTone?: (tone: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}

const TONE_PRESETS = [
  { id: "ats", label: "ATS-Optimized", desc: "Matches exact keywords & phrasing" },
  { id: "impact", label: "Impact-Driven", desc: "Emphasizes metrics & accomplishments" },
  { id: "concise", label: "Concise", desc: "Crisp, tight single-page wording" },
];

export default function Step2Job({
  jdText,
  onChangeJdText,
  additionalPrompt = "",
  onChangeAdditionalPrompt,
  singlePage = true,
  onChangeSinglePage,
  jobTitle = "",
  onChangeJobTitle,
  company = "",
  onChangeCompany,
  focusTone = "ats",
  onChangeFocusTone,
  onBack,
  onSubmit,
  loading,
}: Step2JobProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (jdText.trim().length >= 30 && !loading) {
          e.preventDefault();
          onSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jdText, loading, onSubmit]);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeJdText(text);
        toast.success("Pasted from clipboard");
      }
    } catch {
      toast.error("Clipboard permission denied. Please paste manually.");
    }
  };

  const words = jdText.trim() ? jdText.trim().split(/\s+/).length : 0;
  const chars = jdText.trim().length;
  const isValid = chars >= 30 && !loading;

  return (
    <div className="paper-card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Step 2: Add the job description
          </h2>
          <p className="text-xs text-muted mt-1">
            Paste the requirements or job posting to calculate gaps and rewrite your resume.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePasteClipboard}
          className="px-3 py-1.5 rounded-lg border border-line bg-surface-2/60 hover:bg-surface-2 text-xs font-medium text-ink flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <ClipboardPaste size={14} className="text-accent" />
          <span>Paste from clipboard</span>
        </button>
      </div>

      {/* Main Textarea */}
      <div className="space-y-2">
        <textarea
          value={jdText}
          onChange={(e) => onChangeJdText(e.target.value)}
          placeholder="Paste the full job description, role requirements, and responsibilities here…"
          rows={9}
          className="w-full p-4 rounded-xl border border-line bg-surface text-sm leading-relaxed resize-y min-h-[180px] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-sans"
        />

        <div className="flex items-center justify-between text-xs text-muted font-mono">
          <span>Min 30 characters</span>
          <span>
            {chars} characters · {words} words
          </span>
        </div>

        {chars > 0 && chars < 30 && (
          <p className="text-xs text-warning flex items-center gap-1.5 pt-1">
            <AlertCircle size={13} />
            <span>Job description looks too short for a reliable gap analysis. Add more requirements.</span>
          </p>
        )}
      </div>

      {/* Additional Instructions for AI */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-ink flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent" />
            <span>Additional AI instructions (Optional)</span>
          </span>
          <span className="text-[10px] text-muted font-mono">Custom instructions</span>
        </label>
        <input
          type="text"
          value={additionalPrompt}
          onChange={(e) => onChangeAdditionalPrompt?.(e.target.value)}
          placeholder="e.g. Highlight cloud architecture & leadership, keep bullet wording crisp, prioritize Python experience..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-subtle focus:outline-none focus:border-accent transition-all font-sans"
        />
      </div>

      {/* Single-Page Limit Switch */}
      <div className="p-3.5 rounded-xl border border-line bg-surface-2/30 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink">Limit resume to a single page</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-green-soft text-green border border-green-border font-medium">
              Recommended
            </span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            Automatically tightens word count, bullet lengths, and document spacing so your resume strictly fits on 1 page when exported.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={singlePage}
          onClick={() => onChangeSinglePage?.(!singlePage)}
          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
            singlePage ? "bg-accent" : "bg-line-strong"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
              singlePage ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Progressive Disclosure 1: Add Details (Job title & company) */}
      <div className="border border-line rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-4 py-2.5 bg-surface-2/40 hover:bg-surface-2 text-xs font-medium text-muted flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2 text-ink">
            <Briefcase size={14} />
            <span>Optional role metadata (Job title, Company)</span>
          </span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="p-4 bg-surface border-t border-line grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Target Job Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => onChangeJobTitle?.(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent transition-colors"
                />
                <Briefcase size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={company}
                  onChange={(e) => onChangeCompany?.(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent transition-colors"
                />
                <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progressive Disclosure 2: Preferences (Tone/Focus) */}
      <div className="border border-line rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPreferences(!showPreferences)}
          className="w-full px-4 py-2.5 bg-surface-2/40 hover:bg-surface-2 text-xs font-medium text-muted flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2 text-ink">
            <Sliders size={14} />
            <span>Tailoring style preferences</span>
          </span>
          {showPreferences ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showPreferences && (
          <div className="p-4 bg-surface border-t border-line space-y-3">
            <p className="text-xs text-muted">
              Choose the emphasis of the rewrite bullet points:
            </p>
            <div className="grid sm:grid-cols-3 gap-2">
              {TONE_PRESETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeFocusTone?.(t.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    focusTone === t.id
                      ? "border-accent bg-accent-soft text-ink"
                      : "border-line bg-surface text-muted hover:border-line-strong"
                  }`}
                >
                  <p className="text-xs font-semibold text-ink">{t.label}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-line flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-xs font-medium text-ink transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex text-[11px] font-mono text-muted">
            Press <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-line text-[10px]">⌘ Enter</kbd> to tailor
          </span>
          <button
            type="button"
            disabled={!isValid}
            onClick={onSubmit}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-accent hover:bg-accent-hover text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles size={15} />
            <span>Analyze & tailor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
