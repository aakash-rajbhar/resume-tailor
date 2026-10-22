import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Badge from "@/components/ui/Badge";
import { getRepos } from "@/db/repo";
import { isAuthEnabled } from "@/lib/auth/feature";
import { getOptionalUser } from "@/lib/auth/session";
import { computeCompleteness } from "@/lib/profile/completeness";
import {
  toCertificationItem,
  toContactItem,
  toEducationItem,
  toExperienceItem,
  toProjectItem,
  toSkillItem,
} from "@/lib/profile/items";
import type { ProfileSectionKey } from "@/lib/profile/schemas";

export const metadata = {
  title: "Your profile",
};

const SECTION_LABELS: Record<ProfileSectionKey, string> = {
  profile: "Profile and contact",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  certifications: "Certifications",
};

const SECTION_HINTS: Record<ProfileSectionKey, string> = {
  profile: "Your name, headline, summary and contact details.",
  experience: "The roles you have held.",
  projects: "The projects you want a recruiter to read.",
  skills: "The skills you can defend, grouped by category.",
  education: "Your degrees and courses.",
  certifications: "Certifications, licenses and awards.",
};

/**
 * The profile overview: what is filled in, what is missing and where to go
 * next. Every number here is computed in code.
 */
export default async function ProfilePage() {
  if (!isAuthEnabled()) {
    notFound();
  }

  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }

  const repos = getRepos();
  const [profileRow, experience, projects, skills, education, certifications] =
    await Promise.all([
      repos.profiles.get(user.id),
      repos.experience.list(user.id),
      repos.projects.list(user.id),
      repos.skills.list(user.id),
      repos.education.list(user.id),
      repos.certifications.list(user.id),
    ]);

  const profile = toContactItem(profileRow);
  const profileIsEmpty =
    !profileRow ||
    (!profile.fullName &&
      !profile.headline &&
      !profile.summary &&
      !profile.email &&
      !profile.phone &&
      !profile.location &&
      profile.links.length === 0);

  // A first-time user has nothing to edit yet, so they start with the import.
  if (profileIsEmpty && experience.length === 0 && projects.length === 0) {
    redirect("/profile/import-resume");
  }

  const skillItems = skills.map((row) => toSkillItem(row));
  const completeness = computeCompleteness({
    profile,
    experience: experience.map((row) => toExperienceItem(row)),
    projects: projects.map((row) => toProjectItem(row)),
    skills: skillItems,
    education: education.map((row) => toEducationItem(row)),
    certifications: certifications.map((row) => toCertificationItem(row)),
  });

  const counts: Record<ProfileSectionKey, number> = {
    profile: profileRow ? 1 : 0,
    experience: experience.length,
    projects: projects.length,
    skills: skills.length,
    education: education.length,
    certifications: certifications.length,
  };

  const order: ProfileSectionKey[] = [
    "profile",
    "experience",
    "projects",
    "skills",
    "education",
    "certifications",
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Your profile
          </h1>
          <Badge variant={completeness.score >= 80 ? "matched" : "partial"}>
            {completeness.score}% complete
          </Badge>
        </div>
        <p className="text-sm text-muted max-w-2xl leading-relaxed">
          This is the single source of truth for every tailored resume. Nothing
          here is sent to a model without your say-so.
        </p>
      </header>

      <section className="paper-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-ink">Completeness</h2>
          <span className="text-xs text-muted font-mono">
            {completeness.earned}/{completeness.total}
          </span>
        </div>

        <div
          className="h-2 w-full rounded-full bg-surface-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={completeness.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completeness"
        >
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${completeness.score}%` }}
          />
        </div>

        {completeness.missing.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted">Still to do</p>
            <ul className="space-y-1">
              {completeness.missing.map((item) => (
                <li key={item} className="text-xs text-ink flex items-start gap-2">
                  <span
                    className="mt-1.5 size-1.5 rounded-full bg-amber shrink-0"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-green">Your profile is complete.</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Sections</h2>
          <Link
            href="/profile/import-resume"
            className="text-xs font-medium text-accent hover:underline"
          >
            Import from a resume
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {order.map((section) => (
            <div key={section} className="paper-card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-ink">
                    {SECTION_LABELS[section]}
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    {SECTION_HINTS[section]}
                  </p>
                </div>
                <Badge variant={counts[section] > 0 ? "neutral" : "missing"} size="sm">
                  {counts[section]}
                </Badge>
              </div>
              <Link
                href={`/profile/edit/${section}`}
                className="text-xs font-medium text-accent hover:underline self-start"
              >
                Edit {SECTION_LABELS[section].toLowerCase()}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
