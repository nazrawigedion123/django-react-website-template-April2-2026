import type { ReactNode } from "react";
import { Suspense } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <RequireAuth>
        <DashboardLayout>{children}</DashboardLayout>
      </RequireAuth>
    </Suspense>
  );
}
