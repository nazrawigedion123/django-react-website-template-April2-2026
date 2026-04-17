"use client";

import { useUser } from "../hooks/auth/useUser";
import { useDashboardContacts, useDashboardSubscribers } from "../hooks/content/useContacts";
import api from "../services/api";

export function DashboardContactsPage() {
  const { data: user } = useUser(!!api.getTokens());
  const canManageContacts = Boolean(user?.roles?.can_manage_contacts);
  const canManageSubscribers = Boolean(user?.roles?.can_manage_subscribers);

  const { data: contacts = [], isLoading: contactsLoading } = useDashboardContacts(canManageContacts);
  const { data: subscribers = [], isLoading: subscribersLoading } = useDashboardSubscribers(canManageSubscribers);

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-bold">Contacts & Subscribers</h1>

      {canManageContacts ? (
        <article className="space-y-2">
          <h2 className="text-lg font-semibold">Contacts</h2>
          {contactsLoading ? <p className="text-sm text-slate-500">Loading contacts...</p> : null}
          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Message</th>
                  <th className="px-3 py-2 text-left">IP Address</th>
                  <th className="px-3 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-900">
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2">{row.message}</td>
                    <td className="px-3 py-2">{row.ip_address ?? "-"}</td>
                    <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {canManageSubscribers ? (
        <article className="space-y-2">
          <h2 className="text-lg font-semibold">Subscribers</h2>
          {subscribersLoading ? <p className="text-sm text-slate-500">Loading subscribers...</p> : null}
          <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-900">
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  );
}
