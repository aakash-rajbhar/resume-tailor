"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProfileContactItem,
  ProjectItem,
  SkillItem,
} from "@/lib/profile/items";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

import {
  BulletList,
  Field,
  MonthInput,
  TagList,
  TextArea,
  TextInput,
  Toggle,
} from "./fields";

/**
 * The forms of the profile sections. Every section can add, edit, delete and
 * reorder its entries. The forms only edit local state; the editor above
 * them decides when to save.
 */

const ICON_BUTTON =
  "inline-flex items-center justify-center size-8 rounded-md border border-line bg-surface text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

export interface SectionFormProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  disabled?: boolean;
}

export interface EvidenceTarget {
  id: string;
  label: string;
}

function ItemShell({
  title,
  index,
  count,
  onMoveUp,
  onMoveDown,
  onRemove,
  disabled,
  badge,
  children,
}: {
  title: string;
  index: number;
  count: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  disabled?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border border-line rounded-xl bg-surface">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line bg-surface-2/40 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-ink truncate">{title}</span>
          {badge}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={ICON_BUTTON}
            aria-label={`Move ${title} up`}
            disabled={disabled || index === 0}
            onClick={onMoveUp}
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            className={ICON_BUTTON}
            aria-label={`Move ${title} down`}
            disabled={disabled || index === count - 1}
            onClick={onMoveDown}
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            className={cn(ICON_BUTTON, "hover:text-danger hover:border-danger-border")}
            aria-label={`Delete ${title}`}
            disabled={disabled}
            onClick={onRemove}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

/* ------------------------------------------------------------------ *
 * Profile
 * ------------------------------------------------------------------ */

export interface ContactFormProps {
  item: ProfileContactItem;
  onChange: (item: ProfileContactItem) => void;
  disabled?: boolean;
}

export function ContactForm({ item, onChange, disabled }: ContactFormProps) {
  const set = <K extends keyof typeof item>(key: K, value: (typeof item)[K]) =>
    onChange({ ...item, [key]: value });

  return (
    <div className="paper-card p-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="profile-name">
          <TextInput
            id="profile-name"
            value={item.fullName}
            disabled={disabled}
            onChange={(value) => set("fullName", value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </Field>
        <Field label="Headline" htmlFor="profile-headline">
          <TextInput
            id="profile-headline"
            value={item.headline}
            disabled={disabled}
            onChange={(value) => set("headline", value)}
            placeholder="Backend engineer"
          />
        </Field>
        <Field label="Email" htmlFor="profile-email">
          <TextInput
            id="profile-email"
            type="email"
            value={item.email}
            disabled={disabled}
            onChange={(value) => set("email", value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone" htmlFor="profile-phone">
          <TextInput
            id="profile-phone"
            value={item.phone}
            disabled={disabled}
            onChange={(value) => set("phone", value)}
            placeholder="+91 98765 43210"
            autoComplete="tel"
          />
        </Field>
        <Field label="Location" htmlFor="profile-location">
          <TextInput
            id="profile-location"
            value={item.location}
            disabled={disabled}
            onChange={(value) => set("location", value)}
            placeholder="Bengaluru, India"
          />
        </Field>
        <Field label="GitHub" htmlFor="profile-github">
          <TextInput
            id="profile-github"
            value={item.githubUrl}
            disabled={disabled}
            onChange={(value) => set("githubUrl", value)}
            placeholder="https://github.com/you"
          />
        </Field>
        <Field label="LinkedIn" htmlFor="profile-linkedin">
          <TextInput
            id="profile-linkedin"
            value={item.linkedinUrl}
            disabled={disabled}
            onChange={(value) => set("linkedinUrl", value)}
            placeholder="https://linkedin.com/in/you"
          />
        </Field>
        <Field label="Portfolio" htmlFor="profile-portfolio">
          <TextInput
            id="profile-portfolio"
            value={item.portfolioUrl}
            disabled={disabled}
            onChange={(value) => set("portfolioUrl", value)}
            placeholder="https://you.dev"
          />
        </Field>
      </div>

      <Field
        label="Summary"
        htmlFor="profile-summary"
        hint="Two or three lines on what you do and what you are good at."
      >
        <TextArea
          id="profile-summary"
          rows={5}
          value={item.summary}
          disabled={disabled}
          onChange={(value) => set("summary", value)}
          placeholder="Backend engineer working on payments and data services."
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Experience
 * ------------------------------------------------------------------ */

export type ExperienceFormProps = SectionFormProps<ExperienceItem>;

const EMPLOYMENT_TYPES: [ExperienceItem["employmentType"], string][] = [
  ["full_time", "Full time"],
  ["part_time", "Part time"],
  ["contract", "Contract"],
  ["internship", "Internship"],
  ["freelance", "Freelance"],
  ["other", "Other"],
];

export function ExperienceForm({
  items,
  onChange,
  disabled,
}: ExperienceFormProps) {
  const update = (index: number, patch: Partial<ExperienceItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <ItemShell
          key={item.id ?? `experience-${index}`}
          title={item.title || item.company || `Role ${index + 1}`}
          index={index}
          count={items.length}
          disabled={disabled}
          onMoveUp={() => onChange(move(items, index, -1))}
          onMoveDown={() => onChange(move(items, index, 1))}
          onRemove={() => onChange(items.filter((_, position) => position !== index))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" htmlFor={`experience-company-${index}`}>
              <TextInput
                id={`experience-company-${index}`}
                value={item.company}
                disabled={disabled}
                onChange={(value) => update(index, { company: value })}
                placeholder="Northwind Analytics"
              />
            </Field>
            <Field label="Title" htmlFor={`experience-title-${index}`}>
              <TextInput
                id={`experience-title-${index}`}
                value={item.title}
                disabled={disabled}
                onChange={(value) => update(index, { title: value })}
                placeholder="Backend Engineer"
              />
            </Field>
            <Field label="Location" htmlFor={`experience-location-${index}`}>
              <TextInput
                id={`experience-location-${index}`}
                value={item.location}
                disabled={disabled}
                onChange={(value) => update(index, { location: value })}
                placeholder="Bengaluru, India"
              />
            </Field>
            <Field label="Employment type" htmlFor={`experience-type-${index}`}>
              <select
                id={`experience-type-${index}`}
                value={item.employmentType}
                disabled={disabled}
                onChange={(event) =>
                  update(index, {
                    employmentType: event.target
                      .value as ExperienceItem["employmentType"],
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink focus:outline-none focus:border-accent transition-colors font-sans"
              >
                {EMPLOYMENT_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start" htmlFor={`experience-start-${index}`}>
              <MonthInput
                id={`experience-start-${index}`}
                value={item.startDate}
                disabled={disabled}
                onChange={(value) => update(index, { startDate: value })}
              />
            </Field>
            <Field label="End" htmlFor={`experience-end-${index}`}>
              <MonthInput
                id={`experience-end-${index}`}
                value={item.endDate}
                disabled={disabled || item.isCurrent}
                onChange={(value) => update(index, { endDate: value })}
              />
            </Field>
          </div>

          <Toggle
            id={`experience-current-${index}`}
            checked={item.isCurrent}
            disabled={disabled}
            onChange={(checked) =>
              update(index, { isCurrent: checked, endDate: checked ? "" : item.endDate })
            }
            label="I still work here"
          />

          <Field label="Description" htmlFor={`experience-description-${index}`}>
            <TextArea
              id={`experience-description-${index}`}
              rows={3}
              value={item.description}
              disabled={disabled}
              onChange={(value) => update(index, { description: value })}
              placeholder="What the role was about."
            />
          </Field>

          <Field label="Bullets" htmlFor={`experience-bullets-${index}`}>
            <BulletList
              idPrefix={`experience-bullet-${index}`}
              bullets={item.bullets}
              disabled={disabled}
              onChange={(bullets) => update(index, { bullets })}
            />
          </Field>
        </ItemShell>
      ))}

      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() =>
          onChange([
            ...items,
            {
              id: null,
              version: 1,
              company: "",
              title: "",
              location: "",
              employmentType: "full_time",
              startDate: "",
              endDate: "",
              isCurrent: false,
              description: "",
              bullets: [],
            },
          ])
        }
      >
        Add a role
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Projects
 * ------------------------------------------------------------------ */

export type ProjectFormProps = SectionFormProps<ProjectItem>;

export function ProjectForm({ items, onChange, disabled }: ProjectFormProps) {
  const update = (index: number, patch: Partial<ProjectItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <ItemShell
          key={item.id ?? `project-${index}`}
          title={item.name || `Project ${index + 1}`}
          index={index}
          count={items.length}
          disabled={disabled}
          badge={
            item.source === "github" ? (
              <Badge variant="accent" size="sm">
                GitHub
              </Badge>
            ) : null
          }
          onMoveUp={() => onChange(move(items, index, -1))}
          onMoveDown={() => onChange(move(items, index, 1))}
          onRemove={() => onChange(items.filter((_, position) => position !== index))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor={`project-name-${index}`}>
              <TextInput
                id={`project-name-${index}`}
                value={item.name}
                disabled={disabled}
                onChange={(value) => update(index, { name: value })}
                placeholder="Ledger CLI"
              />
            </Field>
            <Field label="Link" htmlFor={`project-url-${index}`}>
              <TextInput
                id={`project-url-${index}`}
                value={item.url}
                disabled={disabled}
                onChange={(value) => update(index, { url: value })}
                placeholder="https://github.com/you/ledger"
              />
            </Field>
            <Field label="Start" htmlFor={`project-start-${index}`}>
              <MonthInput
                id={`project-start-${index}`}
                value={item.startDate}
                disabled={disabled}
                onChange={(value) => update(index, { startDate: value })}
              />
            </Field>
            <Field label="End" htmlFor={`project-end-${index}`}>
              <MonthInput
                id={`project-end-${index}`}
                value={item.endDate}
                disabled={disabled}
                onChange={(value) => update(index, { endDate: value })}
              />
            </Field>
          </div>

          <Field label="Summary" htmlFor={`project-summary-${index}`}>
            <TextArea
              id={`project-summary-${index}`}
              rows={3}
              value={item.summary}
              disabled={disabled}
              onChange={(value) => update(index, { summary: value })}
              placeholder="What the project does."
            />
          </Field>

          <Field label="Tools" htmlFor={`project-tools-${index}`}>
            <TagList
              idPrefix={`project-tool-${index}`}
              values={item.tools}
              disabled={disabled}
              onChange={(tools) => update(index, { tools })}
              placeholder="TypeScript"
            />
          </Field>

          <Field label="Bullets" htmlFor={`project-bullets-${index}`}>
            <BulletList
              idPrefix={`project-bullet-${index}`}
              bullets={item.bullets}
              disabled={disabled}
              onChange={(bullets) => update(index, { bullets })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Importance"
              htmlFor={`project-importance-${index}`}
              hint="1 is the least important, 5 the most."
            >
              <select
                id={`project-importance-${index}`}
                value={String(item.importance)}
                disabled={disabled}
                onChange={(event) =>
                  update(index, { importance: Number(event.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink focus:outline-none focus:border-accent transition-colors font-sans"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={String(value)}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
            <div className="space-y-2 pt-5">
              <Toggle
                id={`project-include-${index}`}
                checked={item.includeByDefault}
                disabled={disabled}
                onChange={(checked) => update(index, { includeByDefault: checked })}
                label="Include in tailored resumes"
              />
            </div>
          </div>
        </ItemShell>
      ))}

      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() =>
          onChange([
            ...items,
            {
              id: null,
              version: 1,
              name: "",
              summary: "",
              url: "",
              source: "manual",
              githubRepoId: "",
              importance: 3,
              includeByDefault: true,
              confirmed: true,
              tools: [],
              bullets: [],
              startDate: "",
              endDate: "",
            },
          ])
        }
      >
        Add a project
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Skills
 * ------------------------------------------------------------------ */

export interface SkillFormProps extends SectionFormProps<SkillItem> {
  /** The roles and projects a skill can be attached to. */
  targets: EvidenceTarget[];
  /** The evidence the server computed for each skill, keyed by skill name. */
  computed?: Record<string, string[]>;
}

/** The skills of one category, with the positions they hold in the list. */
interface SkillGroup {
  label: string;
  indices: number[];
}

/** Groups the skills by their category, keeping the order inside a group. */
function groupSkills(items: SkillItem[]): SkillGroup[] {
  const groups: SkillGroup[] = [];

  for (const [index, item] of items.entries()) {
    const label = item.groupLabel.trim() || "Other";
    const group = groups.find((entry) => entry.label === label);
    if (group) {
      group.indices.push(index);
    } else {
      groups.push({ label, indices: [index] });
    }
  }

  return groups;
}

/** Swaps two skills inside the same category. */
function moveInGroup(
  items: SkillItem[],
  indices: number[],
  position: number,
  direction: -1 | 1,
): SkillItem[] {
  const target = position + direction;
  if (target < 0 || target >= indices.length) return items;

  const next = [...items];
  const from = indices[position];
  const to = indices[target];
  const moved = next[from];
  next[from] = next[to];
  next[to] = moved;
  return next;
}

export function SkillForm({
  items,
  onChange,
  disabled,
  targets,
  computed = {},
}: SkillFormProps) {
  const update = (index: number, patch: Partial<SkillItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const attach = (index: number, target: EvidenceTarget) => {
    const item = items[index];
    const already = item.evidenceRefs.some(
      (ref) => ref.kind === "manual" && ref.refId === target.id,
    );
    if (already) return;
    update(index, {
      evidenceRefs: [
        ...item.evidenceRefs,
        { kind: "manual", refId: target.id, note: target.label },
      ],
    });
  };

  const detach = (index: number, refIndex: number) => {
    const item = items[index];
    update(index, {
      evidenceRefs: item.evidenceRefs.filter(
        (_, position) => position !== refIndex,
      ),
    });
  };

  return (
    <div className="space-y-4">
      {groupSkills(items).map((group) => (
        <div key={group.label} className="space-y-3">
          <p className="text-2xs uppercase tracking-wide text-subtle">
            {group.label}
          </p>

          {group.indices.map((index, position) => {
            const item = items[index];
            const notes = item.evidenceRefs
              .map((ref) => ref.note)
              .filter((note): note is string => Boolean(note));
            const computedNotes = computed[item.name] ?? [];
            const allNotes = [...new Set([...computedNotes, ...notes])];
            const hasEvidence = allNotes.length > 0;

            return (
              <ItemShell
                key={item.id ?? `skill-${index}`}
                title={item.name || `Skill ${index + 1}`}
                index={position}
                count={group.indices.length}
                disabled={disabled}
                badge={
                  hasEvidence ? null : (
                    <Badge variant="missing" size="sm">
                      No evidence
                    </Badge>
                  )
                }
                onMoveUp={() =>
                  onChange(moveInGroup(items, group.indices, position, -1))
                }
                onMoveDown={() =>
                  onChange(moveInGroup(items, group.indices, position, 1))
                }
                onRemove={() =>
                  onChange(items.filter((_, position) => position !== index))
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Skill" htmlFor={`skill-name-${index}`}>
                    <TextInput
                      id={`skill-name-${index}`}
                      value={item.name}
                      disabled={disabled}
                      onChange={(value) => update(index, { name: value })}
                      placeholder="TypeScript"
                    />
                  </Field>
                  <Field label="Group" htmlFor={`skill-group-${index}`}>
                    <TextInput
                      id={`skill-group-${index}`}
                      value={item.groupLabel}
                      disabled={disabled}
                      onChange={(value) => update(index, { groupLabel: value })}
                      placeholder="Languages"
                    />
                  </Field>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted">Evidence</p>
                  {hasEvidence ? (
                    <ul className="space-y-1">
                      {allNotes.map((note) => (
                        <li
                          key={note}
                          className="text-xs text-ink flex items-center gap-2"
                        >
                          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                          {note}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-subtle">
                      No role or project mentions this skill yet.
                    </p>
                  )}

                  {item.evidenceRefs.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.evidenceRefs.map((ref, refIndex) => (
                        <button
                          key={`${ref.kind}-${ref.refId}-${refIndex}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => detach(index, refIndex)}
                          className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface-2 px-2 py-1 text-2xs text-muted hover:text-danger hover:border-danger-border transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {ref.note || ref.kind}
                          <Trash2 size={11} />
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {targets.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-2xs text-subtle">Attach evidence:</span>
                      {targets.slice(0, 12).map((target) => (
                        <button
                          key={target.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => attach(index, target)}
                          className="rounded-sm border border-line bg-surface px-2 py-1 text-2xs text-muted hover:text-ink hover:border-accent transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {target.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </ItemShell>
            );
          })}
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() =>
          onChange([
            ...items,
            {
              id: null,
              version: 1,
              groupLabel: "",
              name: "",
              evidenceRefs: [],
            },
          ])
        }
      >
        Add a skill
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Education
 * ------------------------------------------------------------------ */

export type EducationFormProps = SectionFormProps<EducationItem>;

export function EducationForm({
  items,
  onChange,
  disabled,
}: EducationFormProps) {
  const update = (index: number, patch: Partial<EducationItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <ItemShell
          key={item.id ?? `education-${index}`}
          title={item.school || `Education ${index + 1}`}
          index={index}
          count={items.length}
          disabled={disabled}
          onMoveUp={() => onChange(move(items, index, -1))}
          onMoveDown={() => onChange(move(items, index, 1))}
          onRemove={() => onChange(items.filter((_, position) => position !== index))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School" htmlFor={`education-school-${index}`}>
              <TextInput
                id={`education-school-${index}`}
                value={item.school}
                disabled={disabled}
                onChange={(value) => update(index, { school: value })}
                placeholder="Anna University"
              />
            </Field>
            <Field label="Degree" htmlFor={`education-degree-${index}`}>
              <TextInput
                id={`education-degree-${index}`}
                value={item.degree}
                disabled={disabled}
                onChange={(value) => update(index, { degree: value })}
                placeholder="Bachelor of Engineering"
              />
            </Field>
            <Field label="Field of study" htmlFor={`education-field-${index}`}>
              <TextInput
                id={`education-field-${index}`}
                value={item.fieldOfStudy}
                disabled={disabled}
                onChange={(value) => update(index, { fieldOfStudy: value })}
                placeholder="Computer Science"
              />
            </Field>
            <Field label="Start" htmlFor={`education-start-${index}`}>
              <MonthInput
                id={`education-start-${index}`}
                value={item.startDate}
                disabled={disabled}
                onChange={(value) => update(index, { startDate: value })}
              />
            </Field>
            <Field label="End" htmlFor={`education-end-${index}`}>
              <MonthInput
                id={`education-end-${index}`}
                value={item.endDate}
                disabled={disabled}
                onChange={(value) => update(index, { endDate: value })}
              />
            </Field>
          </div>
        </ItemShell>
      ))}

      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() =>
          onChange([
            ...items,
            {
              id: null,
              version: 1,
              school: "",
              degree: "",
              fieldOfStudy: "",
              startDate: "",
              endDate: "",
            },
          ])
        }
      >
        Add education
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Certifications
 * ------------------------------------------------------------------ */

export type CertificationFormProps = SectionFormProps<CertificationItem>;

export function CertificationForm({
  items,
  onChange,
  disabled,
}: CertificationFormProps) {
  const update = (index: number, patch: Partial<CertificationItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <ItemShell
          key={item.id ?? `certification-${index}`}
          title={item.name || `Certification ${index + 1}`}
          index={index}
          count={items.length}
          disabled={disabled}
          onMoveUp={() => onChange(move(items, index, -1))}
          onMoveDown={() => onChange(move(items, index, 1))}
          onRemove={() => onChange(items.filter((_, position) => position !== index))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor={`certification-name-${index}`}>
              <TextInput
                id={`certification-name-${index}`}
                value={item.name}
                disabled={disabled}
                onChange={(value) => update(index, { name: value })}
                placeholder="AWS Certified Developer"
              />
            </Field>
            <Field label="Issuer" htmlFor={`certification-issuer-${index}`}>
              <TextInput
                id={`certification-issuer-${index}`}
                value={item.issuer}
                disabled={disabled}
                onChange={(value) => update(index, { issuer: value })}
                placeholder="Amazon Web Services"
              />
            </Field>
            <Field label="Issued" htmlFor={`certification-issued-${index}`}>
              <MonthInput
                id={`certification-issued-${index}`}
                value={item.issuedOn}
                disabled={disabled}
                onChange={(value) => update(index, { issuedOn: value })}
              />
            </Field>
            <Field label="Link" htmlFor={`certification-url-${index}`}>
              <TextInput
                id={`certification-url-${index}`}
                value={item.url}
                disabled={disabled}
                onChange={(value) => update(index, { url: value })}
                placeholder="https://example.com/certificate"
              />
            </Field>
          </div>
        </ItemShell>
      ))}

      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() =>
          onChange([
            ...items,
            {
              id: null,
              version: 1,
              name: "",
              issuer: "",
              issuedOn: "",
              url: "",
            },
          ])
        }
      >
        Add a certification
      </Button>
    </div>
  );
}
