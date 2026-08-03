import { NextRequest, NextResponse } from "next/server";
import { testAI, type AIProvider } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { provider?: AIProvider; key?: string };
    const provider = body.provider === "groq" ? "groq" : "gemini";
    const key = body.key || "";

    await testAI({
      provider,
      geminiKey: provider === "gemini" ? key || undefined : undefined,
      groqKey: provider === "groq" ? key || undefined : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("test-ai error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
