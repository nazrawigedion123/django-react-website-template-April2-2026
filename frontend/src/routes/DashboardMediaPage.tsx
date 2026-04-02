import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import {
  useDeletePicture,
  useDeleteVideo,
  useDashboardMedia,
  useUpdatePicture,
  useUpdateVideo,
  useDeleteYoutube,
  useUpdateYoutube,
  useUploadPicture,
  useUploadVideo,
  useUploadYoutube,
} from "../hooks/content/useGallery";
import api from "../services/api";
import type { Picture, Video, YoutubeVideo } from "../types";

type MediaRow = {
  id: number;
  kind: "picture" | "video" | "youtube";
  title: string;
  description: string;
  created_at: string;
};

type MediaTranslationsMap = Record<string, { title: string; description: string }>;
type YoutubeTranslationsMap = Record<string, { title: string; description: string }>;

const columnHelper = createColumnHelper<MediaRow>();

export function DashboardMediaPage() {
  const { lang } = useLanguage();
  const { data: user } = useUser(!!api.getTokens());
  const { data } = useDashboardMedia(lang);
  const { data: languages = [] } = useLanguages();
  const uploadPicture = useUploadPicture(lang);
  const uploadVideo = useUploadVideo(lang);
  const updatePicture = useUpdatePicture(lang);
  const updateVideo = useUpdateVideo(lang);
  const deletePicture = useDeletePicture(lang);
  const deleteVideo = useDeleteVideo(lang);
  const uploadYoutube = useUploadYoutube(lang);
  const updateYoutube = useUpdateYoutube(lang);
  const deleteYoutube = useDeleteYoutube(lang);
  const canCreateMedia = Boolean(user?.roles?.can_create_media || user?.roles?.can_manage_media);
  const canEditMedia = Boolean(user?.roles?.can_edit_media || user?.roles?.can_manage_media);
  const canDeleteMedia = Boolean(user?.roles?.can_delete_media || user?.roles?.can_manage_media);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");

  const defaultLangCode = useMemo(
    () => languages.find((entry) => entry.default)?.code ?? languages[0]?.code ?? "",
    [languages],
  );
  const emptyYoutubeTranslations = useMemo(
    () =>
      Object.fromEntries(languages.map((entry) => [entry.code, { title: "", description: "" }])) as YoutubeTranslationsMap,
    [languages],
  );
  const emptyMediaTranslations = useMemo(
    () =>
      Object.fromEntries(languages.map((entry) => [entry.code, { title: "", description: "" }])) as MediaTranslationsMap,
    [languages],
  );

  const [youtubeEdit, setYoutubeEdit] = useState<YoutubeVideo | null>(null);
  const [youtubeCode, setYoutubeCode] = useState("");
  const [youtubeTab, setYoutubeTab] = useState("");
  const [youtubeTranslations, setYoutubeTranslations] = useState<YoutubeTranslationsMap>({});
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [pictureEditId, setPictureEditId] = useState<number | null>(null);
  const [pictureTab, setPictureTab] = useState("");
  const [pictureTranslations, setPictureTranslations] = useState<MediaTranslationsMap>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoEditId, setVideoEditId] = useState<number | null>(null);
  const [videoTab, setVideoTab] = useState("");
  const [videoTranslations, setVideoTranslations] = useState<MediaTranslationsMap>({});

  useEffect(() => {
    if (!languages.length) {
      return;
    }
    setYoutubeTranslations((prev) => (Object.keys(prev).length ? prev : emptyYoutubeTranslations));
    setYoutubeTab((prev) => prev || defaultLangCode);
    setPictureTranslations((prev) => (Object.keys(prev).length ? prev : emptyMediaTranslations));
    setPictureTab((prev) => prev || defaultLangCode);
    setVideoTranslations((prev) => (Object.keys(prev).length ? prev : emptyMediaTranslations));
    setVideoTab((prev) => prev || defaultLangCode);
  }, [defaultLangCode, emptyMediaTranslations, emptyYoutubeTranslations, languages.length]);

  const youtubeActiveTab = youtubeTab || defaultLangCode || "";
  const pictureActiveTab = pictureTab || defaultLangCode || "";
  const videoActiveTab = videoTab || defaultLangCode || "";

  const picturesById = useMemo(
    () => new Map((data?.pictures ?? []).map((item) => [item.id, item] as const)),
    [data?.pictures],
  );
  const videosById = useMemo(
    () => new Map((data?.videos ?? []).map((item) => [item.id, item] as const)),
    [data?.videos],
  );

  const resetYoutubeForm = () => {
    setYoutubeEdit(null);
    setYoutubeCode("");
    setYoutubeTab(defaultLangCode);
    setYoutubeTranslations(emptyYoutubeTranslations);
  };

  const resetPictureForm = () => {
    setPictureFile(null);
    setPictureEditId(null);
    setPictureTab(defaultLangCode);
    setPictureTranslations(emptyMediaTranslations);
  };

  const resetVideoForm = () => {
    setVideoFile(null);
    setVideoEditId(null);
    setVideoTab(defaultLangCode);
    setVideoTranslations(emptyMediaTranslations);
  };

  const loadYoutubeForEdit = (item: YoutubeVideo) => {
    const next = { ...emptyYoutubeTranslations };
    for (const row of item.translations ?? []) {
      if (next[row.code]) {
        next[row.code] = { title: row.title ?? "", description: row.description ?? "" };
      }
    }
    setYoutubeEdit(item);
    setYoutubeCode(item.video);
    setYoutubeTab(defaultLangCode);
    setYoutubeTranslations(next);
  };

  const loadPictureForEdit = (item: Picture) => {
    const next = { ...emptyMediaTranslations };
    for (const row of item.translations ?? []) {
      if (next[row.code]) {
        next[row.code] = { title: row.title ?? "", description: row.description ?? "" };
      }
    }
    setPictureFile(null);
    setPictureEditId(item.id);
    setPictureTab(defaultLangCode);
    setPictureTranslations(next);
  };

  const loadVideoForEdit = (item: Video) => {
    const next = { ...emptyMediaTranslations };
    for (const row of item.translations ?? []) {
      if (next[row.code]) {
        next[row.code] = { title: row.title ?? "", description: row.description ?? "" };
      }
    }
    setVideoFile(null);
    setVideoEditId(item.id);
    setVideoTab(defaultLangCode);
    setVideoTranslations(next);
  };

  const rows: MediaRow[] = useMemo(() => {
    const pictures = (data?.pictures ?? []).map((item) => ({
      id: item.id,
      kind: "picture" as const,
      title: item.title,
      description: item.description,
      created_at: item.created_at,
    }));
    const videos = (data?.videos ?? []).map((item) => ({
      id: item.id,
      kind: "video" as const,
      title: item.title,
      description: item.description,
      created_at: item.created_at,
    }));
    const youtubeVideos = (data?.youtube_videos ?? []).map((item) => ({
      id: item.id,
      kind: "youtube" as const,
      title: item.title,
      description: item.description,
      created_at: item.created_at,
    }));
    return [...pictures, ...videos, ...youtubeVideos];
  }, [data]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("kind", { header: "Type", cell: (info) => info.getValue() }),
      columnHelper.accessor("title", { header: "Title", cell: (info) => info.getValue() }),
      columnHelper.accessor("created_at", {
        header: "Created",
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
      columnHelper.display({
        id: "actions",
        header: "Action",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex gap-2">
              {canEditMedia ? (
                <button
                  type="button"
                  onClick={() => {
                    if (row.kind === "picture") {
                      const item = picturesById.get(row.id);
                      if (item) loadPictureForEdit(item);
                    } else if (row.kind === "video") {
                      const item = videosById.get(row.id);
                      if (item) loadVideoForEdit(item);
                    } else {
                      const item = (data?.youtube_videos ?? []).find((entry) => entry.id === row.id);
                      if (item) loadYoutubeForEdit(item);
                    }
                  }}
                  className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
                >
                  Edit
                </button>
              ) : null}
              {canDeleteMedia ? (
                <button
                  type="button"
                  onClick={() => {
                    if (row.kind === "picture") {
                      deletePicture.mutate(row.id);
                    } else if (row.kind === "video") {
                      deleteVideo.mutate(row.id);
                    } else {
                      deleteYoutube.mutate(row.id);
                    }
                  }}
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-600"
                >
                  Delete
                </button>
              ) : null}
            </div>
          );
        },
      }),
    ],
    [
      canDeleteMedia,
      canEditMedia,
      data?.youtube_videos,
      deletePicture,
      deleteVideo,
      deleteYoutube,
      picturesById,
      videosById,
    ],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      globalFilter: filter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const onYoutubeSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const defaultTranslation = youtubeTranslations[defaultLangCode];
    if (!youtubeCode.trim() || !defaultTranslation?.title?.trim()) {
      return;
    }

    const translations = Object.entries(youtubeTranslations)
      .map(([code, value]) => ({
        code,
        title: value.title.trim(),
        description: value.description.trim(),
      }))
      .filter((row) => row.title || row.description || row.code === defaultLangCode);

    const payload = {
      video: youtubeCode.trim(),
      translations: JSON.stringify(translations),
    };

    if (youtubeEdit) {
      updateYoutube.mutate({ id: youtubeEdit.id, payload }, { onSuccess: resetYoutubeForm });
      return;
    }
    uploadYoutube.mutate(payload, { onSuccess: resetYoutubeForm });
  };

  const onPictureSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const defaultTranslation = pictureTranslations[defaultLangCode];
    if ((!pictureFile && !pictureEditId) || !defaultTranslation?.title?.trim()) {
      return;
    }

    const translations = Object.entries(pictureTranslations)
      .map(([code, value]) => ({
        code,
        title: value.title.trim(),
        description: value.description.trim(),
      }))
      .filter((row) => row.title || row.description || row.code === defaultLangCode);

    const formData = new FormData();
    if (pictureFile) {
      formData.append("image", pictureFile);
    }
    formData.append("translations", JSON.stringify(translations));
    if (pictureEditId) {
      updatePicture.mutate({ id: pictureEditId, payload: formData }, { onSuccess: resetPictureForm });
    } else {
      uploadPicture.mutate(formData, { onSuccess: resetPictureForm });
    }
  };

  const onVideoSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const defaultTranslation = videoTranslations[defaultLangCode];
    if ((!videoFile && !videoEditId) || !defaultTranslation?.title?.trim()) {
      return;
    }

    const translations = Object.entries(videoTranslations)
      .map(([code, value]) => ({
        code,
        title: value.title.trim(),
        description: value.description.trim(),
      }))
      .filter((row) => row.title || row.description || row.code === defaultLangCode);

    const formData = new FormData();
    if (videoFile) {
      formData.append("video", videoFile);
    }
    formData.append("translations", JSON.stringify(translations));
    if (videoEditId) {
      updateVideo.mutate({ id: videoEditId, payload: formData }, { onSuccess: resetVideoForm });
    } else {
      uploadVideo.mutate(formData, { onSuccess: resetVideoForm });
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Dashboard Media</h1>

      {canCreateMedia ? (
        <div className="grid gap-3 md:grid-cols-2">
          <form className="grid gap-2 rounded border border-slate-200 p-3 dark:border-slate-800" onSubmit={onPictureSubmit}>
            <h2 className="font-semibold">{pictureEditId ? "Edit Picture" : "Upload Picture"}</h2>
            <input type="file" accept="image/*" onChange={(e) => setPictureFile(e.target.files?.[0] ?? null)} />
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
              {languages.map((row) => (
                <button
                  key={`picture-${row.code}`}
                  type="button"
                  onClick={() => setPictureTab(row.code)}
                  className={[
                    "rounded px-2 py-1 text-xs",
                    pictureActiveTab === row.code ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900" : "border border-slate-300 dark:border-slate-700",
                  ].join(" ")}
                >
                  {row.name}
                  {row.default ? " *" : ""}
                </button>
              ))}
            </div>
            <input
              value={pictureTranslations[pictureActiveTab]?.title ?? ""}
              onChange={(e) =>
                setPictureTranslations((prev) => ({
                  ...prev,
                  [pictureActiveTab]: {
                    ...(prev[pictureActiveTab] ?? { title: "", description: "" }),
                    title: e.target.value,
                  },
                }))
              }
              placeholder={`Title (${pictureActiveTab})${pictureActiveTab === defaultLangCode ? " - required" : ""}`}
              className="rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
            <textarea
              value={pictureTranslations[pictureActiveTab]?.description ?? ""}
              onChange={(e) =>
                setPictureTranslations((prev) => ({
                  ...prev,
                  [pictureActiveTab]: {
                    ...(prev[pictureActiveTab] ?? { title: "", description: "" }),
                    description: e.target.value,
                  },
                }))
              }
              rows={3}
              placeholder={`Description (${pictureActiveTab})`}
              className="rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
            <button type="submit" className="w-fit rounded bg-slate-900 px-3 py-2 text-white dark:bg-slate-200 dark:text-slate-900">
              {pictureEditId ? "Update" : "Upload"}
            </button>
            {pictureEditId ? (
              <button type="button" onClick={resetPictureForm} className="w-fit rounded border border-slate-300 px-3 py-2 dark:border-slate-700">
                Cancel
              </button>
            ) : null}
          </form>

          <form className="grid gap-2 rounded border border-slate-200 p-3 dark:border-slate-800" onSubmit={onVideoSubmit}>
            <h2 className="font-semibold">{videoEditId ? "Edit Video" : "Upload Video"}</h2>
            <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
              {languages.map((row) => (
                <button
                  key={`video-${row.code}`}
                  type="button"
                  onClick={() => setVideoTab(row.code)}
                  className={[
                    "rounded px-2 py-1 text-xs",
                    videoActiveTab === row.code ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900" : "border border-slate-300 dark:border-slate-700",
                  ].join(" ")}
                >
                  {row.name}
                  {row.default ? " *" : ""}
                </button>
              ))}
            </div>
            <input
              value={videoTranslations[videoActiveTab]?.title ?? ""}
              onChange={(e) =>
                setVideoTranslations((prev) => ({
                  ...prev,
                  [videoActiveTab]: {
                    ...(prev[videoActiveTab] ?? { title: "", description: "" }),
                    title: e.target.value,
                  },
                }))
              }
              placeholder={`Title (${videoActiveTab})${videoActiveTab === defaultLangCode ? " - required" : ""}`}
              className="rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
            <textarea
              value={videoTranslations[videoActiveTab]?.description ?? ""}
              onChange={(e) =>
                setVideoTranslations((prev) => ({
                  ...prev,
                  [videoActiveTab]: {
                    ...(prev[videoActiveTab] ?? { title: "", description: "" }),
                    description: e.target.value,
                  },
                }))
              }
              rows={3}
              placeholder={`Description (${videoActiveTab})`}
              className="rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
            <button type="submit" className="w-fit rounded bg-slate-900 px-3 py-2 text-white dark:bg-slate-200 dark:text-slate-900">
              {videoEditId ? "Update" : "Upload"}
            </button>
            {videoEditId ? (
              <button type="button" onClick={resetVideoForm} className="w-fit rounded border border-slate-300 px-3 py-2 dark:border-slate-700">
                Cancel
              </button>
            ) : null}
          </form>
        </div>
      ) : null}

      {canCreateMedia || canEditMedia ? (
        <article className="space-y-3 rounded border border-slate-200 p-4 dark:border-slate-800">
          <h2 className="font-semibold">{youtubeEdit ? "Edit YouTube Embed" : "Add YouTube Embed"}</h2>
          <form onSubmit={onYoutubeSubmit} className="space-y-3">
            <textarea
              value={youtubeCode}
              onChange={(e) => setYoutubeCode(e.target.value)}
              rows={4}
              placeholder="<iframe src='https://www.youtube.com/embed/...'></iframe>"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
              {languages.map((row) => (
                <button
                  key={row.code}
                  type="button"
                  onClick={() => setYoutubeTab(row.code)}
                  className={[
                    "rounded px-2 py-1 text-xs",
                    youtubeActiveTab === row.code ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900" : "border border-slate-300 dark:border-slate-700",
                  ].join(" ")}
                >
                  {row.name}
                  {row.default ? " *" : ""}
                </button>
              ))}
            </div>

            <input
              value={youtubeTranslations[youtubeActiveTab]?.title ?? ""}
              onChange={(e) =>
                setYoutubeTranslations((prev) => ({
                  ...prev,
                  [youtubeActiveTab]: {
                    ...(prev[youtubeActiveTab] ?? { title: "", description: "" }),
                    title: e.target.value,
                  },
                }))
              }
              placeholder={`Title (${youtubeActiveTab})${youtubeActiveTab === defaultLangCode ? " - required" : ""}`}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <textarea
              value={youtubeTranslations[youtubeActiveTab]?.description ?? ""}
              onChange={(e) =>
                setYoutubeTranslations((prev) => ({
                  ...prev,
                  [youtubeActiveTab]: {
                    ...(prev[youtubeActiveTab] ?? { title: "", description: "" }),
                    description: e.target.value,
                  },
                }))
              }
              rows={3}
              placeholder={`Description (${youtubeActiveTab})`}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <div className="flex gap-2">
              <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white dark:bg-slate-200 dark:text-slate-900">
                {youtubeEdit ? "Update YouTube" : "Create YouTube"}
              </button>
              {youtubeEdit ? (
                <button type="button" onClick={resetYoutubeForm} className="rounded border border-slate-300 px-3 py-2 dark:border-slate-700">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </article>
      ) : null}

      <article className="space-y-2 rounded border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold">YouTube Embeds</h2>
        {(data?.youtube_videos ?? []).map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm dark:border-slate-700">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-slate-500 dark:text-slate-400">{item.description}</p>
            </div>
            <div className="flex gap-2">
              {canEditMedia ? (
                <button type="button" onClick={() => loadYoutubeForEdit(item)} className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700">
                  Edit
                </button>
              ) : null}
              {canDeleteMedia ? (
                <button type="button" onClick={() => deleteYoutube.mutate(item.id)} className="rounded border border-red-300 px-2 py-1 text-red-600">
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </article>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter media"
        className="rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
      />

      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border-b border-slate-200 px-2 py-2 text-left dark:border-slate-800">
                  <button onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </button>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border-b border-slate-100 px-2 py-2 dark:border-slate-900">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
