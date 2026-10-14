"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-base">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">
          Something went wrong
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          An unexpected error interrupted the page. Your inputs were not changed.
        </p>
        {error.digest && (
          <p className="text-xs text-subtle font-mono">Reference: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center px-5 h-10 rounded-md bg-accent text-accent-contrast text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
