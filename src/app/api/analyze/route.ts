import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/parseFile";
import { callAI, parseAIJson, type AIProvider } from "@/lib/ai";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import type { TailoredResume } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jdText = (formData.get("jdText") as string) || "";
    const resumeTextInput = (formData.get("resumeText") as string) || "";
    const resumeFile = formData.get("resumeFile") as File | null;
    const provider = (formData.get("provider") as AIProvider) || "gemini";
    const geminiKey = (formData.get("geminiKey") as string) || "";
    const groqKey = (formData.get("groqKey") as string) || "";

    if (!jdText.trim()) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }

    let resumeText = resumeTextInput.trim();
    if (!resumeText && resumeFile) {
      resumeText = (await extractTextFromFile(resumeFile)).trim();
    }

    if (!resumeText) {
      return NextResponse.json(
        { error: "Please upload a resume file or paste your resume text." },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(resumeText, jdText);
    const raw = await callAI(SYSTEM_PROMPT, userPrompt, {
      provider,
      geminiKey: geminiKey || undefined,
      groqKey: groqKey || undefined,
    });
    const tailored = parseAIJson<TailoredResume>(raw);

    return NextResponse.json(tailored);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("analyze error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
