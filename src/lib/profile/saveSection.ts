import type { Db } from "@/db/client";
import type { Repos } from "@/db/repo";
import { withTransaction } from "@/db/repo/transaction";
import { ConflictError } from "@/lib/errors";
import type { ProfileInput, SkillEvidenceRef, SkillInput } from "@/lib/schemas";

import { evidenceTextOf, matchSkillEvidence } from "./evidence";
import type { ProfileSectionKey, ProfileSectionSave } from "./schemas";

/**
 * Saving one profile section.
 *
 * A section is saved in one transaction: the rows that are new are created,
 * the rows that changed are updated with an optimistic lock and the rows the
 * user removed are deleted. If any row was changed somewhere else the whole
 * section is rolled back and a `ConflictError` is raised, which the API turns
 * into a friendly "changed elsewhere, reload" message.
 */

export interface SavedRow {
  id: string;
  version: number;
}

export interface SavedSection {
  section: ProfileSectionKey;
  rows: SavedRow[];
}

interface SectionRepo<TInput> {
  list(userId: string): Promise<{ id: string; version: number }[]>;
  create(userId: string, input: TInput): Promise<{ id: string; version: number }>;
  update(
    userId: string,
    id: string,
    patch: Partial<TInput>,
    version: number,
  ): Promise<{ id: string; version: number }>;
  remove(userId: string, id: string): Promise<boolean>;
}

type SectionItem = { id?: string; version?: number; sortOrder?: number };

/**
 * Creates, updates and deletes the rows of one section. The order of the
 * array is the order of the rows.
 */
async function saveList<TInput extends SectionItem>(
  repo: SectionRepo<TInput>,
  userId: string,
  items: TInput[],
): Promise<SavedRow[]> {
  const existing = await repo.list(userId);
  const existingById = new Map(existing.map((row) => [row.id, row]));
  const saved: SavedRow[] = [];

  for (const [index, item] of items.entries()) {
    const payload = { ...item, sortOrder: index } as TInput;

    if (item.id) {
      const current = existingById.get(item.id);
      if (!current) {
        throw new ConflictError(
          "This entry was removed somewhere else. Reload and try again.",
        );
      }
      const updated = await repo.update(
        userId,
        item.id,
        payload,
        item.version ?? current.version,
      );
      saved.push({ id: updated.id, version: updated.version });
    } else {
      const created = await repo.create(userId, payload);
      saved.push({ id: created.id, version: created.version });
    }
  }

  const keep = new Set(
    items.map((item) => item.id).filter((id): id is string => Boolean(id)),
  );
  for (const row of existing) {
    if (!keep.has(row.id)) {
      await repo.remove(userId, row.id);
    }
  }

  return saved;
}

/**
 * The evidence the server computes for a skill: the roles and projects whose
 * text mentions it. The refs the user attached by hand are kept.
 */
function mergeEvidence(
  manual: SkillEvidenceRef[],
  computed: SkillEvidenceRef[],
): SkillEvidenceRef[] {
  const manualRefs = manual.filter((ref) => ref.kind === "manual");
  const merged = [...manualRefs];

  for (const ref of computed) {
    const duplicate = merged.some(
      (existing) =>
        existing.kind === ref.kind && (existing.refId ?? "") === (ref.refId ?? ""),
    );
    if (!duplicate) merged.push(ref);
  }

  return merged.slice(0, 20);
}

async function saveSkills(
  repos: Repos,
  userId: string,
  items: (SkillInput & SectionItem)[],
): Promise<SavedRow[]> {
  const [experience, projects] = await Promise.all([
    repos.experience.list(userId),
    repos.projects.list(userId),
  ]);

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

  const prepared = items.map((item) => ({
    ...item,
    evidenceRefs: mergeEvidence(
      item.evidenceRefs ?? [],
      matchSkillEvidence(item.name, candidates),
    ),
  }));

  return saveList(repos.skills, userId, prepared);
}

/**
 * Saves one section for one user. The whole section lands in one transaction.
 */
export async function saveProfileSection(
  userId: string,
  payload: ProfileSectionSave,
  db?: Db,
): Promise<SavedSection> {
  return withTransaction(async (repos) => {
    switch (payload.section) {
      case "profile": {
        const existing = await repos.profiles.get(userId);
        if (!existing) {
          const created = await repos.profiles.create(userId, payload.profile);
          return { section: "profile", rows: [{ id: created.id, version: created.version }] };
        }
        const updated = await repos.profiles.update(
          userId,
          existing.id,
          payload.profile as Partial<ProfileInput>,
          payload.version ?? existing.version,
        );
        return { section: "profile", rows: [{ id: updated.id, version: updated.version }] };
      }
      case "experience":
        return {
          section: "experience",
          rows: await saveList(repos.experience, userId, payload.items),
        };
      case "projects":
        return {
          section: "projects",
          rows: await saveList(repos.projects, userId, payload.items),
        };
      case "skills":
        return { section: "skills", rows: await saveSkills(repos, userId, payload.items) };
      case "education":
        return {
          section: "education",
          rows: await saveList(repos.education, userId, payload.items),
        };
      case "certifications":
        return {
          section: "certifications",
          rows: await saveList(repos.certifications, userId, payload.items),
        };
    }
  }, db);
}
