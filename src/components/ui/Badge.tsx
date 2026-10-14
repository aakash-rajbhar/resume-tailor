import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "matched" | "missing" | "partial" | "neutral" | "accent";
export type BadgeSize = "sm" | "md";

const VARIANTS: Record<BadgeVariant, string> = {
  matched: "bg-green-soft text-green border-green-border",
  missing: "bg-amber-soft text-amber border-amber-border",
  partial: "bg-blue-soft text-blue border-blue/30",
  neutral: "bg-surface-2 text-muted border-line",
  accent: "bg-accent-soft text-accent border-accent/30",
};

const SIZES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-2xs gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
}

export default function Badge({
  variant = "neutral",
  size = "md",
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border font-medium max-w-full",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}
