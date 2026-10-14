"use client";

import { UploadCloud, FileText, CheckCircle2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import OrbitalSphereBackground from "@/components/ui/orbital-sphere";

interface LandingHeroProps {
  onStart: () => void;
}

export default function LandingHero({ onStart }: LandingHeroProps) {
  return (
    <div className="space-y-12 py-4 sm:py-6">
      {/* Hero Header with Orbital Sphere in Background */}
      <div className="relative rounded-3xl border border-[var(--line)] bg-[var(--surface)]/70 backdrop-blur-md overflow-hidden py-14 sm:py-20 px-6 sm:px-12 text-center shadow-xs">
        {/* Orbital Sphere Background Layer */}
        <OrbitalSphereBackground className="absolute inset-0 w-full h-full opacity-60 dark:opacity-80" />

        {/* Soft radial overlay to ensure crystal clear text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--surface)]/40 to-[var(--surface)]/90 pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)]/90 backdrop-blur-sm border border-[var(--line)] text-xs font-medium text-[var(--muted)]">
            <Sparkles size={13} className="text-[var(--accent)]" />
            <span>Intelligent Career Assistant</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] leading-[1.15]">
            Tailor your resume to any job in seconds.
          </h1>

          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-xl mx-auto">
            Upload your resume and paste the job posting. Get an honest ATS gap report and an aligned single-page rewrite with zero invented experience.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Tailor my resume</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 3-Step "How it works" Row */}
      <div id="how-it-works" className="grid sm:grid-cols-3 gap-4 w-full">
        <div className="paper-card p-5 space-y-2.5 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)]">
            <UploadCloud size={16} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--ink)]">1. Upload your resume</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Drag & drop your PDF, DOCX, or paste your work history and technical skills.
          </p>
        </div>

        <div className="paper-card p-5 space-y-2.5 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)]">
            <FileText size={16} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--ink)]">2. Paste job description</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Add the target job requirements, qualifications, and role responsibilities.
          </p>
        </div>

        <div className="paper-card p-5 space-y-2.5 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)]">
            <CheckCircle2 size={16} className="text-[var(--green)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--ink)]">3. Review & export</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Inspect matched keywords, review rewritten bullets, and download a .docx file.
          </p>
        </div>
      </div>

      {/* Trust Strip */}
      <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/40 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[var(--green)] flex-shrink-0" />
          <span>Your data is never stored without permission. API keys stay in your browser.</span>
        </div>
        <span className="font-mono text-[11px] text-[var(--subtle)]">Client-side privacy</span>
      </div>
    </div>
  );
}
