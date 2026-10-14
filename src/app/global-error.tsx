"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#f3efe6",
          color: "#1a1917",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
            The app failed to load
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6e6e6e", lineHeight: 1.6 }}>
            A critical error prevented the application from starting. Reloading
            often fixes this.
          </p>
          {error.digest ? (
            <p style={{ fontSize: "0.75rem", color: "#a3a3a3", marginTop: "0.75rem" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.6rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#1a1917",
              color: "#f3efe6",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
