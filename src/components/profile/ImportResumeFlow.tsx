"use client";

import {
  AlertCircle,
  Check,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProfileContactItem,
  ProjectItem,
  SkillItem,
} from "@/lib/profile/items";
import { toSectionPayload } from "@/lib/profile/items";
import type { ProfileDrafts } from "@/lib/profile/drafts";
import type { ProfileSectionKey } from "@/lib/profile/schemas";

import {
  CertificationForm,
  ContactForm,
  EducationForm,
  ExperienceForm,
  ProjectForm,
  SkillForm,
} from "./sectionForms";

/**
 * The resume import.
 *
 * The resume is read on the server, its contact details are removed in code
 * and one small call per section produces a draft. Nothing is written to the
 * database until the user accepts the items of a section and presses Save.
 */

export interface ExistingContent {
  profile: ProfileContactItem;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
}

interface ExtractedContact {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  urls: string[];
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
}

type EditorItem =
  | ExperienceItem
  | ProjectItem
  | SkillItem
  | EducationItem
  | CertificationItem;

interface DraftState {
  contact: ProfileContactItem;
  items: Record<ProfileSectionKey, EditorItem[]>;
}

const SECTION_TITLES: Record<ProfileSectionKey, string> = {
  profile: "Profile and contact",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  certifications: "Certifications",
};

const LIST_SECTIONS: ProfileSectionKey[] = [
  "experience",
  "projects",
  "skills",
  "education",
  "certifications",
];

