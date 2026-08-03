import type { AIProvider } from "./ai";

export type ThemePreference = "light" | "dark" | "system";

export interface AppSettings {
  provider: AIProvider;
  geminiKey: string;
  groqKey: string;
  theme: ThemePreference;
}

export const SETTINGS_KEY = "resume-tailor-settings";

export const DEFAULT_SETTINGS: AppSettings = {
  provider: "gemini",
  geminiKey: "",
  groqKey: "",
  theme: "system",
};

let cached: AppSettings | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function readFromStorage(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** React external-store snapshot (useSyncExternalStore). */
export function getSettingsSnapshot(): AppSettings {
  if (!cached) cached = readFromStorage();
  return cached;
}

/** React external-store subscription (useSyncExternalStore). */
export function subscribeSettings(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", handleStorageEvent);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorageEvent);
  };
}

function handleStorageEvent(e: StorageEvent) {
  if (e.key === SETTINGS_KEY) {
    cached = null;
    notify();
  }
}

/** Persist settings and notify subscribers. */
export function writeSettings(settings: AppSettings): void {
  cached = settings;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage full / private mode — ignore */
  }
  notify();
}

/** Toggles the .dark/.light classes on <html>. */
export function applyTheme(theme: ThemePreference): void {
  if (typeof document === "undefined") return;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle("light", !dark);
}
