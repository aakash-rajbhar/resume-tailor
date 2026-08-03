"use client";

import { useState } from "react";
import type { TailoredResume } from "@/lib/types";

type ResumeTheme = "vermilion" | "forest" | "indigo" | "ink";

const THEMES: Record<
  ResumeTheme,
  { label: string; primary: string; border: string; bg: string; font: string }
> = {
  vermilion: {
    label: "Vermilion",
    primary: "#b3441f",
    border: "border-[#b3441f]",
    bg: "rgba(179, 68, 31, 0.06)",
    font: "font-display",
  },
  forest: {
    label: "Forest",
    primary: "#2f7d58",
    border: "border-[#2f7d58]",
    bg: "rgba(47, 125, 88, 0.06)",
    font: "font-sans",
  },
  indigo: {
    label: "Indigo",
    primary: "#3b4f8f",
    border: "border-[#3b4f8f]",
    bg: "rgba(59, 79, 143, 0.06)",
    font: "font-display",
  },
  ink: {
    label: "Ink",
    primary: "#232323",
    border: "border-[#232323]",
    bg: "rgba(35, 35, 35, 0.06)",
    font: "font-mono",
  },
};

function SectionTitle({ title, color, font }: { title: string; color: string; font: string }) {
  return (
    <h3
      className={`text-[11px] tracking-[0.2em] uppercase font-bold border-b border-slate-200 pb-1 mb-2.5 ${font}`}
      style={{ color }}
    >
      {title}
    </h3>
  );
}

export default function DocumentPreview({ result }: { result: TailoredResume }) {
  const [themeKey, setThemeKey] = useState<ResumeTheme>("vermilion");
  const theme = THEMES[themeKey];

  return (
    <div className="flex flex-col gap-4">
      {/* Preset switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="overline text-[var(--muted)] mr-1">Preset:</span>
        {(Object.keys(THEMES) as ResumeTheme[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setThemeKey(t)}
            className={`px-3 py-1 text-xs rounded-lg font-mono capitalize transition-all border ${
              themeKey === t
                ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-semibold shadow-sm"
                : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--muted)]"
            }`}
          >
            {THEMES[t].label}
          </button>
        ))}
      </div>

      {/* The sheet */}
      <div className="relative rounded-lg overflow-hidden bg-white border border-[var(--line)] shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <div className="h-2 w-full bg-[var(--ink)] opacity-5" />

        <div className={`p-8 sm:p-12 leading-relaxed text-left text-slate-800 ${theme.font}`}>
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-5 mb-5">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
              {result.name}
            </h2>
            <p className="font-mono text-[11px] tracking-wide text-slate-500 mt-2 flex flex-wrap justify-center gap-2 items-center">
              {result.contact.split(" | ").map((chunk, i, arr) => (
                <span key={chunk} className="flex items-center gap-1.5">
                  <span>{chunk}</span>
                  {i < arr.length - 1 && <span className="opacity-40">|</span>}
                </span>
              ))}
            </p>
            <span
              className={`inline-block mt-4 text-xs font-mono px-3 py-1 rounded tracking-wide border ${theme.border} ${theme.bg}`}
              style={{ color: theme.primary }}
            >
              {result.title}
            </span>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <SectionTitle title="Professional Summary" color={theme.primary} font="font-mono" />
            <p className="text-sm text-slate-700 leading-relaxed font-sans">{result.summary}</p>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <SectionTitle title="Technical Skills" color={theme.primary} font="font-mono" />
            <div className="grid gap-2 text-sm">
              {result.skills.map((s) => (
                <div key={s.label} className="grid grid-cols-[110px_1fr] gap-4">
                  <span className="font-mono text-[11px] font-bold text-slate-600">{s.label}:</span>
                  <span className="text-slate-700 font-sans">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="mb-6">
            <SectionTitle title="Experience" color={theme.primary} font="font-mono" />
            <div className="space-y-5">
              {result.experience.map((job, i) => (
                <div key={i}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1.5">
                    <h4 className="text-sm font-bold text-slate-950 font-sans">
                      {job.title} <span className="font-normal text-slate-400">—</span>{" "}
                      <span className="font-semibold text-slate-800">{job.company}</span>
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>{job.location}</span>
                      <span>|</span>
                      <span className="font-semibold text-slate-500">{job.dates}</span>
                    </div>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-4 text-sm text-slate-700 leading-relaxed font-sans">
                    {job.bullets.map((b, j) => (
                      <li key={j} className="hover:text-slate-950 transition-colors">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          {result.projects?.length > 0 && (
            <div className="mb-6">
              <SectionTitle title="Projects" color={theme.primary} font="font-mono" />
              <div className="space-y-4">
                {result.projects.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-1 mb-1.5">
                      <h4 className="text-sm font-bold text-slate-950 font-sans">{p.name}</h4>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider font-semibold border border-slate-200">
                        {p.tools}
                      </span>
                    </div>
                    <ul className="space-y-1.5 list-disc pl-4 text-sm text-slate-700 leading-relaxed font-sans">
                      {p.bullets.map((b, j) => (
                        <li key={j} className="hover:text-slate-950 transition-colors">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          <div className="mb-6">
            <SectionTitle title="Education" color={theme.primary} font="font-mono" />
            <div className="space-y-3">
              {result.education.map((e, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div>
                    <span className="text-sm font-bold text-slate-950">{e.school}</span>
                    <p className="text-sm text-slate-600 font-sans mt-0.5">{e.degree}</p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">{e.dates}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          {result.certifications?.length > 0 && (
            <div>
              <SectionTitle title="Certifications" color={theme.primary} font="font-mono" />
              <p className="font-mono text-sm text-slate-600 flex flex-wrap gap-2.5 font-medium leading-relaxed">
                {result.certifications.map((cert, index, arr) => (
                  <span key={cert} className="flex items-center gap-2">
                    <span>{cert}</span>
                    {index < arr.length - 1 && <span className="opacity-30">•</span>}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
