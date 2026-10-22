"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { LogIn } from "lucide-react";
import Button from "@/components/ui/Button";
import type { ButtonSize, ButtonVariant } from "@/components/ui/Button";

interface SignInButtonProps {
  size?: ButtonSize;
  variant?: ButtonVariant;
  label?: string;
}

export default function SignInButton({
  size = "md",
  variant = "primary",
  label = "Sign in with GitHub",
}: SignInButtonProps) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      loading={pending}
      icon={<LogIn size={15} aria-hidden />}
      onClick={() => {
        setPending(true);
        void signIn("github", { callbackUrl: "/" });
      }}
    >
      {label}
    </Button>
  );
}
