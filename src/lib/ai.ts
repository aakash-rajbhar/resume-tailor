import { z } from "zod";
import { logger } from "./logger";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GROQ_MODEL,
  GEMINI_MODELS,
  GROQ_MODELS,
  fallbackChain,
  isKnownModel,
  type AIProvider,
  type AIModelOption,
} from "./models";

export type { AIProvider, AIModelOption };

export const GEMINI_FREE_MODELS: AIModelOption[] = GEMINI_MODELS;
export const GROQ_FREE_MODELS: AIModelOption[] = GROQ_MODELS;

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const SEED = 42;
const TOP_P = 0.1;
const TOP_K = 1;
// const DEFAULT_MAX_OUTPUT_TOKENS = 8192; // use model-specific values from models.ts
const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_MAX_RETRIES = 3;
const MAX_BACKOFF_MS = 20000;
const MAX_RETRY_AFTER_MS = 60000;

export interface AIConfig {
  provider: AIProvider;
  geminiKey?: string;
  groqKey?: string;
  geminiModel?: string;
  groqModel?: string;
  allowFallback?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface AIResult {
  text: string;
  provider: AIProvider;
  modelUsed: string;
  fallbackUsed: boolean;
}

export class AIError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.status = status;
  }
}

export class AIValidationError extends Error {
  readonly details: string;
  readonly provider: AIProvider;
  readonly modelUsed: string;

  constructor(
    message: string,
    details: string,
    provider: AIProvider,
    modelUsed: string,
  ) {
    super(message);
    this.name = "AIValidationError";
    this.details = details;
    this.provider = provider;
    this.modelUsed = modelUsed;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
    }
    const asDate = Date.parse(retryAfterHeader);
    if (!Number.isNaN(asDate)) {
      return Math.min(Math.max(asDate - Date.now(), 0), MAX_RETRY_AFTER_MS);
    }
  }
  const base = Math.min(500 * 2 ** attempt, MAX_BACKOFF_MS);
  const jitter = base * (0.5 + Math.random() * 0.5);
  return Math.min(jitter, MAX_BACKOFF_MS);
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

async function readBodySafely(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 600);
  } catch {
    return "";
  }
}

function providerErrorCode(status: number): string {
  if (status === 429) return "rate_limit";
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "model_not_found";
  if (status >= 500) return "server_error";
  return "request_failed";
}

function describeProviderError(
  provider: AIProvider,
  status: number,
  body: string,
): string {
  let detail = "";
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof parsed.error === "string") detail = parsed.error;
    else if (parsed.error?.message) detail = parsed.error.message;
    else if (parsed.message) detail = parsed.message;
  } catch {
    detail = body.slice(0, 200);
  }
  const prefix =
    status === 429
      ? `${provider === "gemini" ? "Gemini" : "Groq"} rate limit reached`
      : status === 401 || status === 403
        ? `${provider === "gemini" ? "Gemini" : "Groq"} rejected the API key`
        : `${provider === "gemini" ? "Gemini" : "Groq"} API error (${status})`;
  return detail ? `${prefix}: ${detail}` : prefix;
}

function isModelUnavailableError(error: unknown): boolean {
  if (!(error instanceof AIError)) return false;
  if (error.code === "model_not_found") return true;
  const message = error.message.toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("decommissioned") ||
    message.includes("no longer available") ||
    message.includes("is not supported") ||
    message.includes("not supported for this model")
  );
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: {
    provider: AIProvider;
    model: string;
    maxRetries: number;
    timeoutMs: number;
    signal?: AbortSignal;
  },
): Promise<Response> {
  const { provider, model, maxRetries, timeoutMs, signal } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new AIError("Request was cancelled.", "aborted");
    }

    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const combinedSignal = signal
      ? AbortSignal.any([timeoutSignal, signal])
      : timeoutSignal;

    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: combinedSignal });
    } catch (error) {
      if (signal?.aborted) {
        throw new AIError("Request was cancelled.", "aborted");
      }
      if (attempt < maxRetries) {
        const wait = backoffDelay(attempt, null);
        logger.warn("provider request failed, retrying", {
          provider,
          model,
          attempt: attempt + 1,
          waitMs: wait,
          reason: isAbortError(error) ? "timeout" : "network",
        });
        await delay(wait);
        continue;
      }
      throw new AIError(
        isAbortError(error)
          ? `The ${provider} request timed out after ${timeoutMs}ms.`
          : `Could not reach ${provider === "gemini" ? "Gemini" : "Groq"}: ${error instanceof Error ? error.message : "network error"}`,
        isAbortError(error) ? "timeout" : "network",
      );
    }

    if (response.ok) return response;

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= maxRetries) {
      const body = await readBodySafely(response);
      throw new AIError(
        describeProviderError(provider, response.status, body),
        providerErrorCode(response.status),
        response.status,
      );
    }

    const wait = backoffDelay(attempt, response.headers.get("retry-after"));
    logger.warn("provider rate limited, retrying", {
      provider,
      model,
      attempt: attempt + 1,
      status: response.status,
      waitMs: wait,
    });
    await delay(wait);
  }

  throw new AIError(
    `The ${provider === "gemini" ? "Gemini" : "Groq"} request failed after ${maxRetries} retries.`,
    "request_failed",
  );
}

