"use client";

import { useEffect } from "react";

import Button from "@/components/ui/Button";

/**
 * The error screen of the profile area. The retry button re-runs the server
 * render, so a dropped database connection does not lose the page.
 */
export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Profile route error:", error);
  }, [error]);

  return (
    <div className="paper-card p-8 max-w-md mx-auto space-y-4 text-center">
      <h1 className="text-lg font-semibold text-ink">This page did not load</h1>
      <p className="text-sm text-muted leading-relaxed">
        Nothing was changed. Try again, and if it keeps failing the profile
        database may be unreachable.
      </p>
      {error.digest ? (
        <p className="text-xs text-subtle font-mono">Reference: {error.digest}</p>
      ) : null}
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
