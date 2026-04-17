"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useUser } from "@/hooks/auth/useUser";
import api from "@/services/api";

export function RequireGuest({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasTokens = Boolean(api.getTokens());
  const { data: user, isError, isLoading } = useUser(hasTokens);

  useEffect(() => {
    if (!isLoading && isError) {
      api.logout();
      return;
    }

    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isError, isLoading, router, user]);

  if (hasTokens && (isLoading || user)) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>;
  }

  return <>{children}</>;
}
