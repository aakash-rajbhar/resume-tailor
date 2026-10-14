"use client";

import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Download,
  RotateCcw,
  Check,
  FileText,
  AlertCircle,
  Eye,
  GitCompare,
  ChevronDown,
  Printer,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import type { TailoredResume } from "@/lib/types";

interface DocumentCanvasProps {
  tailored: TailoredResume;
  originalText?: string;
  downloading: boolean;
  singlePage?: boolean;
  onToggleSinglePage?: (single: boolean) => void;
  onDownloadDocx: () => void;
  onStartOver: () => void;
  onUpdateResume?: (updated: TailoredResume) => void;
}

type ViewMode = "tailored" | "diff" | "original";

export default function DocumentCanvas({
  tailored,
  originalText = "",
  downloading,
  singlePage = true,
  onToggleSinglePage,
  onDownloadDocx,
  onStartOver,
  onUpdateResume,
}: DocumentCanvasProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("tailored");
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "editing">("saved");
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [isSinglePage, setIsSinglePage] = useState(singlePage);

  // Local state for inline edits
  const [resumeData, setResumeData] = useState<TailoredResume>(tailored);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close download dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDownloadMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyText = async () => {
    const formatted = [
      resumeData.name,
      resumeData.contact,
      resumeData.title,
      "\nSUMMARY\n" + resumeData.summary,
      "\nSKILLS\n" +
        resumeData.skills.map((s) => `${s.label}: ${s.value}`).join("\n"),
      "\nEXPERIENCE\n" +
        resumeData.experience
          .map(
            (e) =>
              `${e.title} - ${e.company} (${e.dates})\n` +
              e.bullets.map((b) => `• ${b}`).join("\n"),
          )
          .join("\n\n"),
      "\nEDUCATION\n" +
        resumeData.education
          .map((ed) => `${ed.degree}, ${ed.school} (${ed.dates})`)
          .join("\n"),
    ].join("\n");

    const onSuccess = () => {
      setCopied(true);
      toast.success("Resume text copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formatted);
        onSuccess();
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch {
      // Fallback for blocked Clipboard API / non-secure contexts.
      try {
        const ta = document.createElement("textarea");
        ta.value = formatted;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        if (!ok) throw new Error("execCommand copy failed");
        onSuccess();
      } catch {
        toast.error("Couldn't copy automatically", {
          description:
            "Select the text in the document preview and copy it manually.",
        });
      }
    }
  };

  const handleDownloadPdf = async () => {
    try {
      // jsPDF is heavy — load it only when the user requests an export.
      const { generateResumePdf } = await import("@/lib/pdfBuilder");
      const doc = generateResumePdf(resumeData, { singlePage: isSinglePage });
      const filename = `${(resumeData.name || "Resume").replace(/\s+/g, "_")}_Tailored.pdf`;
      doc.save(filename);
      setDownloadMenuOpen(false);
      toast.success("PDF exported successfully", {
        description: isSinglePage
          ? "Formatted for strict 1-page layout"
          : "Multi-page layout exported",
      });
    } catch (err) {
      toast.error("Failed to generate PDF", {
        description: err instanceof Error ? err.message : "PDF export error",
      });
    }
  };

  const handlePrint = () => {
    setDownloadMenuOpen(false);
    window.print();
  };

  const handleSummaryChange = (newSummary: string) => {
    setSaveStatus("editing");
    const updated = { ...resumeData, summary: newSummary };
    setResumeData(updated);
    onUpdateResume?.(updated);
    setTimeout(() => setSaveStatus("saved"), 400);
  };

  const handleBulletChange = (
    expIdx: number,
    bulletIdx: number,
    newBullet: string,
  ) => {
    setSaveStatus("editing");
    const updated = {
      ...resumeData,
      experience: resumeData.experience.map((exp, i) =>
        i === expIdx
          ? {
              ...exp,
              bullets: exp.bullets.map((b, j) =>
                j === bulletIdx ? newBullet : b,
              ),
            }
          : exp,
      ),
    };
    setResumeData(updated);
    onUpdateResume?.(updated);
    setTimeout(() => setSaveStatus("saved"), 400);
  };

  const toggleSinglePageMode = () => {
    const next = !isSinglePage;
    setIsSinglePage(next);
    onToggleSinglePage?.(next);
    toast.info(
      next
        ? "Single-page constraint enabled"
        : "Standard multi-page view enabled",
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar — wraps instead of clipping so every control stays reachable on narrow screens */}
      <div className="p-2 sm:p-2.5 rounded-lg border border-line bg-surface flex flex-wrap items-center justify-between gap-2">
        {/* Left: View Mode Toggle Tabs */}
        <div className="flex p-0.5 rounded-lg bg-surface-2 border border-line max-w-full overflow-x-auto thin-scrollbar">
          <button
            type="button"
            onClick={() => setViewMode("tailored")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              viewMode === "tailored"
                ? "bg-surface text-ink shadow-xs font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            <FileText size={13} />
            <span>Tailored</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("diff")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              viewMode === "diff"
                ? "bg-surface text-ink shadow-xs font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            <GitCompare size={13} />
            <span>Diff</span>
          </button>
          {originalText && (
            <button
              type="button"
              onClick={() => setViewMode("original")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                viewMode === "original"
                  ? "bg-surface text-ink shadow-xs font-semibold"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Eye size={13} />
              <span>Original</span>
            </button>
          )}
        </div>

        {/* Right: Clean, Flush Action Buttons (Never Overflows) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyText}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-xs font-medium text-ink flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <Check size={13} className="text-green" />
            ) : (
              <Copy size={13} />
            )}
            <span className="hidden sm:inline">
              {copied ? "Copied" : "Copy"}
            </span>
          </button>

          {/* Download Dropdown Menu */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              disabled={downloading}
              className="px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              <Download size={13} />
              <span>{downloading ? "Exporting…" : "Download"}</span>
              <ChevronDown size={12} className="opacity-70" />
            </button>

            {downloadMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-line bg-surface shadow-float py-1.5 z-dropdown text-xs">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted border-b border-line flex items-center justify-between">
                  <span>Export Options</span>
                  <span className="text-green font-medium">
                    {isSinglePage ? "1-Page Active" : "Multi-Page"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full px-3 py-2 text-left hover:bg-surface-2 text-ink flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileDown size={14} className="text-accent" />
                    <div>
                      <p className="font-medium text-ink">Download PDF</p>
                      <p className="text-[10px] text-muted">
                        ATS vector format
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-green px-1.5 py-0.5 rounded bg-green-soft">
                    .pdf
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onDownloadDocx();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-surface-2 text-ink flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Download size={14} className="text-ink" />
                    <div>
                      <p className="font-medium text-ink">Download Word</p>
                      <p className="text-[10px] text-muted">
                        Editable DOCX format
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted px-1.5 py-0.5 rounded bg-surface-2">
                    .docx
                  </span>
                </button>

                <div className="my-1 border-t border-line" />

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full px-3 py-2 text-left hover:bg-surface-2 text-muted hover:text-ink flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer size={14} />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Reset / Start Over Button */}
          <button
            type="button"
            onClick={onStartOver}
            title="Start over with another resume or job"
            className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-muted hover:text-ink transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Realistic Document Desk Canvas */}
      <div className="rounded-2xl border border-line bg-surface-2/50 p-3 sm:p-6 lg:p-8 flex flex-col items-center overflow-x-auto">
        {/* Document Status Header Bar */}
        <div className="w-full max-w-[800px] mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted font-mono px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-sans font-medium text-ink">
              Document Preview
            </span>
            <span className="text-subtle">·</span>
            <span className="text-[11px] text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green" />
              <span>{saveStatus === "saved" ? "Autosaved" : "Saving…"}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 1-Page Layout Toggle Pill */}
            <button
              type="button"
              onClick={toggleSinglePageMode}
              className={`px-2 py-0.5 rounded-md border text-[11px] font-sans font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                isSinglePage
                  ? "border-green/40 bg-green-soft text-green"
                  : "border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isSinglePage ? "bg-green" : "bg-muted"}`}
              />
              <span>1-Page Layout: {isSinglePage ? "ON" : "OFF"}</span>
            </button>
            <span className="text-[11px] text-subtle">8.5 × 11 in</span>
          </div>
        </div>

        {/* The Authentic White Paper Sheet */}
        <div
          id="resume-paper-document"
          className="w-full max-w-[800px] bg-white text-neutral-900 border border-neutral-300 dark:border-neutral-700/80 rounded-xs shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.65)] p-8 sm:p-14 space-y-6 font-sans leading-relaxed text-left select-text print:p-0 print:border-none print:shadow-none"
        >
          {/* Candidate Header */}
          <div className="text-center pb-5 border-b border-neutral-200">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight !text-neutral-950 font-serif">
              {resumeData.name}
            </h1>
            <p className="text-xs !text-neutral-600 font-mono mt-1.5 flex flex-wrap justify-center gap-2">
              {resumeData.contact.split(" | ").map((chunk, i, arr) => (
                <span
                  key={`${chunk}-${i}`}
                  className="inline-flex items-center gap-2 max-w-full"
                >
                  <span className="break-all">{chunk}</span>
                  {i < arr.length - 1 && <span className="opacity-30">|</span>}
                </span>
              ))}
            </p>
            {resumeData.title && (
              <div className="mt-2.5">
                <span className="inline-block px-3 py-0.5 rounded text-xs font-mono font-semibold tracking-wide !bg-neutral-100 !text-neutral-800 border border-neutral-200">
                  {resumeData.title}
                </span>
              </div>
            )}
          </div>

          {/* View Mode: Original */}
          {viewMode === "original" && (
            <div className="whitespace-pre-wrap font-mono text-xs !text-neutral-800 leading-relaxed max-h-[600px] overflow-y-auto">
              {originalText || "No original text available."}
            </div>
          )}

          {/* View Mode: Tailored or Diff */}
          {viewMode !== "original" && (
            <>
              {/* Professional Summary */}
              {resumeData.summary && (
                <section className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-widest !text-neutral-900 border-b border-neutral-300 pb-1 font-mono">
                    Professional Summary
                  </h2>
                  {viewMode === "diff" ? (
                    <div className="text-xs leading-relaxed !text-emerald-950 p-2.5 rounded !bg-emerald-50 border border-emerald-300">
                      <span className="font-mono text-[10px] font-bold uppercase mr-1 text-emerald-800">
                        [Tailored]
                      </span>
                      {resumeData.summary}
                    </div>
                  ) : (
                    <textarea
                      value={resumeData.summary}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      rows={isSinglePage ? 2 : 3}
                      className="w-full p-2 -mx-2 rounded-md hover:!bg-neutral-100/70 focus:!bg-white text-xs leading-relaxed !text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-y transition-colors font-sans"
                    />
                  )}
                </section>
              )}

              {/* Technical Skills */}
              {resumeData.skills && resumeData.skills.length > 0 && (
                <section className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-widest !text-neutral-900 border-b border-neutral-300 pb-1 font-mono">
                    Technical Skills & Competencies
                  </h2>
                  <div className="grid gap-1 text-xs">
                    {resumeData.skills.map((skill, idx) => (
                      <div
                        key={`${skill.label}-${idx}`}
                        className="grid grid-cols-[130px_1fr] gap-3"
                      >
                        <span className="font-mono font-bold !text-neutral-800">
                          {skill.label}:
                        </span>
                        <span className="!text-neutral-800 break-words min-w-0">
                          {skill.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Work Experience */}
              {resumeData.experience && resumeData.experience.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest !text-neutral-900 border-b border-neutral-300 pb-1 font-mono">
                    Professional Experience
                  </h2>
                  <div className="space-y-4">
                    {resumeData.experience.map((exp, expIdx) => {
                      const bullets = isSinglePage
                        ? exp.bullets.slice(0, 4)
                        : exp.bullets;
                      return (
                        <div key={expIdx} className="space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                            <div className="text-xs font-bold !text-neutral-950">
                              {exp.title}{" "}
                              <span className="font-normal text-neutral-400">
                                —
                              </span>{" "}
                              <span className="font-semibold !text-neutral-800">
                                {exp.company}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono !text-neutral-600">
                              {exp.location} | {exp.dates}
                            </div>
                          </div>

                          <ul className="space-y-1 text-xs !text-neutral-800 pl-4 list-disc">
                            {bullets.map((bullet, bulletIdx) => (
                              <li key={bulletIdx}>
                                {viewMode === "diff" ? (
                                  <span className="inline-block p-1 rounded !bg-emerald-50 !text-emerald-950 border border-emerald-300">
                                    <span className="font-mono text-[9px] font-bold mr-1 text-emerald-800">
                                      [AI Aligned]
                                    </span>
                                    {bullet}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) =>
                                      handleBulletChange(
                                        expIdx,
                                        bulletIdx,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-1.5 py-0.5 -mx-1.5 rounded hover:!bg-neutral-100/70 focus:!bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 text-xs !text-neutral-800 transition-colors font-sans"
                                  />
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Projects */}
              {resumeData.projects && resumeData.projects.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest !text-neutral-900 border-b border-neutral-300 pb-1 font-mono">
                    Key Projects
                  </h2>
                  <div className="space-y-2.5">
                    {resumeData.projects.map((proj, pIdx) => {
                      const pBullets = isSinglePage
                        ? proj.bullets.slice(0, 2)
                        : proj.bullets;
                      return (
                        <div key={pIdx} className="space-y-0.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-bold !text-neutral-950">
                              {proj.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded !bg-neutral-100 !text-neutral-700 border border-neutral-200">
                              {proj.tools}
                            </span>
                          </div>
                          <ul className="space-y-0.5 text-xs !text-neutral-800 pl-4 list-disc">
                            {pBullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Education */}
              {resumeData.education && resumeData.education.length > 0 && (
                <section className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-widest !text-neutral-900 border-b border-neutral-300 pb-1 font-mono">
                    Education
                  </h2>
                  <div className="space-y-1.5">
                    {resumeData.education.map((edu, eIdx) => (
                      <div
                        key={eIdx}
                        className="flex items-baseline justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold !text-neutral-950">
                            {edu.school}
                          </span>
                          <span className="!text-neutral-700 ml-2">
                            {edu.degree}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] !text-neutral-600">
                          {edu.dates}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Certifications */}
              {resumeData.certifications &&
                resumeData.certifications.length > 0 && (
                  <section className="space-y-1.5">
                    <h2 className="text-xs font-bold uppercase tracking-widest !text-neutral-900 border-b border-neutral-300 pb-1 font-mono">
                      Certifications
                    </h2>
                    <div className="flex flex-wrap gap-1.5 text-xs font-mono !text-neutral-800">
                      {resumeData.certifications.map((cert, idx) => (
                        <span
                          key={`${cert}-${idx}`}
                          className="px-2 py-0.5 rounded !bg-neutral-100 !text-neutral-800 border border-neutral-200 break-words"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
            </>
          )}
        </div>
      </div>

      {/* Trust & Review Footnote */}
      <div className="p-3 rounded-xl border border-line bg-surface text-xs text-muted flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <AlertCircle size={14} className="text-subtle shrink-0" />
          <span>
            All text in the document sheet is editable. Click any bullet point
            or summary to refine.
          </span>
        </span>
        <span className="hidden sm:inline-flex font-mono text-[11px] text-subtle">
          ATS-Verified
        </span>
      </div>
    </div>
  );
}
