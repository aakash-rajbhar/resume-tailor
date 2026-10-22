import { redirect } from "next/navigation";
import Link from "next/link";
import SignInButton from "@/components/auth/SignInButton";
import { isAuthEnabled } from "@/lib/auth/feature";

export const metadata = {
  title: "Sign in",
};

/**
 * Minimal sign-in page. When the Master Profile is disabled the page does not
 * exist and visitors are sent back to the workspace.
 */
export default function LoginPage() {
  if (!isAuthEnabled()) {
    redirect("/");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="font-sans text-xl font-semibold tracking-tight text-ink">
              Resume<span className="text-muted font-normal">Tailor</span>
            </span>
          </Link>
          <h1 className="text-lg font-semibold text-ink">Sign in to continue</h1>
          <p className="text-sm text-muted leading-relaxed">
            Your master profile, job history and tailored resumes stay in your
            account.
          </p>
        </div>

        <div className="paper-card p-6 flex flex-col items-center gap-4">
          <SignInButton size="lg" />
          <p className="text-xs text-subtle text-center leading-relaxed">
            We only read your public profile and email address. No repository
            access is requested.
          </p>
        </div>

        <p className="text-center text-xs text-muted">
          <Link href="/" className="hover:text-ink transition-colors">
            Back to the workspace
          </Link>
        </p>
      </div>
    </main>
  );
}
