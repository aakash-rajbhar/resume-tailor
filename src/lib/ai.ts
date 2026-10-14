/**
 * Thin abstraction over free LLM APIs so the rest of the app doesn't care
 * which provider is configured. Supports:
 *  - Google Gemini (https://aistudio.google.com/apikey) — free tier
 *  - Groq (https://console.groq.com) — free tier, no credit card required
 *
 * Keys and chosen models can come from the browser (bring-your-own-key, stored in localStorage)
 * or from .env.local (AI_PROVIDER / GEMINI_API_KEY / GROQ_API_KEY / GEMINI_MODEL / GROQ_MODEL).
 */

export type AIProvider = "gemini" | "groq";

export interface AIModelOption {
  id: string;
  name: string;
  desc: string;
  badge?: string;
}

export const GEMINI_FREE_MODELS: AIModelOption[] = [
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", desc: "Recommended · Latest generation, high accuracy & speed", badge: "Latest" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Fast & lightweight free tier", badge: "Fast" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "Advanced reasoning for complex resumes", badge: "Deep Analysis" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", desc: "Stable free tier fallback", badge: "Stable" },
];

export const GROQ_FREE_MODELS: AIModelOption[] = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", desc: "Recommended · Versatile reasoning & high throughput", badge: "Recommended" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", desc: "Ultra-fast instant inference", badge: "Fastest" },
  { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B", desc: "High-capacity open-weight reasoning model", badge: "High Capacity" },
  { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B", desc: "Fast open-weight reasoning model", badge: "Fast" },
  { id: "qwen/qwen3.8-27b", name: "Qwen 3.8 27B", desc: "Multilingual & reasoning capabilities", badge: "Multilingual" },
];

export interface AIConfig {
  provider: AIProvider;
  geminiKey?: string;
  groqKey?: string;
  geminiModel?: string;
  groqModel?: string;
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  providedKey?: string,
  providedModel?: string
): Promise<string> {
  const apiKey = providedKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No Groq API key found. Add your key in Settings (⚙), or set GROQ_API_KEY in .env.local. Get a free key at https://console.groq.com/keys"
    );
  }

  const requestedModel = providedModel || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  // Build candidate fallback models list in case one is decommissioned or rate-limited
  const candidateModels = [
    requestedModel,
    ...GROQ_FREE_MODELS.map((m) => m.id).filter((id) => id !== requestedModel),
  ];

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    // Attempt 1: With response_format json_object
    // Attempt 2: Without response_format if strict json_object is rejected
    for (const useJsonFormat of [true, false]) {
      try {
        const bodyPayload: Record<string, unknown> = {
          model,
          temperature: 0.2,
          max_tokens: 8000,
          messages: [
            {
              role: "system",
              content:
                systemPrompt +
                "\nCRITICAL: Always respond with valid JSON object only. Do not include markdown conversational preamble or commentary.",
            },
            {
              role: "user",
              content: userPrompt + (userPrompt.toLowerCase().includes("json") ? "" : "\nFormat response as valid JSON object."),
            },
          ],
        };

        if (useJsonFormat) {
          bodyPayload.response_format = { type: "json_object" };
        }

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
          const text = await res.text();
          let message = `Groq API error (${res.status})`;
          let isModelUnavailable = false;
          let isJsonFormatError = false;

          try {
            const json = JSON.parse(text) as {
              error?: { message?: string; failed_generation?: string; code?: string };
            };

            // If Groq provided failed_generation that contains valid JSON, extract and return it
            if (json.error?.failed_generation) {
              try {
                parseAIJson(json.error.failed_generation);
                return json.error.failed_generation;
              } catch {
                /* proceed with error handling */
              }
            }

            if (json.error?.message) {
              message = json.error.message;
              const lower = message.toLowerCase();
              if (
                lower.includes("not found") ||
                lower.includes("decommissioned") ||
                lower.includes("deprecated") ||
                lower.includes("not available") ||
                res.status === 404
              ) {
                isModelUnavailable = true;
              }
              if (lower.includes("response_format") || lower.includes("json_object") || lower.includes("json_validate_failed")) {
                isJsonFormatError = true;
              }
            }
          } catch {
            /* keep generic message */
          }

          // If the model is decommissioned or not available, break inner loop to try next model
          if (isModelUnavailable) {
            lastError = new Error(`Groq model ${model}: ${message}`);
            break;
          }

          // If it was a json_object format rejection, try next attempt without response_format
          if (useJsonFormat && isJsonFormatError) {
            continue;
          }

          throw new Error(message);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        if (content) {
          return content;
        }
      } catch (err) {
        if (err instanceof Error) {
          const lower = err.message.toLowerCase();
          if (
            lower.includes("not found") ||
            lower.includes("decommissioned") ||
            lower.includes("deprecated") ||
            lower.includes("not available") ||
            lower.includes("404")
          ) {
            lastError = err;
            break; // Try next candidate model
          }
          if (useJsonFormat) {
            continue; // Try without response_format
          }
        }
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to connect to any available Groq model.");
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  providedKey?: string,
  providedModel?: string
): Promise<string> {
  const apiKey = providedKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No Gemini API key found. Add your key in Settings (⚙), or set GEMINI_API_KEY in .env.local. Get a free key at https://aistudio.google.com/apikey"
    );
  }

  const selectedModel = (providedModel || process.env.GEMINI_MODEL || "gemini-3.8-flash").replace(/^models\//, "");

  // Candidate fallback list: start with the user's selected model, then try alternative free models
  const candidateModels = [
    selectedModel,
    ...GEMINI_FREE_MODELS.map((m) => m.id).filter((id) => id !== selectedModel),
  ];

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = `Gemini API error (${res.status})`;
        try {
          const json = JSON.parse(text) as { error?: { message?: string } };
          if (json.error?.message) message = json.error.message;
        } catch {
          /* keep generic message */
        }

        // If this model is deprecated or not found (404), try next available free model
        if (res.status === 404 || message.includes("not found") || message.includes("no longer available") || message.includes("not supported")) {
          console.warn(`Gemini model ${model} unavailable, trying fallback...`);
          lastError = new Error(message);
          continue;
        }

        throw new Error(message);
      }

      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        return content;
      }
    } catch (err) {
      if (err instanceof Error && (err.message.includes("404") || err.message.includes("not found") || err.message.includes("no longer available"))) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Failed to connect to any available Gemini model.");
}

