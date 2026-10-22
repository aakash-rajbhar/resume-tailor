export type AIProvider = "gemini" | "groq";

export interface AIModelOption {
  id: string;
  name: string;
  desc: string;
  badge?: string;
}

export type GeminiThinkingLevel = "minimal" | "low" | "medium" | "high";

export interface GeminiModelConfig extends AIModelOption {
  maxOutputTokens: number;
  thinkingLevel: GeminiThinkingLevel;
}

export interface GroqModelConfig extends AIModelOption {
  maxOutputTokens: number;
}

/**
 * Pinned model IDs. Verified against the provider list-models endpoints
 * (Gemini `GET /v1beta/models`, Groq `GET /openai/v1/models`) on 2026-10-22.
 *
 * No "latest" aliases, no preview-of-preview IDs, no models that a free tier
 * cannot reach:
 *  - Gemini: `gemini-4-argon` and `gemini-2.5-*` are listed by the API but have
 *    zero free-tier quota / are retired, so they are not offered here.
 *  - Groq: `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` are enterprise
 *    models (unreachable on the free plan); `allam-2-7b` has a 4k context window.
 */
export const GEMINI_MODELS: GeminiModelConfig[] = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    desc: "Recommended · Latest stable Flash, strong structured output",
    badge: "Recommended",
    maxOutputTokens: 8192,
    thinkingLevel: "low",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    desc: "Fast · Near-zero reasoning for quick passes",
    badge: "Fast",
    maxOutputTokens: 8192,
    thinkingLevel: "minimal",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    desc: "Lightest · Lowest latency and token cost",
    badge: "Lightest",
    maxOutputTokens: 8192,
    thinkingLevel: "minimal",
  },
];

export const GROQ_MODELS: GroqModelConfig[] = [
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    desc: "Recommended · Highest capacity open-weight model",
    badge: "Recommended",
    maxOutputTokens: 8192,
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    desc: "Fast · Smaller open-weight model",
    badge: "Fast",
    maxOutputTokens: 8192,
  },
  {
    id: "qwen/qwen3.8-27b",
    name: "Qwen 3.8 27B",
    desc: "Multilingual · Good for non-English job descriptions",
    badge: "Multilingual",
    maxOutputTokens: 8192,
  },
];

export const EXTRACTION_MODEL = "gemini-2.5-flash"; // pin extraction model; will verify via live list-models and may adjust

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

export function isKnownGeminiModel(id: string): boolean {
  return GEMINI_MODELS.some((m) => m.id === id);
}

export function isKnownGroqModel(id: string): boolean {
  return GROQ_MODELS.some((m) => m.id === id);
}

export function isKnownModel(provider: AIProvider, id: string): boolean {
  return provider === "groq" ? isKnownGroqModel(id) : isKnownGeminiModel(id);
}

export function defaultModelFor(provider: AIProvider): string {
  return provider === "groq" ? DEFAULT_GROQ_MODEL : DEFAULT_GEMINI_MODEL;
}

/** Fallback chain for a provider, used only when fallback is explicitly enabled. */
export function fallbackChain(provider: AIProvider, preferredId: string): string[] {
  const all = provider === "groq" ? GROQ_MODELS : GEMINI_MODELS;
  const ids = all.map((m) => m.id);
  return [preferredId, ...ids.filter((id) => id !== preferredId)];
}
