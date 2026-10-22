import { NextRequest, NextResponse } from "next/server";
import { getRepos } from "@/db/repo";
import { apiErrorResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { isAuthEnabled } from "@/lib/auth/feature";
import { profileInputSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/** The signed-in user's master profile and content. */
export async function GET() {
  try {
    if (!isAuthEnabled()) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const user = await requireUser();
    const repos = getRepos();

    const [profile, experience, projects, skills, education, certifications] =
      await Promise.all([
        repos.profiles.get(user.id),
        repos.experience.list(user.id),
        repos.projects.list(user.id),
        repos.skills.list(user.id),
        repos.education.list(user.id),
        repos.certifications.list(user.id),
      ]);

    return NextResponse.json({
      profile,
      experience,
      projects,
      skills,
      education,
      certifications,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/** Creates the profile, or updates it with an optimistic lock. */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthEnabled()) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const user = await requireUser();
    const repos = getRepos();

    const body = (await req.json()) as Record<string, unknown>;
    const { version, ...rest } = body;

    const parsed = profileInputSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid profile.",
        },
        { status: 400 },
      );
    }

    const existing = await repos.profiles.get(user.id);
    if (!existing) {
      const created = await repos.profiles.create(user.id, parsed.data);
      return NextResponse.json({ profile: created }, { status: 201 });
    }

    const expectedVersion =
      typeof version === "number" ? version : existing.version;
    const updated = await repos.profiles.update(
      user.id,
      existing.id,
      parsed.data,
      expectedVersion,
    );
    return NextResponse.json({ profile: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
