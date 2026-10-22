import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { key?: string };
    const apiKey = body.key || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is required to fetch available models." },
        { status: 400 },
      );
    }

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        headers: { "x-goog-api-key": apiKey },
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      let message = `Gemini API error (${res.status})`;
      try {
        const json = JSON.parse(text) as { error?: { message?: string } };
        if (json.error?.message) message = json.error.message;
      } catch {
        /* keep generic message */
      }
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const data = (await res.json()) as {
      models?: {
        name: string;
        displayName?: string;
        description?: string;
        supportedGenerationMethods?: string[];
      }[];
    };

    const models = (data.models ?? [])
      .filter((m) =>
        (m.supportedGenerationMethods ?? []).includes("generateContent"),
      )
      .map((m) => ({
        id: m.name.replace(/^models\//, ""),
        name: m.displayName ?? m.name.replace(/^models\//, ""),
        desc: m.description ?? "Model available on your Gemini account",
      }));

    return NextResponse.json({ models });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
