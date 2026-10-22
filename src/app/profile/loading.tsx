export default function Loading() {
  return (
    <div className="flex flex-col items-center gap-3 py-20" role="status" aria-label="Loading">
      <div className="size-7 rounded-full border-2 border-line border-t-accent animate-spin" />
      <p className="text-sm text-muted">Loading your profile…</p>
    </div>
  );
}