const GEMINI_TYPE_MAP: Record<string, string> = {
  object: "OBJECT",
  string: "STRING",
  number: "NUMBER",
  integer: "INTEGER",
  boolean: "BOOLEAN",
  array: "ARRAY",
};

/*
const GEMINI_ALLOWED_KEYS = new Set([
  "type",
  "format",
  "description",
  "nullable",
  "enum",
  "items",
  "properties",
  "required",
  "propertyOrdering",
  "minItems",
  "maxItems",
  "anyOf",
]);
*/

function sanitizeGeminiSchema(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeGeminiSchema(entry));
  }
  if (!value || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  if (Array.isArray(source.type)) {
    const types = source.type.filter((t) => t !== "null") as string[];
    out.type = GEMINI_TYPE_MAP[types[0]] ?? "STRING";
    if (types.length !== source.type.length) out.nullable = true;
  } else if (typeof source.type === "string") {
    out.type = GEMINI_TYPE_MAP[source.type] ?? source.type.toUpperCase();
  }

  if (Array.isArray(source.anyOf)) {
    out.anyOf = (source.anyOf as unknown[]).map((entry) =>
      sanitizeGeminiSchema(entry),
    );
  }
  if (source.items !== undefined) {
    out.items = sanitizeGeminiSchema(source.items);
  }
  if (source.properties && typeof source.properties === "object") {
    const properties: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(
      source.properties as Record<string, unknown>,
    )) {
      properties[key] = sanitizeGeminiSchema(entry);
    }
    out.properties = properties;
  }
  if (Array.isArray(source.required)) {
    out.required = source.required.filter(
      (key) =>
        typeof key === "string" &&
        out.properties &&
        key in (out.properties as Record<string, unknown>),
    );
  }
  for (const key of ["format", "description", "enum", "minItems", "maxItems"]) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  if (source.nullable !== undefined) out.nullable = source.nullable;

  return out;
}

/** Converts a zod schema into the OpenAPI subset the Gemini API accepts. */
export function toGeminiSchema(schema: z.ZodTypeAny): unknown {
  const jsonSchema = z.toJSONSchema(schema, {
    io: "output",
    unrepresentable: "any",
  }) as Record<string, unknown>;
  return sanitizeGeminiSchema(jsonSchema);
}

function resolveGeminiModel(model: string) {
  return (
    GEMINI_MODELS.find((candidate) => candidate.id === model) ??
    GEMINI_MODELS[0]
  );
}

function resolveGroqModel(model: string) {
  return (
    GROQ_MODELS.find((candidate) => candidate.id === model) ?? GROQ_MODELS[0]
  );
}

interface ProviderCallOptions {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  schema?: z.ZodTypeAny;
  signal?: AbortSignal;
  timeoutMs: number;
  maxRetries: number;
}

