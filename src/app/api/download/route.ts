import { NextRequest, NextResponse } from "next/server";
import { buildResumeDocx } from "@/lib/docxBuilder";
import type { TailoredResume } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const tailored = (await req.json()) as TailoredResume;
    const buffer = await buildResumeDocx(tailored);
    const filename = `${(tailored.name || "Resume").replace(/\s+/g, "_")}_Tailored.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("download error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
