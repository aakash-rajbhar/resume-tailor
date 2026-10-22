import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { isAuthEnabled } from "@/lib/auth/feature";
import { requireUser } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { saveProfileSection } from "@/lib/profile/saveSection";
import { profileSectionSaveSchema } from "@/lib/profile/schemas";

export const runtime = "nodejs";

/**
 * Saves one profile section.
 *
 * The payload is validated with Zod and written in one transaction through
 * the repositories. A `ConflictError` (someone else changed the section)
 * comes back as a 409 with a message the screen can show as-is.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthEnabled()) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const user = await requireUser();

    const body = (await req.json()) as unknown;
    const parsed = profileSectionSaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid section." },
        { status: 400 },
      );
    }

    const saved = await saveProfileSection(user.id, parsed.data);

    logger.info("profile section saved", {
      userId: user.id,
      section: saved.section,
      rowCount: saved.rows.length,
    });

    return NextResponse.json(saved);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
