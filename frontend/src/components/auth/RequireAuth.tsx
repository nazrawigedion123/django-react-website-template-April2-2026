"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useUser } from "@/hooks/auth/useUser";
import { queryKeys } from "@/lib/queryKeys";
import api from "@/services/api";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const hasTokens = Boolean(api.getTokens());
  const { data: user, isLoading, isError } = useUser(hasTokens);

  useEffect(() => {
    const redirectTo = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    const loginRoute = `/login?redirect=${encodeURIComponent(redirectTo)}` as Route;

    if (!hasTokens) {
      router.replace(loginRoute);
      return;
    }

    if (!isLoading && (isError || !user)) {
      api.logout();
      queryClient.setQueryData(queryKeys.auth.user(), null);
      router.replace(loginRoute);
    }
  }, [hasTokens, isError, isLoading, pathname, queryClient, router, searchParams, user]);

  if (!hasTokens || isLoading || !user) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>;
  }

  return <>{children}</>;
}
