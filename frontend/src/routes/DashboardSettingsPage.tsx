"use client";

import { useMemo, useState, type FormEvent } from "react";

import { useLanguage } from "../contexts/LanguageContext";
import { useLanguages } from "../hooks/i18n/useLanguages";
import {
  useCreateFaq,
  useCreateHeroSection,
  useCreateLogoSection,
  useCreatePartner,
  useCreateSocial,
  useDeleteFaq,
  useDeletePartner,
  useDeleteSocial,
  useFaqs,
  useHeroSection,
  useLogoSection,
  usePartners,
  useSocials,
  useUpdateFaq,
  useUpdateHeroSection,
  useUpdateLogoSection,
  useUpdatePartner,
  useUpdateSocial,
} from "../hooks/content/useFrontendAssets";
import type { Faq, FaqTranslation, Partner, PartnerTranslation, Social } from "../types";

type PartnerTranslationsMap = Record<string, { name: string; description: string }>;
type FaqTranslationsMap = Record<string, { question: string; answer: string }>;

const toPartnerTranslationMap = (translations: PartnerTranslation[], codes: string[]): PartnerTranslationsMap => {
  const base: PartnerTranslationsMap = Object.fromEntries(codes.map((code) => [code, { name: "", description: "" }]));
  for (const t of translations) {
    if (t.code in base) {
      base[t.code] = { name: t.name ?? "", description: t.description ?? "" };
    }
  }
  return base;
};

const toFaqTranslationMap = (translations: FaqTranslation[], codes: string[]): FaqTranslationsMap => {
  const base: FaqTranslationsMap = Object.fromEntries(codes.map((code) => [code, { question: "", answer: "" }]));
  for (const t of translations) {
    if (t.code in base) {
      base[t.code] = { question: t.question ?? "", answer: t.answer ?? "" };
    }
  }
  return base;
};

