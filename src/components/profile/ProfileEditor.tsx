"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { toSectionPayload } from "@/lib/profile/items";
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProfileContactItem,
  ProjectItem,
  SkillItem,
} from "@/lib/profile/items";
import type { ProfileSectionKey } from "@/lib/profile/schemas";

import {
  CertificationForm,
  ContactForm,
  EducationForm,
  ExperienceForm,
  ProjectForm,
  SkillForm,
  type EvidenceTarget,
} from "./sectionForms";

/**
 * The profile editor.
 *
 * One section at a time. Changes are staged locally, saved automatically a
 * moment after you stop typing, and written in one transaction through the
 * API. When the section was changed somewhere else the API answers with a
 * conflict and the screen asks you to reload instead of overwriting.
 */

type EditorItem =
  | ExperienceItem
  | ProjectItem
  | SkillItem
  | EducationItem
  | CertificationItem;

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";

const AUTOSAVE_DELAY_MS = 1200;

export interface ProfileEditorProps {
  section: ProfileSectionKey;
  /** The saved rows of the section. */
  items: EditorItem[];
  /** The saved profile, for the profile section. */
  profile?: ProfileContactItem | null;
  /** The roles and projects a skill can be attached to. */
  targets?: EvidenceTarget[];
  /** The evidence the server computed for each skill, keyed by skill name. */
  computedEvidence?: Record<string, string[]>;
}

export default function ProfileEditor({
  section,
  items,
  profile = null,
  targets = [],
  computedEvidence = {},
}: ProfileEditorProps) {
  const [rows, setRows] = useState<EditorItem[]>(items);
  const [contact, setContact] = useState<ProfileContactItem | null>(profile);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const markDirty = useCallback(() => {
    setStatus("dirty");
    setRevision((value) => value + 1);
  }, []);

  const save = useCallback(async () => {
    if (savingRef.current) return;
    if (section === "profile" && !contact) return;
    savingRef.current = true;
    setStatus("saving");

    try {
      const payload =
        section === "profile"
          ? toSectionPayload("profile", contact)
          : toSectionPayload(section, rows);

      const response = await fetch("/api/profile/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        if (mountedRef.current) {
          setStatus("conflict");
          setMessage(
            "This section was changed somewhere else. Reload the page to pick up the latest version before saving again.",
          );
        }
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (mountedRef.current) {
          setStatus("error");
          setMessage(body?.error ?? "Your changes could not be saved.");
        }
        return;
      }

      const saved = (await response.json()) as {
        section: ProfileSectionKey;
        rows: { id: string; version: number }[];
      };

      if (!mountedRef.current) return;

      if (section === "profile") {
        const row = saved.rows[0];
        setContact((current) =>
          current && row ? { ...current, id: row.id, version: row.version } : current,
        );
      } else {
        setRows((current) =>
          current.map((item, index) => {
            const row = saved.rows[index];
            return row ? { ...item, id: row.id, version: row.version } : item;
          }),
        );
      }

      setStatus("saved");
      setMessage(null);
    } catch {
      if (mountedRef.current) {
        setStatus("error");
        setMessage("Your changes could not be saved. Check your connection.");
      }
    } finally {
      savingRef.current = false;
    }
  }, [contact, rows, section]);

  // Autosave: save a moment after the last change.
  useEffect(() => {
    if (revision === 0) return;
    const timer = setTimeout(() => {
      void save();
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [revision, save]);

  // Warn before the page goes away with unsaved changes.
  useEffect(() => {
    if (status !== "dirty" && status !== "saving") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [status]);

  const hasUnsaved = status === "dirty" || status === "saving";

  const guardNavigation = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!hasUnsaved) return;
      if (!window.confirm("You have unsaved changes. Leave this page anyway?")) {
        event.preventDefault();
      }
    },
    [hasUnsaved],
  );

  const statusBadge = useMemo(() => {
    if (status === "saving") {
      return (
        <Badge variant="neutral" size="sm" icon={<Loader2 size={11} className="animate-spin" />}>
          Saving
        </Badge>
      );
    }
    if (status === "dirty") {
      return <Badge variant="partial" size="sm">Unsaved changes</Badge>;
    }
    if (status === "saved") {
      return (
        <Badge variant="matched" size="sm" icon={<Check size={11} />}>
          Saved
        </Badge>
      );
    }
    if (status === "conflict") {
      return <Badge variant="missing" size="sm">Changed elsewhere</Badge>;
    }
    if (status === "error") {
      return <Badge variant="missing" size="sm">Not saved</Badge>;
    }
    return null;
  }, [status]);

  const updateRows = useCallback(
    (next: EditorItem[]) => {
      setRows(next);
      markDirty();
    },
    [markDirty],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {statusBadge}
          {status === "error" && message ? (
            <span className="text-xs text-danger">{message}</span>
          ) : null}
          {status === "conflict" ? (
            <span className="text-xs text-muted">{message}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (hasUnsaved && !window.confirm("You have unsaved changes. Leave this page anyway?")) {
                return;
              }
              window.location.href = "/profile";
            }}
          >
            Back to profile
          </Button>
          <Button
            type="button"
            size="sm"
            loading={status === "saving"}
            disabled={status === "conflict"}
            onClick={() => void save()}
          >
            Save now
          </Button>
        </div>
      </div>

      {status === "conflict" ? (
        <div className="paper-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-amber-border">
          <p className="text-xs text-muted flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber" aria-hidden />
            {message}
          </p>
          <Link
            href="/profile"
            className="text-xs font-medium text-accent hover:underline shrink-0"
            onClick={guardNavigation}
          >
            Reload the profile
          </Link>
        </div>
      ) : null}

      {section === "profile" ? (
        contact ? (
          <ContactForm
            item={contact}
            onChange={(next) => {
              setContact(next);
              markDirty();
            }}
          />
        ) : null
      ) : null}

      {section === "experience" ? (
        <ExperienceForm
          items={rows as ExperienceItem[]}
          onChange={(next) => updateRows(next)}
        />
      ) : null}

      {section === "projects" ? (
        <ProjectForm
          items={rows as ProjectItem[]}
          onChange={(next) => updateRows(next)}
        />
      ) : null}

      {section === "skills" ? (
        <SkillForm
          items={rows as SkillItem[]}
          onChange={(next) => updateRows(next)}
          targets={targets}
          computed={computedEvidence}
        />
      ) : null}

      {section === "education" ? (
        <EducationForm
          items={rows as EducationItem[]}
          onChange={(next) => updateRows(next)}
        />
      ) : null}

      {section === "certifications" ? (
        <CertificationForm
          items={rows as CertificationItem[]}
          onChange={(next) => updateRows(next)}
        />
      ) : null}
    </div>
  );
}
