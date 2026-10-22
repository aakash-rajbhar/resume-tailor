import { notFound, redirect } from "next/navigation";

import ImportResumeFlow from "@/components/profile/ImportResumeFlow";
import { getRepos } from "@/db/repo";
import { isAuthEnabled } from "@/lib/auth/feature";
import { getOptionalUser } from "@/lib/auth/session";
import {
  toCertificationItem,
  toContactItem,
  toEducationItem,
  toExperienceItem,
  toProjectItem,
  toSkillItem,
} from "@/lib/profile/items";

export const metadata = {
  title: "Import your resume",
};

/**
 * The import flow. The resume is read on the server, its contact details are
 * removed in code and the sections come back as drafts the user reviews.
 * Nothing is written until a section is saved.
 */
export default async function ImportResumePage() {
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

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Import your resume
        </h1>
        <p className="text-sm text-muted max-w-2xl leading-relaxed">
          Bring in what is already written, then correct it. You decide what
          stays.
        </p>
      </header>

      <ImportResumeFlow
        existing={{
          profile: toContactItem(profileRow),
          experience: experience.map((row) => toExperienceItem(row)),
          projects: projects.map((row) => toProjectItem(row)),
          skills: skills.map((row) => toSkillItem(row)),
          education: education.map((row) => toEducationItem(row)),
          certifications: certifications.map((row) => toCertificationItem(row)),
        }}
      />
    </div>
  );
}
