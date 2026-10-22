import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/parseFile";
import { generateJSON } from "@/lib/ai";
import { buildUserPrompt, SYSTEM_PROMPT, PROMPT_VERSION } from "@/lib/prompt";
import { extractJD } from "@/lib/extractJD";
import { computeScore } from "@/lib/score";
import { canonicalizeSkill } from "@/lib/skills/synonyms";
import { resumeToText } from "@/lib/resumeText";
import { normalizeTailoredResume } from "@/lib/normalizeResume";
import { AnalyzeFormSchema, TailoredResumeSchema } from "@/lib/schemas";
import { cleanTextForHash, hashKey, withCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 120;

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const parsed = AnalyzeFormSchema.safeParse({
      jdText: readText(formData, "jdText"),
      resumeText: readText(formData, "resumeText"),
      provider: readText(formData, "provider") || "gemini",
      geminiKey: readText(formData, "geminiKey"),
      groqKey: readText(formData, "groqKey"),
      geminiModel: readText(formData, "geminiModel") || undefined,
      groqModel: readText(formData, "groqModel") || undefined,
      additionalPrompt: readText(formData, "additionalPrompt"),
      singlePage: readText(formData, "singlePage") !== "false",
    });

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid request payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const input = parsed.data;

    let resumeText = input.resumeText.trim();
    const resumeFile = formData.get("resumeFile");
    if (!resumeText && resumeFile instanceof File) {
      resumeText = (await extractTextFromFile(resumeFile)).trim();
    }

    if (!resumeText) {
      return NextResponse.json(
        { error: "Please upload a resume file or paste your resume text." },
        { status: 400 },
      );
    }

    const model =
      input.provider === "groq" ? input.groqModel : input.geminiModel;
    const aiConfig = {
      provider: input.provider,
      geminiKey: input.geminiKey || undefined,
      groqKey: input.groqKey || undefined,
      geminiModel: input.geminiModel,
      groqModel: input.groqModel,
      signal: req.signal,
    };

    const jdResult = await extractJD(input.jdText, {
      provider: input.provider,
      model,
      config: aiConfig,
    });

    const keywords = {
      required: jdResult.jd.required_skills,
      preferred: jdResult.jd.preferred_skills,
    };

    const before = computeScore(keywords, resumeText);

    const tailoringKey = hashKey(
      "tailor",
      PROMPT_VERSION,
      input.provider,
      model ?? "default",
      cleanTextForHash(resumeText),
      cleanTextForHash(input.jdText),
      cleanTextForHash(input.additionalPrompt),
      String(input.singlePage),
    );

    const { value: tailored, cached: tailoringCached } = await withCache(
      tailoringKey,
      () =>
        generateJSON({
          system: SYSTEM_PROMPT,
          user: buildUserPrompt({
            resumeText,
            jdText: input.jdText,
            keywords,
            responsibilities: jdResult.jd.responsibilities,
            additionalPrompt: input.additionalPrompt,
            singlePage: input.singlePage,
          }),
          schema: TailoredResumeSchema,
          provider: input.provider,
          model,
          config: aiConfig,
        }),
    );

    const normalized = normalizeTailoredResume(tailored.data);
    const after = computeScore(keywords, resumeToText(normalized));

    const beforeCanonical = new Set(
      before.matched.map((keyword) => canonicalizeSkill(keyword)),
    );
    const addedKeywords = after.matched.filter(
      (keyword) => !beforeCanonical.has(canonicalizeSkill(keyword)),
    );

    logger.info("analyze completed", {
      provider: input.provider,
      modelUsed: tailored.modelUsed,
      fallbackUsed: tailored.fallbackUsed,
      jdCached: jdResult.cached,
      extractionFallback: jdResult.extractionFallback,
      tailoringCached,
      scoreBefore: before.score,
      scoreAfter: after.score,
    });

    return NextResponse.json({
      ...normalized,
      atsScoreBefore: before.score,
      atsScoreAfter: after.score,
      matchedKeywords: after.matched,
      missingKeywords: after.missing,
      addedKeywords,
      modelUsed: tailored.modelUsed,
      fallbackUsed: tailored.fallbackUsed,
      jdModelUsed: jdResult.modelUsed,
      extractionModelUsed: jdResult.modelUsed,
      extractionFallback: jdResult.extractionFallback,
      educationRequirement: jdResult.jd.education_requirement,
      otherRequirements: jdResult.jd.other_requirements,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("analyze failed", {
      message,
      name: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