async function callGeminiOnce(options: ProviderCallOptions): Promise<string> {
  const modelConfig = resolveGeminiModel(options.model);
  const generationConfig: Record<string, unknown> = {
    temperature: 0,
    topP: TOP_P,
    topK: TOP_K,
    seed: SEED,
    maxOutputTokens: modelConfig.maxOutputTokens,
    responseMimeType: "application/json",
    thinkingConfig: { thinkingLevel: modelConfig.thinkingLevel },
  };
  if (options.schema) {
    generationConfig.responseSchema = toGeminiSchema(options.schema);
  }

  const response = await fetchWithRetry(
    `${GEMINI_ENDPOINT}/${options.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: [{ role: "user", parts: [{ text: options.user }] }],
        generationConfig,
      }),
    },
    {
      provider: "gemini",
      model: options.model,
      maxRetries: options.maxRetries,
      timeoutMs: options.timeoutMs,
      signal: options.signal,
    },
  );

  const data = (await response.json()) as {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string }[] };
    }[];
    promptFeedback?: { blockReason?: string };
  };

  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason ?? "STOP";

  if (finishReason === "MAX_TOKENS") {
    throw new AIError(
      "Gemini hit the output token limit, so the resume was truncated. Try a shorter resume or a model with a larger output budget.",
      "truncated",
    );
  }
  if (finishReason !== "STOP") {
    throw new AIError(
      `Gemini stopped early (finishReason: ${finishReason}).`,
      "blocked",
    );
  }
  if (data.promptFeedback?.blockReason) {
    throw new AIError(
      `Gemini blocked the request (${data.promptFeedback.blockReason}).`,
      "blocked",
    );
  }

  const text = (candidate?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new AIError("Gemini returned an empty response.", "empty");
  }
  return text;
}

async function callGroqOnce(options: ProviderCallOptions): Promise<string> {
  const modelConfig = resolveGroqModel(options.model);
  const response = await fetchWithRetry(
    GROQ_ENDPOINT,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        temperature: 0,
        top_p: TOP_P,
        seed: SEED,
        max_tokens: modelConfig.maxOutputTokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `${options.system}\nRespond with a single valid JSON object and nothing else.`,
          },
          { role: "user", content: options.user },
        ],
      }),
    },
    {
      provider: "groq",
      model: options.model,
      maxRetries: options.maxRetries,
      timeoutMs: options.timeoutMs,
      signal: options.signal,
    },
  );

  const data = (await response.json()) as {
    choices?: {
      finish_reason?: string;
      message?: { content?: string | null };
    }[];
  };

  const choice = data.choices?.[0];
  const finishReason = choice?.finish_reason ?? "stop";

  if (finishReason === "length") {
    throw new AIError(
      "Groq hit the output token limit, so the resume was truncated. Try a shorter resume or a model with a larger output budget.",
      "truncated",
    );
  }

  const text = (choice?.message?.content ?? "").trim();
  if (!text) {
    throw new AIError("Groq returned an empty response.", "empty");
  }
  return text;
}

function resolveRequest(
  config: Partial<AIConfig>,
): {
  provider: AIProvider;
  apiKey: string;
  model: string;
  allowFallback: boolean;
  signal?: AbortSignal;
  timeoutMs: number;
  maxRetries: number;
} {
  const provider = (
    config.provider ||
    process.env.AI_PROVIDER ||
    "gemini"
  ).toLowerCase() as AIProvider;

  if (provider === "groq") {
    const apiKey = config.groqKey || process.env.GROQ_API_KEY || "";
    if (!apiKey) {
      throw new AIError(
        "No Groq API key found. Add your key in Settings, or set GROQ_API_KEY in .env.local.",
        "missing_key",
      );
    }
    return {
      provider,
      apiKey,
      model: config.groqModel || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
      allowFallback: config.allowFallback === true,
      signal: config.signal,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
    };
  }

  const apiKey = config.geminiKey || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new AIError(
      "No Gemini API key found. Add your key in Settings, or set GEMINI_API_KEY in .env.local.",
      "missing_key",
    );
  }
  return {
    provider: "gemini",
    apiKey,
    model:
      config.geminiModel || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    allowFallback: config.allowFallback === true,
    signal: config.signal,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
  };
}

/**
 * Calls the chosen provider and returns the raw text (expected to be JSON).
 * Model fallback is opt-in: when it is off and the requested model fails, the
 * error surfaces instead of silently switching models.
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  config?: Partial<AIConfig>,
  schema?: z.ZodTypeAny,
): Promise<AIResult> {
  const request = resolveRequest(config ?? {});

  if (!isKnownModel(request.provider, request.model)) {
    logger.warn("model is not in the pinned model list", {
      provider: request.provider,
      model: request.model,
    });
  }

  const chain = request.allowFallback
    ? fallbackChain(request.provider, request.model)
    : [request.model];

  let lastError: unknown = null;
  for (const [index, model] of chain.entries()) {
    try {
      const text =
        request.provider === "groq"
          ? await callGroqOnce({
              apiKey: request.apiKey,
              model,
              system: systemPrompt,
              user: userPrompt,
              schema,
              signal: request.signal,
              timeoutMs: request.timeoutMs,
              maxRetries: request.maxRetries,
            })
          : await callGeminiOnce({
              apiKey: request.apiKey,
              model,
              system: systemPrompt,
              user: userPrompt,
              schema,
              signal: request.signal,
              timeoutMs: request.timeoutMs,
              maxRetries: request.maxRetries,
            });

      const fallbackUsed = index > 0;
      if (fallbackUsed) {
        logger.warn("fell back to a different model", {
          provider: request.provider,
          modelUsed: model,
        });
      }
      return {
        text,
        provider: request.provider,
        modelUsed: model,
        fallbackUsed,
      };
    } catch (error) {
      lastError = error;
      const canFallback =
        request.allowFallback &&
        index < chain.length - 1 &&
        isModelUnavailableError(error);
      if (!canFallback) throw error;
      logger.warn("model unavailable, trying the next pinned model", {
        provider: request.provider,
        model,
      });
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new AIError("The AI request failed.", "request_failed");
}

/** Strips ```json fences, extracts JSON objects from preambles, and safely parses. */
export function parseAIJson<T>(raw: string): T {
  let cleaned = raw.trim();

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {
      /* fall through to brace extraction */
    }
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1).trim();
    try {
      return JSON.parse(candidate) as T;
    } catch {
      /* fall through to cleanup attempt */
    }
  }

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

/**
 * Parses a model response leniently: strips code fences and removes raw
 * control characters that would otherwise break JSON.parse.
 */
export function parseAIJsonLoose(raw: string): unknown {
  const sanitized = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/[\r\n]+/g, " ");
  return parseAIJson<unknown>(sanitized);
}

