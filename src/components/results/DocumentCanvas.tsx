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
}: DocumentCanvasProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("tailored");
  const [copied, setCopied] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [isSinglePage, setIsSinglePage] = useState(singlePage);

  const resumeData = tailored;
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
    <div className="space-y-3">
      {/* Toolbar */}
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

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
          {/* 1-Page Toggle */}
          <button
            type="button"
            onClick={toggleSinglePageMode}
            className={`px-2 py-1 rounded-md border text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isSinglePage
                ? "border-green/40 bg-green-soft text-green"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isSinglePage ? "bg-green" : "bg-muted"}`}
            />
            <span>1-Page</span>
          </button>

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

          {/* Download Dropdown */}
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

          {/* Start Over Button */}
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

      {/* Document Preview Shell — looks like a real PDF/paper on a desk */}
      <div className="rounded-xl border border-line bg-neutral-200 dark:bg-neutral-800 p-4 sm:p-6 flex flex-col items-center overflow-x-auto">
        {/* Paper size label */}
        <div className="w-full max-w-[820px] mb-2 flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 px-1">
          <span>Resume Preview · 8.5 × 11 in</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Read-only preview
          </span>
        </div>

        {/* The Paper Sheet — styled to look like an actual document */}
        <div
          id="resume-paper-document"
          className="w-full max-w-[820px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15),0_8px_32px_rgba(0,0,0,0.10)] select-text print:shadow-none"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: "10.5pt",
            lineHeight: "1.4",
            color: "#000",
            padding: "0.5in 0.5in 0.5in 0.5in",
          }}
        >
          {/* ── ORIGINAL TEXT VIEW ── */}
          {viewMode === "original" && (
            <pre
              style={{
                fontFamily: "monospace",
                fontSize: "9pt",
                whiteSpace: "pre-wrap",
                color: "#222",
                lineHeight: "1.5",
              }}
            >
              {originalText || "No original text available."}
            </pre>
          )}

          {/* ── TAILORED / DIFF VIEW ── */}
          {viewMode !== "original" && (
            <>
              {/* ── CANDIDATE HEADER ── */}
              <div style={{ textAlign: "center", marginBottom: "4px" }}>
                <div
                  style={{
                    fontSize: "20pt",
                    fontWeight: "bold",
                    letterSpacing: "0.02em",
                    lineHeight: "1.15",
                    color: "#000",
                  }}
                >
                  {resumeData.name}
                </div>

                {resumeData.contact && (
                  <div
                    style={{
                      fontSize: "9.5pt",
                      color: "#444",
                      marginTop: "4px",
                      lineHeight: "1.5",
                    }}
                  >
                    {resumeData.contact.split(" | ").map((chunk, i, arr) => (
                      <span key={i}>
                        {chunk}
                        {i < arr.length - 1 && (
                          <span style={{ color: "#aaa", margin: "0 4px" }}>
                            |
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {resumeData.title && (
                  <div
                    style={{
                      fontSize: "10pt",
                      color: "#333",
                      marginTop: "3px",
                      fontStyle: "italic",
                    }}
                  >
                    {resumeData.title}
                  </div>
                )}
              </div>

              {/* ── PROFESSIONAL SUMMARY ── */}
              {resumeData.summary && (
                <div style={{ marginTop: "8px" }}>
                  <SectionHeading label="Summary" isDiff={viewMode === "diff"} />
                  <p
                    style={{
                      fontSize: "10pt",
                      color: viewMode === "diff" ? "#065f46" : "#111",
                      lineHeight: "1.5",
                      marginTop: "4px",
                      background: viewMode === "diff" ? "#ecfdf5" : "none",
                      padding: viewMode === "diff" ? "3px 4px" : "0",
                      borderRadius: "2px",
                    }}
                  >
                    {resumeData.summary}
                  </p>
                </div>
              )}

              {/* ── EDUCATION ── */}
              {resumeData.education && resumeData.education.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <SectionHeading label="Education" isDiff={viewMode === "diff"} />
                  {resumeData.education.map((edu, i) => (
                    <div key={i} style={{ marginTop: "4px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "10pt",
                            color: "#000",
                          }}
                        >
                          {edu.school}
                        </span>
                        <span style={{ fontSize: "9pt", color: "#555" }}>
                          {edu.dates}
                        </span>
                      </div>
                      <div style={{ fontSize: "9.5pt", color: "#333", fontStyle: "italic" }}>
                        {edu.degree}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TECHNICAL SKILLS ── */}
              {resumeData.skills && resumeData.skills.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <SectionHeading
                    label="Technical Skills"
                    isDiff={viewMode === "diff"}
                  />
                  <div style={{ marginTop: "3px" }}>
                    {resumeData.skills.map((skill, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: "10pt",
                          lineHeight: "1.6",
                          color: "#111",
                          display: "flex",
                          gap: "4px",
                        }}
                      >
                        <span style={{ fontWeight: "bold", flexShrink: 0 }}>
                          {skill.label}:
                        </span>
                        <span style={{ color: "#222" }}>{skill.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PROFESSIONAL EXPERIENCE ── */}
              {resumeData.experience && resumeData.experience.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <SectionHeading
                    label="Experience"
                    isDiff={viewMode === "diff"}
                  />
                  {resumeData.experience.map((exp, expIdx) => {
                    const bullets = isSinglePage
                      ? exp.bullets.slice(0, 4)
                      : exp.bullets;
                    return (
                      <div key={expIdx} style={{ marginTop: "5px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "bold",
                              fontSize: "10.5pt",
                              color: "#000",
                            }}
                          >
                            {exp.title}
                          </span>
                          <span
                            style={{
                              fontSize: "9pt",
                              color: "#555",
                              fontStyle: "italic",
                              flexShrink: 0,
                              marginLeft: "8px",
                            }}
                          >
                            {exp.dates}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            marginTop: "1px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10pt",
                              fontStyle: "italic",
                              color: "#333",
                            }}
                          >
                            {exp.company}
                          </span>
                          {exp.location && (
                            <span
                              style={{
                                fontSize: "9.5pt",
                                color: "#666",
                                flexShrink: 0,
                                marginLeft: "8px",
                              }}
                            >
                              {exp.location}
                            </span>
                          )}
                        </div>
                        <ul
                          style={{
                            marginTop: "3px",
                            paddingLeft: "14px",
                            listStyleType: "disc",
                          }}
                        >
                          {bullets.map((bullet, bulletIdx) => (
                            <li
                              key={bulletIdx}
                              style={{
                                fontSize: "10pt",
                                lineHeight: "1.5",
                                color:
                                  viewMode === "diff" ? "#065f46" : "#111",
                                background:
                                  viewMode === "diff" ? "#ecfdf5" : "none",
                                borderRadius: "2px",
                                marginBottom: "1px",
                              }}
                            >
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── PROJECTS ── */}
              {resumeData.projects && resumeData.projects.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <SectionHeading
                    label="Projects"
                    isDiff={viewMode === "diff"}
                  />
                  {resumeData.projects.map((proj, pIdx) => {
                    const pBullets = isSinglePage
                      ? proj.bullets.slice(0, 3)
                      : proj.bullets;
                    return (
                      <div key={pIdx} style={{ marginTop: "5px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "bold",
                              fontSize: "10pt",
                              color: "#000",
                            }}
                          >
                            {proj.name}
                          </span>
                          {proj.tools && (
                            <span
                              style={{
                                fontSize: "9pt",
                                fontStyle: "italic",
                                color: "#555",
                                flexShrink: 0,
                                marginLeft: "8px",
                              }}
                            >
                              {proj.tools}
                            </span>
                          )}
                        </div>
                        <ul
                          style={{
                            marginTop: "2px",
                            paddingLeft: "14px",
                            listStyleType: "disc",
                          }}
                        >
                          {pBullets.map((b, bIdx) => (
                            <li
                              key={bIdx}
                              style={{
                                fontSize: "9.5pt",
                                lineHeight: "1.45",
                                color:
                                  viewMode === "diff" ? "#065f46" : "#111",
                                background:
                                  viewMode === "diff" ? "#ecfdf5" : "none",
                                borderRadius: "2px",
                                marginBottom: "1px",
                              }}
                            >
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── CERTIFICATIONS ── */}
              {resumeData.certifications &&
                resumeData.certifications.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <SectionHeading
                      label="Certifications"
                      isDiff={viewMode === "diff"}
                    />
                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "9.5pt",
                        color: "#111",
                        lineHeight: "1.5",
                      }}
                    >
                      {resumeData.certifications.join("   ·   ")}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* Footnote */}
      <div className="p-3 rounded-xl border border-line bg-surface text-xs text-muted flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <AlertCircle size={14} className="text-subtle shrink-0" />
          <span>
            Preview reflects the actual exported PDF layout. Download to get
            the final file.
          </span>
        </span>
        <span className="hidden sm:inline-flex font-mono text-[11px] text-subtle">
          ATS-Verified
        </span>
      </div>
    </div>
  );
}

/** Jake Ryan-style section heading: bold label + full-width horizontal rule */
function SectionHeading({
  label,
  isDiff,
}: {
  label: string;
  isDiff: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        borderBottom: "1px solid #333",
        paddingBottom: "1px",
        marginBottom: "2px",
      }}
    >
      <span
        style={{
          fontSize: "10.5pt",
          fontWeight: "bold",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: isDiff ? "#065f46" : "#000",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}
