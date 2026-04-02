import { useEffect, useMemo, useState } from "react";

import { useDashboardUsers, useUpdateDashboardUserRole } from "../hooks/content/useDashboardUsers";
import type { Roles } from "../types";

type EditableRoleField = Exclude<keyof Roles, "can_manage_media">;

const ROLE_FIELDS: EditableRoleField[] = [
  "can_create_blog",
  "can_edit_blog",
  "can_delete_blog",
  "can_publish_blog",
  "can_manage_users",
  "can_create_media",
  "can_edit_media",
  "can_delete_media",
  "can_manage_subscribers",
  "can_manage_contacts",
  "can_manage_settings",
];

const ROLE_LABELS: Record<EditableRoleField, string> = {
  can_create_blog: "Create Blog",
  can_edit_blog: "Edit Blog",
  can_delete_blog: "Delete Blog",
  can_publish_blog: "Publish Blog",
  can_manage_users: "Manage Users",
  can_create_media: "Create Media",
  can_edit_media: "Edit Media",
  can_delete_media: "Delete Media",
  can_manage_subscribers: "Manage Subscribers",
  can_manage_contacts: "Manage Contacts",
  can_manage_settings: "Manage Settings",
};

export function DashboardUsersPage() {
  const { data = [], isLoading, error } = useDashboardUsers();
  const updateRole = useUpdateDashboardUserRole();
  const [drafts, setDrafts] = useState<Record<number, Partial<Roles>>>({});

  useEffect(() => {
    const initial: Record<number, Partial<Roles>> = {};
    data.forEach((user) => {
      initial[user.id] = {
        can_create_blog: Boolean(user.roles.can_create_blog),
        can_edit_blog: Boolean(user.roles.can_edit_blog),
        can_delete_blog: Boolean(user.roles.can_delete_blog),
        can_publish_blog: Boolean(user.roles.can_publish_blog),
        can_manage_users: Boolean(user.roles.can_manage_users),
        can_create_media: Boolean(user.roles.can_create_media),
        can_edit_media: Boolean(user.roles.can_edit_media),
        can_delete_media: Boolean(user.roles.can_delete_media),
        can_manage_subscribers: Boolean(user.roles.can_manage_subscribers),
        can_manage_contacts: Boolean(user.roles.can_manage_contacts),
        can_manage_settings: Boolean(user.roles.can_manage_settings),
      };
    });
    setDrafts(initial);
  }, [data]);

  const sortedUsers = useMemo(
    () => [...data].sort((a, b) => a.email.localeCompare(b.email)),
    [data],
  );

  if (isLoading) return <p>Loading users...</p>;
  if (error) return <p>Failed to load users.</p>;

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Manage User Roles</h1>

      {sortedUsers.map((user) => {
        const role = drafts[user.id] ?? {};
        return (
          <article key={user.id} className="space-y-3 rounded border border-slate-200 p-3 dark:border-slate-800">
            <div>
              <p className="font-semibold">{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : "Unnamed User"}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ROLE_FIELDS.map((field) => (
                <label key={field} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(role[field])}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [user.id]: { ...prev[user.id], [field]: e.target.checked },
                      }))
                    }
                  />
                  <span>{ROLE_LABELS[field]}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              className="w-fit rounded bg-slate-900 px-3 py-2 text-white dark:bg-slate-200 dark:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={updateRole.isPending}
              onClick={() => updateRole.mutate({ id: user.id, payload: role })}
            >
              {updateRole.isPending ? "Saving..." : "Save Role"}
            </button>
          </article>
        );
      })}
    </section>
  );
}
