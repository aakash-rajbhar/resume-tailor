import { notFound, redirect } from "next/navigation";

import ProfileEditor from "@/components/profile/ProfileEditor";
import type { EvidenceTarget } from "@/components/profile/sectionForms";
import { getRepos } from "@/db/repo";
import { isAuthEnabled } from "@/lib/auth/feature";
import { getOptionalUser } from "@/lib/auth/session";
import { evidenceTextOf, matchSkillEvidence } from "@/lib/profile/evidence";
import {
  toCertificationItem,
  toContactItem,
  toEducationItem,
  toExperienceItem,
  toProjectItem,
  toSkillItem,
} from "@/lib/profile/items";
import { profileSectionKeySchema } from "@/lib/profile/schemas";

const TITLES: Record<string, string> = {
  profile: "Profile and contact",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  certifications: "Certifications",
};

/**
 * The manual editor for one section. The rows are read on the server and
 * edited in the browser; every change is saved through the API.
 */
export default async function EditProfileSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  if (!isAuthEnabled()) {
    notFound();
  }

  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }

  const { section: rawSection } = await params;
  const parsed = profileSectionKeySchema.safeParse(rawSection);
  if (!parsed.success) {
    notFound();
  }
  const section = parsed.data;

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

  const targets: EvidenceTarget[] = [
    ...experience.map((row) => ({
      id: row.id,
      label: `${row.title || "Role"} at ${row.company || "an unnamed company"}`,
    })),
    ...projects.map((row) => ({ id: row.id, label: row.name || "Project" })),
  ];

  const candidates = [
    ...experience.map((row) => ({
      kind: "experience" as const,
      refId: row.id,
      label: `${row.title || "Role"} at ${row.company || "an unnamed company"}`,
      text: evidenceTextOf(row),
    })),
    ...projects.map((row) => ({
      kind: "project" as const,
      refId: row.id,
      label: row.name || "Project",
      text: evidenceTextOf(row),
    })),
  ];

  const skillItems = skills.map((row) => toSkillItem(row));
  const computedEvidence: Record<string, string[]> = {};
  for (const skill of skillItems) {
    const refs = matchSkillEvidence(skill.name, candidates);
    computedEvidence[skill.name] = refs
      .map((ref) => ref.note)
      .filter((note): note is string => Boolean(note));
  }

  const editorProps = (() => {
    switch (section) {
      case "profile":
        return {
          section,
          items: [],
          profile: toContactItem(profileRow),
          targets,
          computedEvidence,
        };
      case "experience":
        return {
          section,
          items: experience.map((row) => toExperienceItem(row)),
          profile: null,
          targets,
          computedEvidence,
        };
      case "projects":
        return {
          section,
          items: projects.map((row) => toProjectItem(row)),
          profile: null,
          targets,
          computedEvidence,
        };
      case "skills":
        return {
          section,
          items: skillItems,
          profile: null,
          targets,
          computedEvidence,
        };
      case "education":
        return {
          section,
          items: education.map((row) => toEducationItem(row)),
          profile: null,
          targets,
          computedEvidence,
        };
      case "certifications":
        return {
          section,
          items: certifications.map((row) => toCertificationItem(row)),
          profile: null,
          targets,
          computedEvidence,
        };
    }
  })();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {TITLES[section]}
        </h1>
        <p className="text-sm text-muted">
          Changes are saved automatically a moment after you stop typing.
        </p>
      </header>

      <ProfileEditor
        section={editorProps.section}
        items={editorProps.items}
        profile={editorProps.profile}
        targets={editorProps.targets}
        computedEvidence={editorProps.computedEvidence}
      />
    </div>
  );
}
