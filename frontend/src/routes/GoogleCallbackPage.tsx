import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { useGoogleLogin } from "../hooks/auth/useAuthMutations";

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const googleLogin = useGoogleLogin();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const params = new URLSearchParams(location.searchStr);
    const code = params.get("code");
    const providerError = params.get("error");
    const codeVerifier =
      sessionStorage.getItem("pkce_verifier") || sessionStorage.getItem("google_code_verifier");

    if (providerError) {
      navigate({ to: "/login", search: { error: "Google sign-in was cancelled or failed." } });
      return;
    }

    if (!code || !codeVerifier) {
      navigate({ to: "/login" });
      return;
    }

    processedRef.current = true;
    googleLogin
      .mutateAsync({ code, codeVerifier })
      .then(() => {
        sessionStorage.removeItem("pkce_verifier");
        sessionStorage.removeItem("google_code_verifier");
        navigate({ to: "/dashboard" });
      })
      .catch((error) => {
        console.error("Login failed:", error);
        processedRef.current = false; // Allow retry on failure if needed, though usually code is invalidated
        navigate({ to: "/login", search: { error: "Login failed. Please try again." } });
      });
  }, [googleLogin, location.searchStr, navigate]);

  return <p>Signing in with Google...</p>;
}
