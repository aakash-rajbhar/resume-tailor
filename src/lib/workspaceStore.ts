import type { TailoredResume } from "./types";

export interface WorkspaceSnapshot {
  version: 1;
  resumeMode: "upload" | "paste";
  resumeText: string;
  jdText: string;
  jobTitle: string;
  company: string;
  focusTone: string;
  additionalPrompt: string;
  singlePage: boolean;
  step: number;
  result: TailoredResume | null;
}

const KEY = "resume-tailor-workspace";

export function loadWorkspace(): WorkspaceSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1) {
      return null;
    }
    return parsed as WorkspaceSnapshot;
  } catch {
    return null;
  }
}

export function saveWorkspace(snapshot: WorkspaceSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Storage full / disabled (private mode) — non-fatal.
  }
}

export function clearWorkspace(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function setUrlStep(step: number): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (step > 1) url.searchParams.set("step", String(step));
    else url.searchParams.delete("step");
    window.history.replaceState(null, "", url.toString());
  } catch {
    // ignore
  }
}

export function getUrlStep(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = new URL(window.location.href).searchParams.get("step");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 1 && n <= 3 ? n : null;
  } catch {
    return null;
  }
}
