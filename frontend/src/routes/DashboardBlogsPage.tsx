import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";

import { useLanguage } from "../contexts/LanguageContext";
import { useUser } from "../hooks/auth/useUser";
import { useLanguages } from "../hooks/i18n/useLanguages";
import { useCreateBlog, useDashboardBlogs, useDeleteBlog, usePublishBlog, useUpdateBlog } from "../hooks/content/useBlogs";
import api from "../services/api";
import type { Blog, LanguageOption } from "../types";

const columnHelper = createColumnHelper<Blog>();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TranslationEntry = { title: string; content: string };
type TranslationsMap = Record<string, TranslationEntry>;

type SectionForm = {
  id?: number;
  /** Per-language title/content keyed by language code */
  translations: TranslationsMap;
  imageUrl: string | null;
  imageFile: File | null;
  removeImage: boolean;
};

const makeEmptyTranslations = (languages: LanguageOption[]): TranslationsMap =>
  Object.fromEntries(languages.map((l) => [l.code, { title: "", content: "" }]));

const makeEmptySection = (languages: LanguageOption[]): SectionForm => ({
  translations: makeEmptyTranslations(languages),
  imageUrl: null,
  imageFile: null,
  removeImage: false,
});

// ---------------------------------------------------------------------------
// Small sub-component: language tabs for a single section
// ---------------------------------------------------------------------------

interface SectionLangTabsProps {
  languages: LanguageOption[];
  translations: TranslationsMap;
  defaultLangCode: string;
  onChange: (code: string, field: keyof TranslationEntry, value: string) => void;
}

