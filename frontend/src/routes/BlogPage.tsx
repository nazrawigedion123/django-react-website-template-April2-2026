"use client";

import Link from "next/link";
import { useBlogs } from "../hooks/content/useBlogs";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslation } from "../hooks/i18n/useTranslation";
import { useLanguages } from "../hooks/i18n/useLanguages";
import type { Blog } from "../types";

function resolveBlogText(blog: Blog, lang: string, defaultLangCode: string | undefined) {
  const entries = blog.translations ?? [];
  const byCode = new Map(entries.map((entry) => [entry.code, entry]));
  const current = byCode.get(lang);
  const fallback = defaultLangCode ? byCode.get(defaultLangCode) : undefined;
  const firstNonEmpty = entries.find((entry) => (entry.title || "").trim() || (entry.content || "").trim());

  const sectionByLang = blog.sections
    .map((section) => {
      const sectionTranslations = section.translations ?? [];
      const sectionByCode = new Map(sectionTranslations.map((entry) => [entry.code, entry]));
      const sectionCurrent = sectionByCode.get(lang);
      const sectionDefault = defaultLangCode ? sectionByCode.get(defaultLangCode) : undefined;
      const sectionAny = sectionTranslations.find(
        (entry) => (entry.title || "").trim() || (entry.content || "").trim(),
      );
      return {
        title:
          (sectionCurrent?.title || "").trim() ||
          (sectionDefault?.title || "").trim() ||
          (sectionAny?.title || "").trim() ||
          (section.title || "").trim(),
        content:
          (sectionCurrent?.content || "").trim() ||
          (sectionDefault?.content || "").trim() ||
          (sectionAny?.content || "").trim() ||
          (section.content || "").trim(),
      };
    })
    .find((section) => section.title || section.content);

  return {
    title:
      (current?.title || "").trim() ||
      (fallback?.title || "").trim() ||
      (firstNonEmpty?.title || "").trim() ||
      (sectionByLang?.title || "").trim() ||
      (blog.title || "").trim(),
    content:
      (current?.content || "").trim() ||
      (fallback?.content || "").trim() ||
      (firstNonEmpty?.content || "").trim() ||
      (sectionByLang?.content || "").trim() ||
      (blog.content || "").trim() ||
      "",
  };
}

export function BlogPage() {
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const { data: languages = [] } = useLanguages();
  const { data, isLoading, error } = useBlogs(lang);
  const defaultLangCode = languages.find((language) => language.default)?.code;

  if (isLoading) return <p>{t("common.loading", "Loading...")}</p>;
  if (error) return <p>{t("errors.blog_load_failed", "Failed to load blogs.")}</p>;

  return (
    <section>
      <h1 className="text-2xl font-bold">{t("headers.blog_title", "Latest Articles")}</h1>
      <div className="mt-4 space-y-3">
        {(data ?? []).map((blog) => {
          const resolved = resolveBlogText(blog, lang, defaultLangCode);
          return (
            <article key={blog.id} className="rounded border border-slate-200 p-3 dark:border-slate-800">
              <h2 className="text-lg font-semibold">{resolved.title || t("blog.untitled", "Untitled")}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {blog.comment_count} {t("blog.comments", "comments")} · {blog.reaction_count} {t("blog.reactions", "reactions")}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{resolved.content || t("blog.empty", "")}</p>
              <div className="mt-2">
                <Link href={`/blog/${blog.id}`} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  {t("blog.read_more", "Read more")}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
