import { Link, Outlet } from "@tanstack/react-router";

import { useUser } from "../../hooks/auth/useUser";
import { useTranslation } from "../../hooks/i18n/useTranslation";
import api from "../../services/api";

export function DashboardLayout() {
  const { data: user } = useUser(!!api.getTokens());
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <aside className="rounded border border-slate-200 p-3 dark:border-slate-800">
        <h2 className="mb-2 text-sm font-semibold">Dashboard</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/dashboard">Overview</Link>
          <Link to="/dashboard/blogs">Blogs</Link>
          <Link to="/dashboard/media">Media</Link>
          {user?.roles?.can_manage_contacts || user?.roles?.can_manage_subscribers ? (
            <Link to="/dashboard/contacts">Contacts</Link>
          ) : null}
          {user?.roles?.can_manage_users ? <Link to="/dashboard/users">Users</Link> : null}
          {user?.roles?.can_manage_settings ? (
            <Link to="/dashboard/settings">{t("nav.settings", "Settings")}</Link>
          ) : null}
        </nav>
      </aside>

      <section className="rounded border border-slate-200 p-4 dark:border-slate-800">
        <Outlet />
      </section>
    </div>
  );
}