function SectionLangTabs({ languages, translations, defaultLangCode, onChange }: SectionLangTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultLangCode || languages[0]?.code || "");
  const current = translations[activeTab] ?? { title: "", content: "" };
  const isDefault = activeTab === defaultLangCode;

  return (
    <div className="space-y-1">
      {/* Language tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-1 dark:border-slate-700">
        {languages.map((lang) => {
          const isActive = activeTab === lang.code;
          const has =
            (translations[lang.code]?.title ?? "").trim() ||
            (translations[lang.code]?.content ?? "").trim();
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveTab(lang.code)}
              className={[
                "rounded-t px-2 py-0.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
                has && !isActive ? "border-green-400 dark:border-green-600" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {lang.name}
              {lang.default ? " *" : ""}
            </button>
          );
        })}
      </div>
      {/* Title */}
      <input
        value={current.title}
        onChange={(e) => onChange(activeTab, "title", e.target.value)}
        placeholder={`Section title (${activeTab})${isDefault ? " — required" : " — optional"}`}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      {/* Content */}
      <textarea
        value={current.content}
        onChange={(e) => onChange(activeTab, "content", e.target.value)}
        placeholder={`Section content (${activeTab})${isDefault ? " — required" : " — optional"}`}
        rows={3}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashboardBlogsPage() {
  const { lang } = useLanguage();
  const { data: user } = useUser(!!api.getTokens());
  const { data: languages = [] } = useLanguages();
  const { data = [] } = useDashboardBlogs(lang);
  const createBlog = useCreateBlog(lang);
  const updateBlog = useUpdateBlog(lang);
  const deleteBlog = useDeleteBlog(lang);
  const publishBlog = usePublishBlog(lang);

  const defaultLang = languages.find((l) => l.default) ?? languages[0];

  const [editBlogId, setEditBlogId] = useState<number | null>(null);
  const [translations, setTranslations] = useState<TranslationsMap>({});
  const [activeLangTab, setActiveLangTab] = useState<string>("");
  const [sections, setSections] = useState<SectionForm[]>([]);
  const [filter, setFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const isSaving = createBlog.isPending || updateBlog.isPending;
  const canCreateBlog = Boolean(user?.roles?.can_create_blog);
  const canEditBlog = Boolean(user?.roles?.can_edit_blog);
  const canPublishBlog = Boolean(user?.roles?.can_publish_blog);

  // Initialise translations map when languages load (only once, if empty)
  const initializedTranslations = useMemo(() => {
    if (languages.length === 0) return translations;
    const merged: TranslationsMap = makeEmptyTranslations(languages);
    for (const code of Object.keys(translations)) {
      if (code in merged) merged[code] = translations[code];
    }
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languages]);

  const activeTab = activeLangTab || defaultLang?.code || "";

  // Ensure at least one empty section when languages are first loaded
  const effectiveSections = useMemo(() => {
    if (sections.length === 0 && languages.length > 0) {
      return [makeEmptySection(languages)];
    }
    return sections;
  }, [sections, languages]);

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  const resetForm = () => {
    setEditBlogId(null);
    setTranslations(makeEmptyTranslations(languages));
    setActiveLangTab(defaultLang?.code ?? "");
    setSections([makeEmptySection(languages)]);
  };

  const loadForEdit = (blog: Blog) => {
    setEditBlogId(blog.id);
    // Blog-level translations
    const base = makeEmptyTranslations(languages);
    for (const t of blog.translations ?? []) {
      if (t.code in base) {
        base[t.code] = { title: t.title || "", content: t.content || "" };
      }
    }
    if ((blog.translations ?? []).length === 0) {
      const fallbackCode = defaultLang?.code ?? lang;
      if (fallbackCode && fallbackCode in base) {
        base[fallbackCode] = { title: blog.title || "", content: blog.content || "" };
      }
    }
    setTranslations(base);
    setActiveLangTab(lang || defaultLang?.code || "");
    // Section-level translations
    setSections(
      blog.sections.length
        ? blog.sections.map((section) => {
          const sectionBase = makeEmptyTranslations(languages);
          // Populate from the translations array returned by the serializer
          for (const t of section.translations ?? []) {
            if (t.code in sectionBase) {
              sectionBase[t.code] = { title: t.title || "", content: t.content || "" };
            }
          }
          return {
            id: section.id,
            translations: sectionBase,
            imageUrl: section.image,
            imageFile: null,
            removeImage: false,
          };
        })
        : [makeEmptySection(languages)],
    );
  };

  const setTranslationField = (code: string, field: keyof TranslationEntry, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [code]: { ...(prev[code] ?? { title: "", content: "" }), [field]: value },
    }));
  };

  const addSection = () =>
    setSections((prev) => [...prev, makeEmptySection(languages)]);

  const removeSection = (index: number) => {
    setSections((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [makeEmptySection(languages)];
    });
  };

  const updateSectionTranslation = (
    sectionIndex: number,
    code: string,
    field: keyof TranslationEntry,
    value: string,
  ) => {
    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== sectionIndex) return section;
        return {
          ...section,
          translations: {
            ...section.translations,
            [code]: { ...(section.translations[code] ?? { title: "", content: "" }), [field]: value },
          },
        };
      }),
    );
  };

  const updateSectionField = <K extends "imageUrl" | "imageFile" | "removeImage">(
    index: number,
    field: K,
    value: SectionForm[K],
  ) => {
    setSections((prev) => prev.map((section, i) => (i === index ? { ...section, [field]: value } : section)));
  };

  // ---------------------------------------------------------------------------
  // Payload builder
  // ---------------------------------------------------------------------------

  const buildPayload = () => {
    const formData = new FormData();

    // Blog-level translations → JSON array
    const map = Object.keys(initializedTranslations).length ? initializedTranslations : translations;
    const translationsPayload = Object.entries(map)
      .filter(([, v]) => v.title.trim() || v.content.trim())
      .map(([code, v]) => ({ code, title: v.title.trim(), content: v.content.trim() }));
    formData.append("translations", JSON.stringify(translationsPayload));

    // Section-level translations + image files
    const sectionsPayload = effectiveSections.map((section, index) => {
      if (section.imageFile) {
        formData.append(`section_image_${index}`, section.imageFile);
      }
      const sectionTranslations = Object.entries(section.translations)
        .filter(([, v]) => v.title.trim() || v.content.trim())
        .map(([code, v]) => ({ code, title: v.title.trim(), content: v.content.trim() }));
      return {
        ...(section.id ? { id: section.id } : {}),
        order: index,
        translations: sectionTranslations,
        remove_image: section.removeImage,
      };
    });
    formData.append("sections", JSON.stringify(sectionsPayload));

    return formData;
  };

  // ---------------------------------------------------------------------------
  // Table
  // ---------------------------------------------------------------------------

  const columns = useMemo(
    () => [
      columnHelper.accessor(
        (row) => {
          const byCode = new Map((row.translations ?? []).map((entry) => [entry.code, entry]));
          const selectedLangTitle = (lang ? byCode.get(lang)?.title : "") ?? "";
          const defaultLangTitle = (defaultLang?.code ? byCode.get(defaultLang.code)?.title : "") ?? "";
          return selectedLangTitle.trim() || defaultLangTitle.trim() || row.title || "";
        },
        {
          id: "title",
          header: "Title",
          cell: (info) => info.getValue(),
        },
      ),
      columnHelper.accessor(
        (row) =>
          (row.translations ?? [])
            .map((t) => `${t.title ?? ""} ${t.content ?? ""}`.trim())
            .join(" ")
            .trim(),
        {
          id: "search_text",
          header: () => null,
          cell: () => null,
          enableSorting: false,
        },
      ),
      columnHelper.accessor("published_at", {
        header: "Status",
        cell: (info) => (info.getValue() ? "Published" : "Draft"),
      }),
      columnHelper.accessor("comment_count", {
        header: "Comments",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("reaction_count", {
        header: "Reactions",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("created_at", {
        header: "Created",
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
      columnHelper.display({
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            {user?.roles?.can_edit_blog ? (
              <button
                className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
                onClick={() => loadForEdit(row.original)}
                type="button"
              >
                Edit
              </button>
            ) : null}
            {user?.roles?.can_delete_blog ? (
              <button
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-600"
                onClick={() => deleteBlog.mutate(row.original.id)}
                type="button"
              >
                Delete
              </button>
            ) : null}
            {canPublishBlog ? (
              <button
                className="rounded border border-green-300 px-2 py-1 text-xs text-green-700 disabled:opacity-50"
                onClick={() => publishBlog.mutate(row.original.id)}
                type="button"
                disabled={Boolean(row.original.published_at) || publishBlog.isPending}
              >
                {row.original.published_at ? "Published" : "Publish"}
              </button>
            ) : null}
          </div>
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canPublishBlog, defaultLang?.code, deleteBlog, lang, publishBlog, user?.roles?.can_delete_blog, user?.roles?.can_edit_blog],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const mutationError = updateBlog.error ?? createBlog.error;
  const currentTranslation = translations[activeTab] ?? { title: "", content: "" };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Dashboard Blogs</h1>

      {canCreateBlog || canEditBlog ? (
        <form
          className="grid gap-3 rounded border border-slate-200 p-3 dark:border-slate-800"
          onSubmit={(e) => {
            e.preventDefault();
            const payload = buildPayload();
            if (editBlogId !== null) {
              updateBlog.mutate(
                { id: editBlogId, payload },
                { onSuccess: () => resetForm() },
              );
              return;
            }
            if (canCreateBlog) {
              createBlog.mutate(payload, { onSuccess: () => resetForm() });
            }
          }}
        >
          {mutationError ? (
            <p className="text-red-500 text-sm">Error: {mutationError.message || "An unknown error occurred."}</p>
          ) : null}

          {/* ---- Blog-level Language Tabs ---- */}
          {languages.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Blog Title &amp; Content</p>
              <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-1 dark:border-slate-700">
                {languages.map((language) => {
                  const isActive = activeTab === language.code;
                  const hasContent =
                    (translations[language.code]?.title ?? "").trim() ||
                    (translations[language.code]?.content ?? "").trim();
                  return (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => setActiveLangTab(language.code)}
                      className={[
                        "rounded-t px-3 py-1 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
                        hasContent && !isActive ? "border-green-400 dark:border-green-600" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {language.name}
                      {language.default ? " *" : ""}
                    </button>
                  );
                })}
              </div>

              {/* Per-language title + content */}
              <input
                value={currentTranslation.title}
                onChange={(e) => setTranslationField(activeTab, "title", e.target.value)}
                placeholder={`Title (${activeTab})${defaultLang?.code === activeTab ? " — required" : " — optional"}`}
                className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
              <textarea
                value={currentTranslation.content}
                onChange={(e) => setTranslationField(activeTab, "content", e.target.value)}
                placeholder={`Content (${activeTab})${defaultLang?.code === activeTab ? " — required" : " — optional"}`}
                rows={5}
                className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          ) : (
            /* Fallback if languages haven't loaded yet */
            <>
              <input
                value={currentTranslation.title}
                onChange={(e) => setTranslationField(activeTab, "title", e.target.value)}
                placeholder="Title"
                className="rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
              <textarea
                value={currentTranslation.content}
                onChange={(e) => setTranslationField(activeTab, "content", e.target.value)}
                placeholder="Content"
                className="rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </>
          )}

          {/* ---- Sections ---- */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Sections</h2>
              <button
                type="button"
                onClick={addSection}
                className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
              >
                Add Section
              </button>
            </div>

            {effectiveSections.map((section, index) => (
              <div key={section.id ?? `new-${index}`} className="space-y-2 rounded border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Section {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-600"
                  >
                    Remove
                  </button>
                </div>

                {/* Per-language section title + content */}
                {languages.length > 0 ? (
                  <SectionLangTabs
                    languages={languages}
                    translations={section.translations}
                    defaultLangCode={defaultLang?.code ?? ""}
                    onChange={(code, field, value) =>
                      updateSectionTranslation(index, code, field, value)
                    }
                  />
                ) : (
                  /* Fallback before languages load */
                  <>
                    <input
                      value={section.translations[""]?.title ?? ""}
                      onChange={(e) => updateSectionTranslation(index, "", "title", e.target.value)}
                      placeholder="Section title"
                      className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    />
                    <textarea
                      value={section.translations[""]?.content ?? ""}
                      onChange={(e) => updateSectionTranslation(index, "", "content", e.target.value)}
                      placeholder="Section content"
                      className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </>
                )}

                {/* Image */}
                {section.imageUrl && !section.removeImage ? (
                  <div className="space-y-2">
                    <img src={section.imageUrl} alt={`Section ${index + 1}`} className="max-h-40 rounded border border-slate-200 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={() => updateSectionField(index, "removeImage", true)}
                      className="rounded border border-red-300 px-2 py-1 text-xs text-red-600"
                    >
                      Remove existing image
                    </button>
                  </div>
                ) : null}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    updateSectionField(index, "imageFile", file);
                    if (file) {
                      updateSectionField(index, "removeImage", false);
                    }
                  }}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            ))}
          </div>

          {/* ---- Actions ---- */}
          <div className="flex gap-2">
            {editBlogId !== null || canCreateBlog ? (
              <button
                type="submit"
                className="w-fit rounded bg-slate-900 px-3 py-2 text-white dark:bg-slate-200 dark:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : editBlogId !== null ? "Update Blog" : "Create Blog"}
              </button>
            ) : null}
            {editBlogId !== null ? (
              <button
                type="button"
                className="w-fit rounded border border-slate-300 px-3 py-2 text-xs dark:border-slate-700"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            * Title and content are required for the default language. Switch language tabs to add translations for other languages.
          </p>
        </form>
      ) : null}

      {/* ---- Filter + Table ---- */}
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter blogs"
        className="rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
      />

      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border-b border-slate-200 px-2 py-2 text-left dark:border-slate-800">
                  {header.id === "search_text" ? null : (
                    <button onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                cell.column.id === "search_text" ? null : (
                  <td key={cell.id} className="border-b border-slate-100 px-2 py-2 dark:border-slate-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                )
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
