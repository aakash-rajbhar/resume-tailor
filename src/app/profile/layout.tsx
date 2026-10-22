import type { ReactNode } from "react";

import ProfileNav from "@/components/profile/ProfileNav";

/**
 * The shell of the profile area. The screens inside it are only reachable
 * when the Master Profile is enabled and the visitor is signed in.
 */
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <ProfileNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
