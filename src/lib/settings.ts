import type { AIProvider } from "./ai";

export type ThemePreference = "light" | "dark" | "system";

export interface AppSettings {
  provider: AIProvider;
  geminiKey: string;
  groqKey: string;
  geminiModel: string;
  groqModel: string;
  theme: ThemePreference;
}

export const SETTINGS_KEY = "resume-tailor-settings";

export const DEFAULT_SETTINGS: AppSettings = {
  provider: "gemini",
  geminiKey: "",
  groqKey: "",
  geminiModel: "gemini-3.8-flash",
  groqModel: "llama-3.3-70b-versatile",
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
    const parsed = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
    
    // Auto-migrate deprecated models to prevent silent failures
    if (parsed.geminiModel === "gemini-2.0-flash" || parsed.geminiModel === "gemini-1.5-pro") {
      parsed.geminiModel = "gemini-3.8-flash";
    }
    if (parsed.groqModel === "mixtral-8x7b-32768" || !parsed.groqModel) {
      parsed.groqModel = "llama-3.3-70b-versatile";
    }
    return parsed;
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
