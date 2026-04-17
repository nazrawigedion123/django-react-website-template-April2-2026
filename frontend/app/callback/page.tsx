import { Suspense } from "react";

import { GoogleCallbackPage } from "@/routes/GoogleCallbackPage";

export default function Page() {
  return (
    <Suspense fallback={<p>Signing in with Google...</p>}>
      <GoogleCallbackPage />
    </Suspense>
  );
}
