"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useUser } from "@/hooks/auth/useUser";
import type { Roles } from "@/types";
import api from "@/services/api";

interface RequireRoleProps {
  children: ReactNode;
  permission: keyof Roles | Array<keyof Roles>;
}

export function RequireRole({ children, permission }: RequireRoleProps) {
  const router = useRouter();
  const { data: user, isLoading } = useUser(Boolean(api.getTokens()));
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasPermission = permissions.some((entry) => Boolean(user?.roles?.[entry]));

  useEffect(() => {
    if (!isLoading && !hasPermission) {
      router.replace("/dashboard");
    }
  }, [hasPermission, isLoading, router]);

  if (isLoading || !hasPermission) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>;
  }

  return <>{children}</>;
}
