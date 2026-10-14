"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface Step1ResumeProps {
  mode: "upload" | "paste";
  onChangeMode: (mode: "upload" | "paste") => void;
  file: File | null;
  onSelectFile: (file: File | null) => void;
  text: string;
  onChangeText: (text: string) => void;
  onNext: () => void;
}

export default function Step1Resume({
  mode,
  onChangeMode,
  file,
  onSelectFile,
  text,
  onChangeText,
  onNext,
}: Step1ResumeProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      setErrorMessage(null);
      if (rejectedFiles && rejectedFiles.length > 0) {
        setErrorMessage("Please upload a supported format (.pdf, .docx, .txt) under 10MB.");
        return;
      }
      if (acceptedFiles && acceptedFiles[0]) {
        const selected = acceptedFiles[0];
        onSelectFile(selected);
      }
    },
    [onSelectFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const hasValidResume = mode === "upload" ? !!file : text.trim().length >= 30;

  return (
    <div className="paper-card p-6 sm:p-8 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Step 1: Add your resume
          </h2>
          <p className="text-xs text-muted mt-1">
            Upload your existing PDF, DOCX, or paste the text directly.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex p-0.5 rounded-lg bg-surface-2 border border-line self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              onChangeMode("upload");
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "upload"
                ? "bg-surface text-ink shadow-xs font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              onChangeMode("paste");
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "paste"
                ? "bg-surface text-ink shadow-xs font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <div className="space-y-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-accent bg-accent-soft scale-[0.99]"
                  : "border-line bg-surface-2/30 hover:bg-surface-2/60 hover:border-line-strong"
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-12 h-12 rounded-xl bg-surface border border-line flex items-center justify-center text-muted mb-3 shadow-xs">
                <UploadCloud size={24} className={isDragActive ? "text-accent" : ""} />
              </div>
              <p className="text-sm font-semibold text-ink">
                {isDragActive ? "Drop your resume here" : "Drag and drop your resume file"}
              </p>
              <p className="text-xs text-muted mt-1">
                or click to browse your computer
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-subtle bg-surface px-2.5 py-1 rounded-md border border-line">
                PDF · DOCX · TXT (up to 10MB)
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-green-border bg-green-soft/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface border border-green-border flex items-center justify-center text-green flex-shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate max-w-sm">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted font-mono">
                    {(file.size / 1024).toFixed(1)} KB · Ready to analyze
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => onSelectFile(null)}
                  className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-xs text-muted hover:text-danger hover:border-danger-border transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-lg border border-danger-border bg-danger-soft text-xs text-danger flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Paste text mode */}
      {mode === "paste" && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => {
                setErrorMessage(null);
                onChangeText(e.target.value);
              }}
              placeholder="Paste your complete resume text here (Summary, Experience, Skills, Education)…"
              rows={10}
              className="w-full p-4 rounded-xl border border-line bg-surface text-sm leading-relaxed font-mono resize-y min-h-[200px] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            {text.length > 0 && (
              <button
                type="button"
                onClick={() => onChangeText("")}
                className="absolute right-3 bottom-3 text-xs text-muted hover:text-danger flex items-center gap-1 font-mono transition-colors bg-surface px-2 py-1 rounded border border-line"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted font-mono">
            <span>Minimum 30 characters</span>
            <span>{text.trim().length} chars · {text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
          </div>

          {text.trim().length > 0 && text.trim().length < 30 && (
            <p className="text-xs text-warning flex items-center gap-1">
              <AlertCircle size={13} />
              <span>Resume looks too brief. Paste your full work experience and skills.</span>
            </p>
          )}
        </div>
      )}

      {/* Collapsible extracted preview (if text is provided or extracted) */}
      {text.trim().length > 0 && mode === "upload" && (
        <div className="border border-line rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExtractedPreview(!showExtractedPreview)}
            className="w-full px-4 py-2.5 bg-surface-2/50 hover:bg-surface-2 text-xs font-medium text-muted flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-1.5 text-ink">
              <FileText size={14} />
              <span>Verify Extracted Content</span>
            </span>
            {showExtractedPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showExtractedPreview && (
            <div className="p-4 bg-surface max-h-56 overflow-y-auto text-xs font-mono text-ink whitespace-pre-wrap leading-relaxed border-t border-line">
              {text}
            </div>
          )}
        </div>
      )}

      {/* Navigation action */}
      <div className="pt-4 border-t border-line flex items-center justify-between">
        <span className="text-xs text-muted font-mono">
          {hasValidResume ? "Resume ready" : "Please provide your resume to continue"}
        </span>
        <button
          type="button"
          disabled={!hasValidResume}
          onClick={onNext}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-accent hover:bg-accent-hover text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continue to Job Description</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
