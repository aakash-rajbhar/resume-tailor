export default function Loading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-base">
      <div className="flex flex-col items-center gap-4" role="status" aria-label="Loading">
        <div className="w-8 h-8 rounded-full border-2 border-line border-t-accent animate-spin" />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    </div>
  );
}
