"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useRegister } from "../hooks/auth/useAuthMutations";

export function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await registerMutation.mutateAsync({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      router.push("/dashboard");
    } catch (_err) {
      setError("Registration failed.");
    }
  };

  return (
    <section className="mx-auto max-w-md rounded border border-slate-200 p-4 dark:border-slate-800">
      <h1 className="text-xl font-bold">Create account</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
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
          Register
        </button>
      </form>
      <p className="mt-3 text-sm">
        Have an account? <Link href="/login">Sign in</Link>
      </p>
    </section>
  );
}
