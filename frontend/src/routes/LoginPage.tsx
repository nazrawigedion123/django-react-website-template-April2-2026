import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";

import { useLogin } from "../hooks/auth/useAuthMutations";
import { generateCodeChallenge, generateCodeVerifier } from "../utils/pkce";

const GOOGLE_CLIENT_ID = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  import.meta.env.VITE_SOCIAL_AUTH_GOOGLE_CLIENT_ID ||
  ""
).trim();
const GOOGLE_REDIRECT_URI = (
  import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
  import.meta.env.VITE_GOOGLE_REDIRECT_URL ||
  "http://localhost:5173/callback"
).trim();

export function LoginPage() {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLogin();

  const redirectTo = (location.search as Record<string, string> | undefined)?.redirect || "/dashboard";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await loginMutation.mutateAsync({ email, password });
      navigate({ to: redirectTo });
    } catch (_err) {
      setError("Invalid credentials.");
    }
  };

  const loginWithGoogle = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google Client ID is missing in frontend env.");
      return;
    }
    if (!GOOGLE_REDIRECT_URI) {
      setError("Google redirect URL is missing in frontend env.");
      return;
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    sessionStorage.setItem("pkce_verifier", codeVerifier);
    sessionStorage.setItem("google_code_verifier", codeVerifier);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "consent",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <section className="mx-auto max-w-md rounded border border-slate-200 p-4 dark:border-slate-800">
      <h1 className="text-xl font-bold">Sign in</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white dark:bg-slate-200 dark:text-slate-900">
          Login
        </button>
      </form>

      <button
        onClick={loginWithGoogle}
        className="mt-3 rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
      >
        Continue with Google
      </button>

      <p className="mt-3 text-sm">
        No account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}