export interface GenerateJSONOptions<T> {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  provider?: AIProvider;
  model?: string;
  config?: Partial<AIConfig>;
  maxAttempts?: number;
}

export interface GeneratedJSON<T> {
  data: T;
  text: string;
  provider: AIProvider;
  modelUsed: string;
  fallbackUsed: boolean;
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

function correctionPrompt(originalUser: string, problem: string): string {
  return `${originalUser}

[VALIDATION ERROR]
Your previous response could not be used because: ${problem}
Return a corrected JSON object that matches the requested schema exactly.
Use only information that is present in the input above.`;
}

/**
 * Provider-agnostic structured generation. Validates the response with zod and
 * retries once with the validation error appended before failing.
 */
export async function generateJSON<T>(
  options: GenerateJSONOptions<T>,
): Promise<GeneratedJSON<T>> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 2);
  let userPrompt = options.user;
  let lastProblem = "unknown validation error";
  let modelUsed = "";
  let currentProvider: AIProvider =
    options.provider ?? options.config?.provider ?? "gemini";

  const model =
    options.model ??
    (currentProvider === "groq"
      ? options.config?.groqModel
      : options.config?.geminiModel);

  const callConfig: Partial<AIConfig> = {
    ...options.config,
    provider: currentProvider,
    ...(currentProvider === "groq"
      ? { groqModel: model }
      : { geminiModel: model }),
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await callAI(
      options.system,
      userPrompt,
      callConfig,
      options.schema,
    );

    currentProvider = result.provider;
    modelUsed = result.modelUsed;
    const usedFallback = result.fallbackUsed;

    let parsed: unknown;
    try {
      parsed = parseAIJsonLoose(result.text);
    } catch (error) {
      lastProblem = `the response was not valid JSON (${
        error instanceof Error ? error.message : "parse error"
      })`;
      userPrompt = correctionPrompt(options.user, lastProblem);
      continue;
    }

    const validated = options.schema.safeParse(parsed);
    if (validated.success) {
      return {
        data: validated.data,
        text: result.text,
        provider: result.provider,
        modelUsed: result.modelUsed,
        fallbackUsed: usedFallback,
      };
    }

    lastProblem = formatZodIssues(validated.error);
    userPrompt = correctionPrompt(options.user, lastProblem);
  }

  throw new AIValidationError(
    "The model response did not match the expected schema.",
    lastProblem,
    currentProvider,
    modelUsed,
  );
}

/** Sends a tiny ping to verify a key + provider combination works. */
export async function testAI(config: Partial<AIConfig>): Promise<void> {
  const result = await callAI(
    "You are a connectivity test. Respond with valid JSON object: {\"ok\": true}",
    "Please respond with valid JSON: {\"ok\": true}",
    config,
  );
  const parsed = parseAIJsonLoose(result.text) as { ok?: boolean };
  if (parsed.ok !== true) {
    throw new AIError(
      "The provider responded, but with an unexpected payload.",
      "unexpected_payload",
    );
  }
}
