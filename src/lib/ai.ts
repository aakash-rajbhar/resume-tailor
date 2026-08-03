/**
 * Thin abstraction over free LLM APIs so the rest of the app doesn't care
 * which provider is configured. Supports:
 *  - Groq (https://console.groq.com) — free tier, no credit card required
 *  - Google Gemini (https://aistudio.google.com/apikey) — free tier
 *
 * Keys can come from the browser (bring-your-own-key, stored in localStorage)
 * or from .env.local (AI_PROVIDER / GEMINI_API_KEY / GROQ_API_KEY).
 */

export type AIProvider = "gemini" | "groq";

export interface AIConfig {
  provider: AIProvider;
  geminiKey?: string;
  groqKey?: string;
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  providedKey?: string
): Promise<string> {
  const apiKey = providedKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No Groq API key found. Add your key in Settings (⚙), or set GROQ_API_KEY in .env.local. Get a free key at https://console.groq.com/keys"
    );
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `Groq API error (${res.status})`;
    try {
      const json = JSON.parse(text) as { error?: { message?: string } };
      if (json.error?.message) message = json.error.message;
    } catch {
      /* keep generic message */
    }
    throw new Error(message);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  providedKey?: string
): Promise<string> {
  const apiKey = providedKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No Gemini API key found. Add your key in Settings (⚙), or set GEMINI_API_KEY in .env.local. Get a free key at https://aistudio.google.com/apikey"
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
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
    throw new Error(message);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/** Calls the chosen provider and returns raw text (expected to be JSON). */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  config?: Partial<AIConfig>
): Promise<string> {
  const provider = (config?.provider || process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider === "groq") return callGroq(systemPrompt, userPrompt, config?.groqKey);
  return callGemini(systemPrompt, userPrompt, config?.geminiKey);
}

/** Strips ```json fences if the model adds them despite instructions, then parses. */
export function parseAIJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
  return JSON.parse(cleaned) as T;
}

/** Sends a tiny ping to verify a key + provider combination works. */
export async function testAI(config: Partial<AIConfig>): Promise<void> {
  const raw = await callAI(
    "You are a connectivity test. Respond with exactly this JSON and nothing else: {\"ok\":true}",
    "Ping.",
    config
  );
  const parsed = parseAIJson<{ ok?: boolean }>(raw);
  if (parsed.ok !== true) {
    throw new Error("The provider responded, but with an unexpected payload.");
  }
}
