export default function CropMarks() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none text-[var(--muted)] opacity-30 select-none"
    >
      <span className="absolute top-1.5 left-1.5 font-mono text-[9px] leading-none">+</span>
      <span className="absolute top-1.5 right-1.5 font-mono text-[9px] leading-none">+</span>
      <span className="absolute bottom-1.5 left-1.5 font-mono text-[9px] leading-none">+</span>
      <span className="absolute bottom-1.5 right-1.5 font-mono text-[9px] leading-none">+</span>
    </div>
  );
}