export function DashboardSettingsPage() {
  const { lang } = useLanguage();
  const { data: languages = [] } = useLanguages();
  const { data: socials = [] } = useSocials();
  const { data: partners = [] } = usePartners(lang);
  const { data: heroRows = [] } = useHeroSection();
  const { data: logoRows = [] } = useLogoSection();
  const { data: faqs = [] } = useFaqs(lang);

  const createSocial = useCreateSocial();
  const updateSocial = useUpdateSocial();
  const deleteSocial = useDeleteSocial();

  const createPartner = useCreatePartner(lang);
  const updatePartner = useUpdatePartner(lang);
  const deletePartner = useDeletePartner(lang);

  const createHero = useCreateHeroSection();
  const updateHero = useUpdateHeroSection();
  const createLogo = useCreateLogoSection();
  const updateLogo = useUpdateLogoSection();

  const createFaq = useCreateFaq(lang);
  const updateFaq = useUpdateFaq(lang);
  const deleteFaq = useDeleteFaq(lang);

  const languageCodes = useMemo(() => languages.map((row) => row.code), [languages]);
  const defaultLanguageCode = useMemo(
    () => languages.find((row) => row.default)?.code ?? languages[0]?.code ?? "",
    [languages],
  );

  const [socialEdit, setSocialEdit] = useState<Social | null>(null);
  const [socialName, setSocialName] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [socialIcon, setSocialIcon] = useState("");

  const [partnerEdit, setPartnerEdit] = useState<Partner | null>(null);
  const [partnerUrl, setPartnerUrl] = useState("");
  const [partnerImage, setPartnerImage] = useState<File | null>(null);
  const [partnerTab, setPartnerTab] = useState("");
  const [partnerTranslations, setPartnerTranslations] = useState<PartnerTranslationsMap>({});

  const [faqEdit, setFaqEdit] = useState<Faq | null>(null);
  const [faqActive, setFaqActive] = useState(true);
  const [faqTab, setFaqTab] = useState("");
  const [faqTranslations, setFaqTranslations] = useState<FaqTranslationsMap>({});

  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroActiveOverride, setHeroActiveOverride] = useState<boolean | null>(null);

  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoActiveOverride, setLogoActiveOverride] = useState<boolean | null>(null);

  const heroActive = heroActiveOverride ?? heroRows[0]?.active ?? true;
  const logoActive = logoActiveOverride ?? logoRows[0]?.active ?? true;

  const resetSocialForm = () => {
    setSocialEdit(null);
    setSocialName("");
    setSocialUrl("");
    setSocialIcon("");
  };

  const resetPartnerForm = () => {
    setPartnerEdit(null);
    setPartnerUrl("");
    setPartnerImage(null);
    setPartnerTab(defaultLanguageCode);
    setPartnerTranslations(toPartnerTranslationMap([], languageCodes));
  };

  const resetFaqForm = () => {
    setFaqEdit(null);
    setFaqActive(true);
    setFaqTab(defaultLanguageCode);
    setFaqTranslations(toFaqTranslationMap([], languageCodes));
  };

  const onEditSocial = (social: Social) => {
    setSocialEdit(social);
    setSocialName(social.name);
    setSocialUrl(social.url);
    setSocialIcon(social.icon);
  };

  const onEditPartner = (partner: Partner) => {
    setPartnerEdit(partner);
    setPartnerUrl(partner.url);
    setPartnerImage(null);
    setPartnerTab(defaultLanguageCode);
    setPartnerTranslations(toPartnerTranslationMap(partner.translations ?? [], languageCodes));
  };

  const onEditFaq = (faq: Faq) => {
    setFaqEdit(faq);
    setFaqActive(faq.active);
    setFaqTab(defaultLanguageCode);
    setFaqTranslations(toFaqTranslationMap(faq.translations ?? [], languageCodes));
  };

  const partnerActiveTab = partnerTab || defaultLanguageCode || languageCodes[0] || "";
  const faqActiveTab = faqTab || defaultLanguageCode || languageCodes[0] || "";

  const onSocialSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = { name: socialName.trim(), url: socialUrl.trim(), icon: socialIcon.trim() };
    if (!payload.name || !payload.url) {
      return;
    }
    if (socialEdit) {
      updateSocial.mutate({ id: socialEdit.id, payload }, { onSuccess: resetSocialForm });
      return;
    }
    createSocial.mutate(payload, { onSuccess: resetSocialForm });
  };

  const onPartnerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const defaultTranslation = partnerTranslations[defaultLanguageCode];
    if (!defaultTranslation?.name?.trim()) {
      return;
    }

    const translations = Object.entries(partnerTranslations)
      .map(([code, value]) => ({
        code,
        name: value.name.trim(),
        description: value.description.trim(),
      }))
      .filter((row) => row.name || row.description || row.code === defaultLanguageCode);

    const payload = new FormData();
    payload.append("url", partnerUrl.trim());
    payload.append("translations", JSON.stringify(translations));
    if (partnerImage) {
      payload.append("image", partnerImage);
    }

    if (partnerEdit) {
      updatePartner.mutate({ id: partnerEdit.id, payload }, { onSuccess: resetPartnerForm });
      return;
    }
    createPartner.mutate(payload, { onSuccess: resetPartnerForm });
  };

  const onFaqSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const defaultTranslation = faqTranslations[defaultLanguageCode];
    if (!defaultTranslation?.question?.trim()) {
      return;
    }

    const translations = Object.entries(faqTranslations)
      .map(([code, value]) => ({
        code,
        question: value.question.trim(),
        answer: value.answer.trim(),
      }))
      .filter((row) => row.question || row.answer || row.code === defaultLanguageCode);

    const payload = { active: faqActive, translations: JSON.stringify(translations) };
    if (faqEdit) {
      updateFaq.mutate({ id: faqEdit.id, payload }, { onSuccess: resetFaqForm });
      return;
    }
    createFaq.mutate(payload, { onSuccess: resetFaqForm });
  };

  const onHeroSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!heroImage && !heroRows[0]) {
      return;
    }
    const payload = new FormData();
    payload.append("active", String(heroActive));
    if (heroImage) {
      payload.append("image", heroImage);
    }
    if (heroRows[0]) {
      updateHero.mutate({
        id: heroRows[0].id,
        payload,
      }, { onSuccess: () => {
        setHeroImage(null);
        setHeroActiveOverride(null);
      } });
      return;
    }
    createHero.mutate(payload, { onSuccess: () => {
      setHeroImage(null);
      setHeroActiveOverride(null);
    } });
  };

  const onLogoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!logoImage && !logoRows[0]) {
      return;
    }
    const payload = new FormData();
    payload.append("active", String(logoActive));
    if (logoImage) {
      payload.append("image", logoImage);
    }
    if (logoRows[0]) {
      updateLogo.mutate({
        id: logoRows[0].id,
        payload,
      }, { onSuccess: () => {
        setLogoImage(null);
        setLogoActiveOverride(null);
      } });
      return;
    }
    createLogo.mutate(payload, { onSuccess: () => {
      setLogoImage(null);
      setLogoActiveOverride(null);
    } });
  };

  return (
    <section className="space-y-8">
      <h1 className="text-xl font-bold">Frontend Assets</h1>

      <article className="space-y-3 rounded border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-lg font-semibold">Social Links</h2>
        <form onSubmit={onSocialSubmit} className="grid gap-2 md:grid-cols-4">
          <input
            value={socialName}
            onChange={(e) => setSocialName(e.target.value)}
            placeholder="Name"
            className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
            placeholder="URL"
            className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            value={socialIcon}
            onChange={(e) => setSocialIcon(e.target.value)}
            placeholder="Icon class or SVG"
            className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white dark:bg-slate-200 dark:text-slate-900">
            {socialEdit ? "Update" : "Create"}
          </button>
        </form>
        {socialEdit ? (
          <button type="button" onClick={resetSocialForm} className="text-sm text-slate-600 underline dark:text-slate-300">
            Cancel editing
          </button>
        ) : null}
        <div className="grid gap-2">
          {socials.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm dark:border-slate-700">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-slate-500 dark:text-slate-400">{item.url}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onEditSocial(item)} className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteSocial.mutate(item.id)}
                  className="rounded border border-red-300 px-2 py-1 text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="space-y-3 rounded border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-lg font-semibold">Partners</h2>
        <form onSubmit={onPartnerSubmit} className="space-y-3">
          <input
            value={partnerUrl}
            onChange={(e) => setPartnerUrl(e.target.value)}
            placeholder="Company website URL"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input type="file" accept="image/*" onChange={(e) => setPartnerImage(e.target.files?.[0] ?? null)} />

          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
            {languages.map((row) => (
              <button
                key={row.code}
                type="button"
                onClick={() => setPartnerTab(row.code)}
                className={[
                  "rounded px-2 py-1 text-xs",
                  partnerActiveTab === row.code ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900" : "border border-slate-300 dark:border-slate-700",
                ].join(" ")}
              >
                {row.name}
                {row.default ? " *" : ""}
              </button>
            ))}
          </div>

          <input
            value={partnerTranslations[partnerActiveTab]?.name ?? ""}
            onChange={(e) =>
              setPartnerTranslations((prev) => ({
                ...prev,
                [partnerActiveTab]: { ...(prev[partnerActiveTab] ?? { name: "", description: "" }), name: e.target.value },
              }))
            }
            placeholder={`Company name (${partnerActiveTab})${partnerActiveTab === defaultLanguageCode ? " - required" : ""}`}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <textarea
            value={partnerTranslations[partnerActiveTab]?.description ?? ""}
            onChange={(e) =>
              setPartnerTranslations((prev) => ({
                ...prev,
                [partnerActiveTab]: {
                  ...(prev[partnerActiveTab] ?? { name: "", description: "" }),
                  description: e.target.value,
                },
              }))
            }
            rows={3}
            placeholder={`Description (${partnerActiveTab})`}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white dark:bg-slate-200 dark:text-slate-900">
            {partnerEdit ? "Update Partner" : "Create Partner"}
          </button>
        </form>
        {partnerEdit ? (
          <button type="button" onClick={resetPartnerForm} className="text-sm text-slate-600 underline dark:text-slate-300">
            Cancel editing
          </button>
        ) : null}
        <div className="grid gap-2">
          {partners.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm dark:border-slate-700">
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="h-10 w-10 rounded object-cover" />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-slate-500 dark:text-slate-400">{item.url}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onEditPartner(item)} className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deletePartner.mutate(item.id)}
                  className="rounded border border-red-300 px-2 py-1 text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="space-y-3 rounded border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-lg font-semibold">Hero Section (single record)</h2>
        <form onSubmit={onHeroSubmit} className="space-y-2">
          {heroRows[0]?.image ? <img src={heroRows[0].image} alt="Current hero" className="h-36 w-full rounded object-cover md:w-80" /> : null}
          <input type="file" accept="image/*" onChange={(e) => setHeroImage(e.target.files?.[0] ?? null)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={heroActive} onChange={(e) => setHeroActiveOverride(e.target.checked)} />
            Active
          </label>
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white dark:bg-slate-200 dark:text-slate-900">
            {heroRows[0] ? "Update Hero" : "Create Hero"}
          </button>
        </form>
      </article>

      <article className="space-y-3 rounded border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-lg font-semibold">Logo (single record)</h2>
        <form onSubmit={onLogoSubmit} className="space-y-2">
          {logoRows[0]?.image ? <img src={logoRows[0].image} alt="Current logo" className="h-24 rounded object-contain" /> : null}
          <input type="file" accept="image/*" onChange={(e) => setLogoImage(e.target.files?.[0] ?? null)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={logoActive} onChange={(e) => setLogoActiveOverride(e.target.checked)} />
            Active
          </label>
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white dark:bg-slate-200 dark:text-slate-900">
            {logoRows[0] ? "Update Logo" : "Create Logo"}
          </button>
        </form>
      </article>

      <article className="space-y-3 rounded border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
        <form onSubmit={onFaqSubmit} className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={faqActive} onChange={(e) => setFaqActive(e.target.checked)} />
            Active
          </label>

          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
            {languages.map((row) => (
              <button
                key={row.code}
                type="button"
                onClick={() => setFaqTab(row.code)}
                className={[
                  "rounded px-2 py-1 text-xs",
                  faqActiveTab === row.code ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900" : "border border-slate-300 dark:border-slate-700",
                ].join(" ")}
              >
                {row.name}
                {row.default ? " *" : ""}
              </button>
            ))}
          </div>

          <input
            value={faqTranslations[faqActiveTab]?.question ?? ""}
            onChange={(e) =>
              setFaqTranslations((prev) => ({
                ...prev,
                [faqActiveTab]: { ...(prev[faqActiveTab] ?? { question: "", answer: "" }), question: e.target.value },
              }))
            }
            placeholder={`Question (${faqActiveTab})${faqActiveTab === defaultLanguageCode ? " - required" : ""}`}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <textarea
            value={faqTranslations[faqActiveTab]?.answer ?? ""}
            onChange={(e) =>
              setFaqTranslations((prev) => ({
                ...prev,
                [faqActiveTab]: { ...(prev[faqActiveTab] ?? { question: "", answer: "" }), answer: e.target.value },
              }))
            }
            rows={3}
            placeholder={`Answer (${faqActiveTab})`}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white dark:bg-slate-200 dark:text-slate-900">
            {faqEdit ? "Update FAQ" : "Create FAQ"}
          </button>
        </form>
        {faqEdit ? (
          <button type="button" onClick={resetFaqForm} className="text-sm text-slate-600 underline dark:text-slate-300">
            Cancel editing
          </button>
        ) : null}
        <div className="grid gap-2">
          {faqs.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm dark:border-slate-700">
              <div>
                <p className="font-medium">{item.question}</p>
                <p className="text-slate-500 dark:text-slate-400">{item.answer}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onEditFaq(item)} className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700">
                  Edit
                </button>
                <button type="button" onClick={() => deleteFaq.mutate(item.id)} className="rounded border border-red-300 px-2 py-1 text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