/** Calls the chosen provider and returns raw text (expected to be JSON). */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  config?: Partial<AIConfig>
): Promise<string> {
  const provider = (config?.provider || process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider === "groq") {
    return callGroq(systemPrompt, userPrompt, config?.groqKey, config?.groqModel);
  }
  return callGemini(systemPrompt, userPrompt, config?.geminiKey, config?.geminiModel);
}

/** Strips ```json fences, extracts JSON objects from preambles, and safely parses. */
export function parseAIJson<T>(raw: string): T {
  let cleaned = raw.trim();

  // 1. Try markdown code block extraction
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {
      // Continue to bracket extraction if code block had invalid trailing text
    }
  }

  // 2. Try outermost curly braces extraction { ... }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1).trim();
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Continue to cleanup attempt
    }
  }

  // 3. Fallback direct parse after removing standard fences
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

/** Sends a tiny ping to verify a key + provider combination works. */
export async function testAI(config: Partial<AIConfig>): Promise<void> {
  const raw = await callAI(
    "You are a connectivity test. Respond with valid JSON object: {\"ok\": true}",
    "Please respond with valid JSON: {\"ok\": true}",
    config
  );
  const parsed = parseAIJson<{ ok?: boolean }>(raw);
  if (parsed.ok !== true) {
    throw new Error("The provider responded, but with an unexpected payload.");
  }
}
