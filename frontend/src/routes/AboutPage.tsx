import { useTranslation } from "../hooks/i18n/useTranslation";

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="text-2xl font-bold">{t("headers.about_title", "About")}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {t(
          "about.body",
          "This system supports church content management with role-based dashboard access and multilingual UI.",
        )}
      </p>
    </section>
  );
}
