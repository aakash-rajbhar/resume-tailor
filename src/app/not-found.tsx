import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-base">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-subtle">
          404
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 h-10 rounded-md bg-accent text-accent-contrast text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to workspace
        </Link>
      </div>
    </div>
  );
}
