"use client";

import dynamic from "next/dynamic";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";

// Decorative WebGL background: load after hydration so three.js never blocks first paint.
const OrbitalSphereBackground = dynamic(
  () => import("@/components/ui/orbital-sphere"),
  { ssr: false, loading: () => null },
);

interface LandingHeroProps {
  onStart: () => void;
}

export default function LandingHero({ onStart }: LandingHeroProps) {
  return (
    <div className="space-y-12 py-4 sm:py-6">
      {/* Hero Header with Orbital Sphere in Background */}
      <div className="paper-card relative overflow-hidden py-16 sm:py-24 px-6 sm:px-12 text-center">
        {/* Orbital Sphere Background Layer (authored ThreeUI renderer) */}
        <OrbitalSphereBackground
          className="absolute inset-0 w-full h-full"
          speed={2.43}
          particleSize={0.025}
          particleOpacity={0.85}
          orbitOpacity={0.35}
          hue={0}
          scale={1.2}
          haloOpacity={0.25}
        />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs font-medium text-muted">
            <Sparkles size={13} className="text-accent" />
            <span>Intelligent Career Assistant</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.15]">
            Tailor your resume to any job in seconds.
          </h1>

          <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl mx-auto">
            Upload your resume and paste the job posting. Get an honest ATS gap
            report and an aligned single-page rewrite with zero invented
            experience.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onStart}
              icon={<ArrowRight size={15} />}
            >
              Tailor my resume
            </Button>
          </div>
        </div>
      </div>

      {/* 3-Step "How it works" Row */}
      <div id="how-it-works" className="grid sm:grid-cols-3 gap-4 w-full">
        <div className="paper-card p-5 space-y-2.5 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-ink">
            <UploadCloud size={16} />
          </div>
          <h3 className="text-sm font-semibold text-ink">
            1. Upload your resume
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Drag & drop your PDF, DOCX, or paste your work history and technical
            skills.
          </p>
        </div>

        <div className="paper-card p-5 space-y-2.5 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-ink">
            <FileText size={16} />
          </div>
          <h3 className="text-sm font-semibold text-ink">
            2. Paste job description
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Add the target job requirements, qualifications, and role
            responsibilities.
          </p>
        </div>

        <div className="paper-card p-5 space-y-2.5 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-ink">
            <CheckCircle2 size={16} className="text-green" />
          </div>
          <h3 className="text-sm font-semibold text-ink">3. Review & export</h3>
          <p className="text-xs text-muted leading-relaxed">
            Inspect matched keywords, review rewritten bullets, and download a
            .docx file.
          </p>
        </div>
      </div>

      {/* Trust Strip */}
      <div className="p-4 rounded-xl border border-line bg-surface-2/40 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-green shrink-0" />
          <span>
            Your data is never stored without permission. API keys stay in your
            browser.
          </span>
        </div>
        <span className="font-mono text-[11px] text-subtle">
          Client-side privacy
        </span>
      </div>
    </div>
  );
}
