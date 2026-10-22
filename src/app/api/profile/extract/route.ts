import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { isAuthEnabled } from "@/lib/auth/feature";
import { requireUser } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { extractTextFromFile } from "@/lib/parseFile";
import { redactContact } from "@/lib/profile/contact";
import { extractProfile } from "@/lib/profile/extract";

export const runtime = "nodejs";
export const maxDuration = 300;

/** A resume longer than this is truncated before extraction. */
const MAX_RESUME_CHARS = 40000;

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

/**
 * Extracts the profile sections from a resume.
 *
 * The resume text never leaves the server without its contact details: the
 * email addresses, phone numbers and links are read in code and removed
 * before a model sees the text. Nothing is written to the database here; the
 * browser gets drafts it can review.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthEnabled()) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const user = await requireUser();

    const formData = await req.formData();
    let resumeText = readText(formData, "resumeText").trim();

    const resumeFile = formData.get("resumeFile");
    if (!resumeText && resumeFile instanceof File) {
      resumeText = (await extractTextFromFile(resumeFile)).trim();
    }

    if (resumeText.length < 30) {
      return NextResponse.json(
        { error: "Please upload a resume file or paste your resume text." },
        { status: 400 },
      );
    }

    const truncated = resumeText.slice(0, MAX_RESUME_CHARS);
    const { text, contact } = redactContact(truncated);

    const result = await extractProfile(text, {
      config: { signal: req.signal },
    });

    logger.info("profile extraction completed", {
      userId: user.id,
      modelUsed: result.modelUsed,
      fallbackUsed: result.fallbackUsed,
      sectionCount: result.drafts.experience.length + result.drafts.projects.length,
      failedSections: result.failures.length,
      cachedSections: result.cachedSections.length,
    });

    return NextResponse.json({
      contact,
      drafts: result.drafts,
      modelUsed: result.modelUsed,
      fallbackUsed: result.fallbackUsed,
      failures: result.failures,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
