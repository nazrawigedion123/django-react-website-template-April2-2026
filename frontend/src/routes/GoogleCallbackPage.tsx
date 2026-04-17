"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useGoogleLogin } from "../hooks/auth/useAuthMutations";

export function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleLogin = useGoogleLogin();
  const processedRef = useRef(false);
  const cancelledRoute = "/login?error=Google%20sign-in%20was%20cancelled%20or%20failed." as Route;
  const failedRoute = "/login?error=Login%20failed.%20Please%20try%20again." as Route;

  useEffect(() => {
    if (processedRef.current) return;

    const code = searchParams.get("code");
    const providerError = searchParams.get("error");
    const codeVerifier =
      sessionStorage.getItem("pkce_verifier") || sessionStorage.getItem("google_code_verifier");

    if (providerError) {
      router.replace(cancelledRoute);
      return;
    }

    if (!code || !codeVerifier) {
      router.replace("/login");
      return;
    }

    processedRef.current = true;
    googleLogin
      .mutateAsync({ code, codeVerifier })
      .then(() => {
        sessionStorage.removeItem("pkce_verifier");
        sessionStorage.removeItem("google_code_verifier");
        router.replace("/dashboard");
      })
      .catch((error) => {
        console.error("Login failed:", error);
        processedRef.current = false; // Allow retry on failure if needed, though usually code is invalidated
        router.replace(failedRoute);
      });
  }, [cancelledRoute, failedRoute, googleLogin, router, searchParams]);

  return <p>Signing in with Google...</p>;
}
