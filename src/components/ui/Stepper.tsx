"use client";

import { Check } from "lucide-react";

export type FlowStep = 1 | 2 | 3;

interface StepperProps {
  currentStep: FlowStep;
  onSelectStep?: (step: FlowStep) => void;
  canNavigateToStep?: (step: FlowStep) => boolean;
}

const STEPS = [
  { id: 1 as FlowStep, label: "Add Resume", description: "Upload or paste" },
  { id: 2 as FlowStep, label: "Target Job", description: "Paste requirements" },
  { id: 3 as FlowStep, label: "Review & Tailor", description: "Analyze gaps & rewrite" },
];

export default function Stepper({
  currentStep,
  onSelectStep,
  canNavigateToStep = () => true,
}: StepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      {/* Mobile view */}
      <div className="flex sm:hidden items-center justify-between px-1 py-2 text-xs font-medium text-[var(--muted)]">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--ink)]">
          Step {currentStep} of 3
        </span>
        <span className="text-[var(--ink)] font-semibold">
          {STEPS.find((s) => s.id === currentStep)?.label}
        </span>
      </div>

      {/* Desktop / tablet view */}
      <ol className="hidden sm:grid grid-cols-3 gap-3">
        {STEPS.map((s) => {
          const isCompleted = currentStep > s.id;
          const isCurrent = currentStep === s.id;
          const isClickable = onSelectStep && canNavigateToStep(s.id);

          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => isClickable && onSelectStep(s.id)}
                disabled={!isClickable}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                  isCurrent
                    ? "border-[var(--accent)] bg-[var(--surface)] shadow-xs"
                    : isCompleted
                      ? "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] cursor-pointer"
                      : "border-[var(--line)] bg-[var(--surface-2)]/40 opacity-60 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-semibold transition-colors flex-shrink-0 ${
                    isCurrent
                      ? "bg-[var(--accent)] text-white"
                      : isCompleted
                        ? "bg-[var(--green-soft)] text-[var(--green)]"
                        : "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--line)]"
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={2.5} /> : s.id}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? "text-[var(--ink)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]/80 truncate">
                    {s.description}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
