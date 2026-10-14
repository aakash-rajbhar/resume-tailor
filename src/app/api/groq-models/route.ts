import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { key?: string };
    const apiKey = body.key || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Groq API key is required to fetch available models." },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
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
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const data = (await res.json()) as { data?: { id: string; active?: boolean }[] };
    const textModels = (data.data || [])
      .filter((m) => !m.id.includes("whisper") && !m.id.includes("guard") && !m.id.includes("vision"))
      .map((m) => ({
        id: m.id,
        name: m.id,
        desc: "Active model on your Groq account",
      }));

    return NextResponse.json({ models: textModels });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
