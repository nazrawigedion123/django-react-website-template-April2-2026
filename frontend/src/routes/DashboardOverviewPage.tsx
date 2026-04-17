"use client";

import { useTranslation } from "../hooks/i18n/useTranslation";

export function DashboardOverviewPage() {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="text-xl font-bold">{t("headers.dashboard_title", "Church Management Dashboard")}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {t("dashboard.overview_subtitle", "Manage blogs, gallery media, and role-based features from the sidebar.")}
      </p>
    </section>
  );
}
