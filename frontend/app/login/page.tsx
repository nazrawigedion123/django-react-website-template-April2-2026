import { Suspense } from "react";

import { RequireGuest } from "@/components/auth/RequireGuest";
import { LoginPage } from "@/routes/LoginPage";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <RequireGuest>
        <LoginPage />
      </RequireGuest>
    </Suspense>
  );
}
