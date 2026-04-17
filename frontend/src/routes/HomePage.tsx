"use client";

import { useState, type FormEvent } from "react";

import { useCreateContact, useCreateSubscriber } from "../hooks/content/useContacts";
import { useHeroSection, useLogoSection } from "../hooks/content/useFrontendAssets";
import { useTranslation } from "../hooks/i18n/useTranslation";

export function HomePage() {
  const { t } = useTranslation();
  const createContact = useCreateContact();
  const createSubscriber = useCreateSubscriber();
  const { data: heroRows = [] } = useHeroSection();
  const { data: logoRows = [] } = useLogoSection();

  const hero = heroRows[0];
  const logo = logoRows[0];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");

  const onContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createContact.mutate(
      { name: name.trim(), email: email.trim(), message: message.trim() },
      {
        onSuccess: () => {
          setName("");
          setEmail("");
          setMessage("");
        },
      },
    );
  };

  const onSubscriberSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createSubscriber.mutate(
      { email: subscriberEmail.trim() },
      {
        onSuccess: () => {
          setSubscriberEmail("");
        },
      },
    );
  };

  return (
    <section className="space-y-6">
      <div>
        {logo?.image ? <img src={logo.image} alt={t("home.logo_alt", "Church logo")} className="mb-3 h-16 w-auto object-contain" /> : null}
        {hero?.image ? <img src={hero.image} alt={t("home.hero_alt", "Hero")} className="mb-4 h-64 w-full rounded object-cover" /> : null}
        <h1 className="text-2xl font-bold">{t("headers.home_title", "Church Management System")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t(
            "home.subtitle",
            "Welcome to the church platform. Use Blog, Gallery, and Dashboard to manage content.",
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form onSubmit={onContactSubmit} className="space-y-2 rounded border border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">{t("home.contact_us", "Contact Us")}</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t("home.name", "Name")}
            className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            placeholder={t("home.email", "Email")}
            className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            placeholder={t("home.message", "Message")}
            className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white dark:bg-slate-200 dark:text-slate-900">
            {t("home.send_message", "Send Message")}
          </button>
          {createContact.isSuccess ? <p className="text-sm text-green-600">{t("home.message_sent", "Message sent.")}</p> : null}
          {createContact.isError ? <p className="text-sm text-red-600">{t("home.message_failed", "Failed to send message.")}</p> : null}
        </form>

        <form onSubmit={onSubscriberSubmit} className="space-y-2 rounded border border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">{t("home.subscribe", "Subscribe")}</h2>
          <input
            value={subscriberEmail}
            onChange={(e) => setSubscriberEmail(e.target.value)}
            required
            type="email"
            placeholder={t("home.email", "Email")}
            className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white dark:bg-slate-200 dark:text-slate-900">
            {t("home.subscribe", "Subscribe")}
          </button>
          {createSubscriber.isSuccess ? <p className="text-sm text-green-600">{t("home.subscribe_success", "Subscribed successfully.")}</p> : null}
          {createSubscriber.isError ? <p className="text-sm text-red-600">{t("home.subscribe_failed", "Failed to subscribe.")}</p> : null}
        </form>
      </div>
    </section>
  );
}
