"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import Button from "@/components/ui/Button";

/**
 * Sign-in and sign-out controls. The component is only mounted when the
 * Master Profile is enabled, so no session request is made otherwise.
 */
export default function AuthControls() {
  const { status, data } = useSession();
  const [pending, setPending] = useState(false);

  if (status === "loading") {
    return (
      <div className="h-8 w-20 rounded-md bg-surface-2 animate-pulse" aria-hidden />
    );
  }

  if (status === "authenticated" && data?.user) {
    const name = data.user.name ?? data.user.email ?? "Signed in";
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-xs text-muted max-w-[140px] truncate">
          {name}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          loading={pending}
          onClick={() => {
            setPending(true);
            void signOut({ callbackUrl: "/" });
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      loading={pending}
      onClick={() => {
        setPending(true);
        void signIn("github", { callbackUrl: "/" });
      }}
    >
      Sign in
    </Button>
  );
}
