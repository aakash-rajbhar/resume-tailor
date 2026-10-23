"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * The form primitives of the profile builder. They use the design tokens
 * only, and every control has a label so the screens stay usable with a
 * keyboard and with a screen reader.
 */

const CONTROL =
  "w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-accent transition-colors font-sans";

const ICON_BUTTON =
  "inline-flex items-center justify-center size-8 rounded-md border border-line bg-surface text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-muted"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-2xs text-subtle leading-relaxed">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  id,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  type = "text",
  disabled,
  maxLength,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      disabled={disabled}
      maxLength={maxLength}
      autoComplete={autoComplete}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(CONTROL, disabled && "opacity-60")}
    />
  );
}

export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled,
  maxLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      rows={rows}
      disabled={disabled}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={cn(CONTROL, "resize-y leading-relaxed", disabled && "opacity-60")}
    />
  );
}

/**
 * A month picker. The value is always `YYYY-MM`; an empty value means the
 * date is not set.
 */
export function MonthInput({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="month"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(CONTROL, disabled && "opacity-60")}
    />
  );
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-accent cursor-pointer disabled:opacity-50"
      />
      <label htmlFor={id} className="text-xs text-ink cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}

/**
 * An editable list of bullets. Each bullet is its own field, with controls
 * to add, remove and move a line.
 */
export function BulletList({
  idPrefix,
  bullets,
  onChange,
  placeholder = "What did you do?",
  disabled,
}: {
  idPrefix: string;
  bullets: string[];
  onChange: (bullets: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const update = (index: number, value: string) => {
    const next = [...bullets];
    next[index] = value;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(bullets.filter((_, position) => position !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= bullets.length) return;
    const next = [...bullets];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {bullets.map((bullet, index) => (
        <div key={`${idPrefix}-${index}`} className="flex items-start gap-2">
          <textarea
            id={`${idPrefix}-${index}`}
            value={bullet}
            rows={2}
            disabled={disabled}
            aria-label={`Bullet ${index + 1}`}
            placeholder={placeholder}
            onChange={(event) => update(index, event.target.value)}
            className={cn(CONTROL, "resize-y leading-relaxed")}
          />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              className={ICON_BUTTON}
              aria-label={`Move bullet ${index + 1} up`}
              disabled={disabled || index === 0}
              onClick={() => move(index, -1)}
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              className={ICON_BUTTON}
              aria-label={`Move bullet ${index + 1} down`}
              disabled={disabled || index === bullets.length - 1}
              onClick={() => move(index, 1)}
            >
              <ChevronDown size={14} />
            </button>
            <button
              type="button"
              className={cn(ICON_BUTTON, "hover:text-danger hover:border-danger-border")}
              aria-label={`Remove bullet ${index + 1}`}
              disabled={disabled}
              onClick={() => remove(index)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline cursor-pointer disabled:opacity-50"
        disabled={disabled}
        onClick={() => onChange([...bullets, ""])}
      >
        <Plus size={13} />
        Add a bullet
      </button>
    </div>
  );
}

/**
 * A list of short values, such as the tools of a project.
 */
export function TagList({
  idPrefix,
  values,
  onChange,
  placeholder = "Add a value",
  disabled,
}: {
  idPrefix: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const update = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {values.map((value, index) => (
        <div key={`${idPrefix}-${index}`} className="flex items-center gap-2">
          <input
            id={`${idPrefix}-${index}`}
            type="text"
            value={value}
            disabled={disabled}
            aria-label={`Value ${index + 1}`}
            placeholder={placeholder}
            onChange={(event) => update(index, event.target.value)}
            className={cn(CONTROL, "flex-1")}
          />
          <button
            type="button"
            className={cn(ICON_BUTTON, "hover:text-danger hover:border-danger-border")}
            aria-label={`Remove value ${index + 1}`}
            disabled={disabled}
            onClick={() => onChange(values.filter((_, position) => position !== index))}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline cursor-pointer disabled:opacity-50"
        disabled={disabled}
        onClick={() => onChange([...values, ""])}
      >
        <Plus size={13} />
        Add
      </button>
    </div>
  );
}
