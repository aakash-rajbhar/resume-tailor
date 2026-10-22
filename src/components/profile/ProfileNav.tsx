import Link from "next/link";

/**
 * The navigation of the profile area. It is a server component so the links
 * render on the server and carry no client JavaScript.
 */
export default function ProfileNav() {
  return (
    <nav
      aria-label="Profile"
      className="border-b border-line bg-paper/85 backdrop-blur-md sticky top-0 z-30"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="text-sm font-semibold text-ink hover:text-accent transition-colors">
          Resume<span className="text-muted font-normal">Tailor</span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/profile" className="text-muted hover:text-ink transition-colors">
            Profile
          </Link>
          <Link
            href="/profile/import-resume"
            className="text-muted hover:text-ink transition-colors"
          >
            Import a resume
          </Link>
        </div>
      </div>
    </nav>
  );
}
