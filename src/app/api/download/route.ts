import { NextRequest, NextResponse } from "next/server";
import { buildResumeDocx } from "@/lib/docxBuilder";
import type { TailoredResume } from "@/lib/types";
import { apiErrorResponse } from "@/lib/api";
import { isAuthEnabled } from "@/lib/auth/feature";
import { requireUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (isAuthEnabled()) {
      await requireUser();
    }

    const body = (await req.json()) as
      | TailoredResume
      | { resume: TailoredResume; singlePage?: boolean };

    const tailored: TailoredResume = "resume" in body && body.resume ? body.resume : (body as TailoredResume);
    const singlePage = "singlePage" in body ? body.singlePage !== false : true;

    const buffer = await buildResumeDocx(tailored, { singlePage });
    const filename = `${(tailored.name || "Resume").replace(/\s+/g, "_")}_Tailored.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
