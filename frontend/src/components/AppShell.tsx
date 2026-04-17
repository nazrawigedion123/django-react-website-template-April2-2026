"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";

import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLanguages } from "../hooks/i18n/useLanguages";
import { useTranslation } from "../hooks/i18n/useTranslation";
import { useUser } from "../hooks/auth/useUser";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUser(!!api.getTokens());
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const { data: languages = [] } = useLanguages();
  const { t } = useTranslation();
  const isAuthenticated = Boolean(user || api.getTokens());
  const welcomeLabel = user?.first_name?.trim() || user?.email || "User";
  const selectedLangExists = languages.some((item) => item.code === lang);

  useEffect(() => {
    if (!languages.length || selectedLangExists) return;
    const fallback = languages.find((item) => item.default) ?? languages[0];
    setLang(fallback.code);
  }, [languages, selectedLangExists, setLang]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="font-semibold">
              {t("nav.home", "Home")}
            </Link>
            <Link href="/blog">{t("nav.blog", "Blog")}</Link>
            <Link href="/gallery">{t("nav.gallery", "Gallery")}</Link>
            <Link href="/about">{t("nav.about", "About")}</Link>
            {isAuthenticated ? (
              <Link href="/dashboard">{t("nav.dashboard", "Dashboard")}</Link>
            ) : null}
          </nav>

          <div className="flex items-center gap-2 text-sm">
            {isAuthenticated ? (
              <span className="mr-2 text-slate-600 dark:text-slate-300">
                {t("labels.welcome", "Welcome")}, {welcomeLabel}
              </span>
            ) : null}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
            >
              {languages.length ? (
                languages.map((item) => (
                  <option key={item.id} value={item.code}>
                    {item.code.toUpperCase()}
                  </option>
                ))
              ) : (
                <option value={lang}>{lang.toUpperCase()}</option>
              )}
            </select>
            <button
              onClick={toggleTheme}
              className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700"
            >
              {theme === "dark" ? t("theme.light", "Light") : t("theme.dark", "Dark")}
            </button>
            {isAuthenticated ? (
              <button
                onClick={async () => {
                  api.logout();
                  queryClient.setQueryData(queryKeys.auth.user(), null);
                  await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
                  router.push("/login");
                }}
                className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700"
              >
                {t("auth.logout", "Logout")}
              </button>
            ) : (
              <Link href="/login" className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700">
                {t("auth.login", "Login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
