"use client";

import { useSessionQuery } from "@arcle/auth-client";
import { Spinner } from "@arcle/ui/components/spinner";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = useSessionQuery();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (
      !isPending &&
      session &&
      (session.user as { role?: string }).role !== "admin"
    ) {
      router.replace("/sign-in?error=access_denied");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!session || (session.user as { role?: string }).role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