export default function ImportResumeFlow({
  existing,
}: {
  existing: ExistingContent;
}) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"input" | "extracting" | "review">("input");
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<{ section: string; message: string }[]>([]);
  const [modelUsed, setModelUsed] = useState("");
  const [state, setState] = useState<DraftState | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [removed, setRemoved] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<ProfileSectionKey | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);

  const extract = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setFailures([]);
    setPhase("extracting");

    try {
      const formData = new FormData();
      if (mode === "upload" && file) {
        formData.append("resumeFile", file);
      } else {
        formData.append("resumeText", text);
      }

      const response = await fetch("/api/profile/extract", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const body = (await response.json().catch(() => null)) as {
        error?: string;
        drafts?: ProfileDrafts;
        contact?: ExtractedContact;
        modelUsed?: string;
        failures?: { section: string; message: string }[];
      } | null;

      if (!response.ok || !body?.drafts) {
        setError(body?.error ?? "The resume could not be read.");
        setPhase("input");
        return;
      }

      setState(buildDraftState(body.drafts, body.contact ?? null, existing));
      setModelUsed(body.modelUsed ?? "");
      setFailures(body.failures ?? []);
      setAccepted({});
      setRemoved({});
      setEditing(null);
      setPhase("review");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("The extraction failed. Check your connection and try again.");
      setPhase("input");
    }
  }, [existing, file, mode, text]);

  const accept = useCallback((draftId: string) => {
    setAccepted((current) => ({ ...current, [draftId]: true }));
  }, []);

  const acceptAll = useCallback((draftIds: string[]) => {
    setAccepted((current) => {
      const next = { ...current };
      for (const draftId of draftIds) next[draftId] = true;
      return next;
    });
  }, []);

  const removeDraft = useCallback((draftId: string) => {
    setRemoved((current) => ({ ...current, [draftId]: true }));
    setAccepted((current) => {
      const next = { ...current };
      delete next[draftId];
      return next;
    });
  }, []);

  const updateItem = useCallback(
    (section: ProfileSectionKey, index: number, next: EditorItem) => {
      setState((current) => {
        if (!current) return current;
        const list = [...current.items[section]];
        list[index] = next;
        return { ...current, items: { ...current.items, [section]: list } };
      });
    },
    [],
  );

  const updateContact = useCallback((next: ProfileContactItem) => {
    setState((current) => (current ? { ...current, contact: next } : current));
  }, []);

  const saveSection = useCallback(
    async (section: ProfileSectionKey) => {
      if (!state) return;
      setSaving(section);
      setError(null);

      try {
        const acceptedDrafts = (() => {
          const drafts = state.items[section] ?? [];
          return drafts
            .map((item, index) => ({ item, index }))
            .filter(({ index }) => {
              const draftId = `${section}-${index + 1}`;
              return accepted[draftId] === true && removed[draftId] !== true;
            });
        })();

        const payload = (() => {
          if (section === "profile") {
            return toSectionPayload("profile", state.contact);
          }
          const existingItems = existingItemsOf(existing, section);
          return toSectionPayload(section, [
            ...existingItems,
            ...acceptedDrafts.map(({ item }) => item),
          ]);
        })();

        const response = await fetch("/api/profile/sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(
            response.status === 409
              ? "This section was changed somewhere else. Reload the page and try again."
              : (body?.error ?? "The section could not be saved."),
          );
          return;
        }

        const body = (await response.json()) as {
          rows: { id: string; version: number }[];
        };

        // The drafts that were saved are now rows. Keeping their id and
        // version means the next save updates them instead of creating a
        // second copy.
        if (section === "profile") {
          const row = body.rows[0];
          if (row) {
            setState((current) =>
              current
                ? {
                    ...current,
                    contact: { ...current.contact, id: row.id, version: row.version },
                  }
                : current,
            );
          }
        } else {
          const offset = body.rows.length - acceptedDrafts.length;
          setState((current) => {
            if (!current) return current;
            const list = [...current.items[section]];
            acceptedDrafts.forEach(({ index }, position) => {
              const row = body.rows[offset + position];
              const item = list[index];
              if (row && item) {
                list[index] = { ...item, id: row.id, version: row.version };
              }
            });
            return { ...current, items: { ...current.items, [section]: list } };
          });
        }

        setSaved((current) => ({ ...current, [section]: true }));
      } catch {
        setError("The section could not be saved. Check your connection.");
      } finally {
        setSaving(null);
      }
    },
    [accepted, existing, removed, state],
  );

  /* ---------------------------------------------------------------- *
   * The screens
   * ---------------------------------------------------------------- */

  if (phase === "input") {
    return (
      <div className="space-y-6">
        <div className="paper-card p-5 sm:p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-ink">Add your resume</h2>
            <p className="text-xs text-muted">
              Upload a PDF or DOCX, or paste the text. Nothing is saved until
              you accept the results.
            </p>
          </div>

          <div
            className="flex p-0.5 rounded-lg bg-surface-2 border border-line w-fit"
            role="tablist"
            aria-label="How to add your resume"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "upload"}
              onClick={() => setMode("upload")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                mode === "upload"
                  ? "bg-surface text-ink shadow-xs font-semibold"
                  : "text-muted hover:text-ink",
              )}
            >
              Upload a file
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "paste"}
              onClick={() => setMode("paste")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                mode === "paste"
                  ? "bg-surface text-ink shadow-xs font-semibold"
                  : "text-muted hover:text-ink",
              )}
            >
              Paste text
            </button>
          </div>

          {mode === "upload" ? (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors">
                <UploadCloud size={22} className="text-muted" aria-hidden />
                <span className="text-xs text-muted">
                  Choose a PDF, DOCX or TXT file
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="text-xs text-muted file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border file:border-line file:bg-surface file:text-ink file:text-xs"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
              {file ? (
                <p className="text-xs text-muted flex items-center gap-2">
                  <FileText size={13} aria-hidden />
                  {file.name}
                </p>
              ) : null}
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={12}
              aria-label="Resume text"
              placeholder="Paste the full text of your resume here."
              className="w-full p-4 rounded-xl border border-line bg-surface text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-sans"
            />
          )}

          {error ? (
            <p className="text-xs text-danger flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void extract()}
              disabled={mode === "upload" ? !file : text.trim().length < 30}
            >
              Extract my profile
            </Button>
            <Link
              href="/profile/edit/profile"
              className="text-xs font-medium text-accent hover:underline"
            >
              Skip, I&apos;ll enter it manually
            </Link>
          </div>
        </div>

        <div className="paper-card p-5 space-y-2">
          <p className="text-xs font-semibold text-ink">What leaves your device</p>
          <p className="text-xs text-muted leading-relaxed">
            Your email address, phone number and links are read here in the
            server code and removed before the text is sent. What still goes to
            the model is your name, your location, your employers, job titles,
            dates, bullets, projects, schools and skills. The file itself is
            never stored.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "extracting") {
    return (
      <div className="paper-card p-10 flex flex-col items-center gap-3 text-center">
        <Loader2 size={22} className="animate-spin text-accent" aria-hidden />
        <p className="text-sm font-medium text-ink">Reading your resume</p>
        <p className="text-xs text-muted max-w-sm leading-relaxed">
          Six small passes, one per section. This takes a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="paper-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Review what was found</h2>
          {modelUsed ? (
            <Badge variant="neutral" size="sm">
              {modelUsed}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Nothing is saved yet. Accept the items you want to keep, edit what is
          wrong, then save a section. An empty field means the resume did not
          state it.
        </p>
        {failures.length > 0 ? (
          <p className="text-xs text-amber">
            {failures.length} section{failures.length === 1 ? "" : "s"} could
            not be read. You can fill{" "}
            {failures.length === 1 ? "it" : "them"} in by hand.
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-danger flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>

      <ProfileSection
        section="profile"
        state={state}
        accepted={accepted}
        removed={removed}
        editing={editing}
        saved={saved}
        saving={saving}
        onEdit={setEditing}
        onAccept={accept}
        onAcceptAll={acceptAll}
        onRemove={removeDraft}
        onUpdateContact={updateContact}
        onSave={saveSection}
      />

      {LIST_SECTIONS.map((section) => (
        <ProfileSection
          key={section}
          section={section}
          state={state}
          accepted={accepted}
          removed={removed}
          editing={editing}
          saved={saved}
          saving={saving}
          onEdit={setEditing}
          onAccept={accept}
          onAcceptAll={acceptAll}
          onRemove={removeDraft}
          onUpdateItem={updateItem}
          onSave={saveSection}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The review of one section
 * ------------------------------------------------------------------ */

function ProfileSection({
  section,
  state,
  accepted,
  removed,
  editing,
  saved,
  saving,
  onEdit,
  onAccept,
  onAcceptAll,
  onRemove,
  onUpdateItem,
  onUpdateContact,
  onSave,
}: {
  section: ProfileSectionKey;
  state: DraftState | null;
  accepted: Record<string, boolean>;
  removed: Record<string, boolean>;
  editing: string | null;
  saved: Record<string, boolean>;
  saving: ProfileSectionKey | null;
  onEdit: (draftId: string | null) => void;
  onAccept: (draftId: string) => void;
  onAcceptAll: (draftIds: string[]) => void;
  onRemove: (draftId: string) => void;
  onUpdateItem?: (section: ProfileSectionKey, index: number, next: EditorItem) => void;
  onUpdateContact?: (next: ProfileContactItem) => void;
  onSave: (section: ProfileSectionKey) => void;
}) {
  const items = (state?.items[section] ?? []) as EditorItem[];
  const draftIds = items.map((_, index) => `${section}-${index + 1}`);
  const acceptedCount = draftIds.filter(
    (draftId) => accepted[draftId] === true,
  ).length;

  return (
    <section className="paper-card p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">
            {SECTION_TITLES[section]}
          </h3>
          {acceptedCount > 0 ? (
            <Badge variant="matched" size="sm">
              {acceptedCount} accepted
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {draftIds.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onAcceptAll(draftIds)}
            >
              Confirm all
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            loading={saving === section}
            disabled={section !== "profile" && acceptedCount === 0}
            onClick={() => onSave(section)}
          >
            {saved[section] ? "Saved" : "Save section"}
          </Button>
        </div>
      </div>

      {section === "profile" ? (
        state ? (
          <div className="space-y-3">
            <FieldList
              rows={[
                ["Name", state.contact.fullName],
                ["Email", state.contact.email],
                ["Phone", state.contact.phone],
                ["Location", state.contact.location],
                ["Headline", state.contact.headline],
                ["Summary", state.contact.summary],
                ["GitHub", state.contact.githubUrl],
                ["LinkedIn", state.contact.linkedinUrl],
                ["Portfolio", state.contact.portfolioUrl],
              ]}
            />
            {editing === "profile" ? (
              <div className="space-y-3">
                <ContactForm
                  item={state.contact}
                  onChange={(next) => onUpdateContact?.(next)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(null)}
                >
                  Done editing
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={<Pencil size={13} />}
                onClick={() => onEdit("profile")}
              >
                Edit the profile
              </Button>
            )}
          </div>
        ) : null
      ) : null}

      {section !== "profile"
        ? items.map((item, index) => {
            const draftId = `${section}-${index + 1}`;
            const isAccepted = accepted[draftId] === true;
            const isRemoved = removed[draftId] === true;

            if (isRemoved) return null;

            return (
              <div
                key={draftId}
                className={cn(
                  "border rounded-xl p-4 space-y-3",
                  isAccepted
                    ? "border-green-border bg-green-soft/30"
                    : "border-line bg-surface",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={isAccepted ? "matched" : "partial"} size="sm">
                    {isAccepted ? "Accepted" : "Needs confirmation"}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={isAccepted ? "ghost" : "secondary"}
                      icon={isAccepted ? <Check size={13} /> : undefined}
                      onClick={() => onAccept(draftId)}
                    >
                      {isAccepted ? "Accepted" : "Accept"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={<Pencil size={13} />}
                      onClick={() =>
                        onEdit(editing === draftId ? null : draftId)
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 size={13} />}
                      onClick={() => onRemove(draftId)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {editing === draftId ? (
                  <div className="space-y-3">
                    <DraftEditor
                      section={section}
                      item={item}
                      onChange={(next) => onUpdateItem?.(section, index, next)}
                      onDone={() => onEdit(null)}
                    />
                  </div>
                ) : (
                  <DraftSummary section={section} item={item} />
                )}
              </div>
            );
          })
        : null}

      {section !== "profile" && items.length === 0 ? (
        <p className="text-xs text-muted">
          Nothing was found in this section. Add it by hand in the editor.
        </p>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Read-only views of a draft
 * ------------------------------------------------------------------ */

function FieldList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="space-y-0.5">
          <dt className="text-2xs uppercase tracking-wide text-subtle">{label}</dt>
          <dd
            className={cn(
              "text-xs whitespace-pre-line",
              value ? "text-ink" : "text-subtle italic",
            )}
          >
            {value || "Not stated"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DraftSummary({
  section,
  item,
}: {
  section: ProfileSectionKey;
  item: EditorItem;
}) {
  switch (section) {
    case "experience": {
      const role = item as ExperienceItem;
      return (
        <FieldList
          rows={[
            ["Company", role.company],
            ["Title", role.title],
            ["Location", role.location],
            [
              "Dates",
              `${role.startDate || "not stated"} – ${role.isCurrent ? "present" : role.endDate || "not stated"}`,
            ],
            ["Description", role.description],
            ["Bullets", role.bullets.join("\n")],
          ]}
        />
      );
    }
    case "projects": {
      const project = item as ProjectItem;
      return (
        <FieldList
          rows={[
            ["Name", project.name],
            ["Summary", project.summary],
            ["Tools", project.tools.join(", ")],
            ["Bullets", project.bullets.join("\n")],
          ]}
        />
      );
    }
    case "skills": {
      const skill = item as SkillItem;
      return (
        <FieldList
          rows={[
            ["Skill", skill.name],
            ["Group", skill.groupLabel],
          ]}
        />
      );
    }
    case "education": {
      const education = item as EducationItem;
      return (
        <FieldList
          rows={[
            ["School", education.school],
            ["Degree", education.degree],
            ["Field of study", education.fieldOfStudy],
            [
              "Dates",
              `${education.startDate || "not stated"} – ${education.endDate || "not stated"}`,
            ],
          ]}
        />
      );
    }
    case "certifications": {
      const certification = item as CertificationItem;
      return (
        <FieldList
          rows={[
            ["Name", certification.name],
            ["Issuer", certification.issuer],
            ["Issued", certification.issuedOn],
          ]}
        />
      );
    }
    default:
      return null;
  }
}

function DraftEditor({
  section,
  item,
  onChange,
  onDone,
}: {
  section: ProfileSectionKey;
  item: EditorItem;
  onChange: (next: EditorItem) => void;
  onDone: () => void;
}) {
  const items = [item];
  const set = (next: EditorItem[]) => onChange(next[0]);

  switch (section) {
    case "experience":
      return (
        <div className="space-y-3">
          <ExperienceForm items={items as ExperienceItem[]} onChange={set} />
          <Button type="button" size="sm" variant="secondary" onClick={onDone}>
            Done editing
          </Button>
        </div>
      );
    case "projects":
      return (
        <div className="space-y-3">
          <ProjectForm items={items as ProjectItem[]} onChange={set} />
          <Button type="button" size="sm" variant="secondary" onClick={onDone}>
            Done editing
          </Button>
        </div>
      );
    case "skills":
      return (
        <div className="space-y-3">
          <SkillForm items={items as SkillItem[]} onChange={set} targets={[]} />
          <Button type="button" size="sm" variant="secondary" onClick={onDone}>
            Done editing
          </Button>
        </div>
      );
    case "education":
      return (
        <div className="space-y-3">
          <EducationForm items={items as EducationItem[]} onChange={set} />
          <Button type="button" size="sm" variant="secondary" onClick={onDone}>
            Done editing
          </Button>
        </div>
      );
    case "certifications":
      return (
        <div className="space-y-3">
          <CertificationForm
            items={items as CertificationItem[]}
            onChange={set}
          />
          <Button type="button" size="sm" variant="secondary" onClick={onDone}>
            Done editing
          </Button>
        </div>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ *
 * Turning the extraction into editable items
 * ------------------------------------------------------------------ */

/** The rows that are already saved for a section. */
function existingItemsOf(
  existing: ExistingContent,
  section: ProfileSectionKey,
): EditorItem[] {
  switch (section) {
    case "experience":
      return existing.experience;
    case "projects":
      return existing.projects;
    case "skills":
      return existing.skills;
    case "education":
      return existing.education;
    case "certifications":
      return existing.certifications;
    default:
      return [];
  }
}

function buildDraftState(
  drafts: ProfileDrafts,
  contact: ExtractedContact | null,
  existing: ExistingContent,
): DraftState {
  const experience: ExperienceItem[] = drafts.experience.map((draft) => ({
    id: null,
    version: 1,
    company: draft.company,
    title: draft.title,
    location: draft.location,
    employmentType: "other",
    startDate: draft.startDate.iso ?? "",
    endDate: draft.endDate.iso ?? "",
    isCurrent: draft.isCurrent,
    description: "",
    bullets: draft.bullets,
  }));

  const projects: ProjectItem[] = drafts.projects.map((draft) => ({
    id: null,
    version: 1,
    name: draft.name,
    summary: draft.summary,
    url: "",
    source: "manual",
    githubRepoId: "",
    importance: 3,
    includeByDefault: true,
    confirmed: true,
    tools: draft.tools,
    bullets: draft.bullets,
    startDate: draft.startDate.iso ?? "",
    endDate: draft.endDate.iso ?? "",
  }));

  const skills: SkillItem[] = drafts.skills.map((draft) => ({
    id: null,
    version: 1,
    groupLabel: draft.groupLabel,
    name: draft.name,
    evidenceRefs: [],
  }));

  const education: EducationItem[] = drafts.education.map((draft) => ({
    id: null,
    version: 1,
    school: draft.school,
    degree: draft.degree,
    fieldOfStudy: draft.fieldOfStudy,
    startDate: draft.startDate.iso ?? "",
    endDate: draft.endDate.iso ?? "",
  }));

  const certifications: CertificationItem[] = drafts.certifications.map(
    (draft) => ({
      id: null,
      version: 1,
      name: draft.name,
      issuer: draft.issuer,
      issuedOn: draft.issuedOn.iso ?? "",
      url: "",
    }),
  );

  const profile: ProfileContactItem = {
    ...existing.profile,
    fullName: contact?.fullName || existing.profile.fullName,
    email: contact?.email || existing.profile.email,
    phone: contact?.phone || existing.profile.phone,
    githubUrl: contact?.githubUrl || existing.profile.githubUrl,
    linkedinUrl: contact?.linkedinUrl || existing.profile.linkedinUrl,
    portfolioUrl: contact?.portfolioUrl || existing.profile.portfolioUrl,
    location: drafts.summary.location || existing.profile.location,
    headline: drafts.summary.headline || existing.profile.headline,
    summary: drafts.summary.summary || existing.profile.summary,
  };

  return {
    contact: profile,
    items: {
      profile: [],
      experience,
      projects,
      skills,
      education,
      certifications,
    },
  };
}
