import { useGallery } from "../hooks/content/useGallery";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslation } from "../hooks/i18n/useTranslation";

function extractYoutubeSrc(iframeHtml: string): string | null {
  const match = iframeHtml.match(/src=["']([^"']+)["']/i);
  if (!match) {
    return null;
  }
  return match[1];
}

export function GalleryPage() {
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const { data, isLoading, error } = useGallery(lang);

  if (isLoading) return <p>{t("common.loading", "Loading...")}</p>;
  if (error) return <p>{t("errors.gallery_load_failed", "Failed to load gallery.")}</p>;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{t("headers.gallery_title", "Gallery")}</h1>

      <div>
        <h2 className="font-semibold">{t("gallery.pictures", "Pictures")}</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          {data?.pictures.map((picture) => (
            <article key={picture.id} className="rounded border border-slate-200 p-3 dark:border-slate-800">
              <img src={picture.image} alt={picture.title} className="mb-2 h-52 w-full rounded object-cover" />
              <p className="font-medium">{picture.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{picture.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold">{t("gallery.videos", "Videos")}</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          {data?.videos.map((video) => (
            <article key={video.id} className="rounded border border-slate-200 p-3 dark:border-slate-800">
              <video className="mb-2 h-52 w-full rounded bg-black object-cover" controls preload="metadata">
                <source src={video.stream_url || video.video} />
              </video>
              <p className="font-medium">{video.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{video.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold">{t("gallery.youtube", "YouTube")}</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          {(data?.youtube_videos ?? []).map((youtubeVideo) => {
            const src = extractYoutubeSrc(youtubeVideo.video);
            return (
              <article key={youtubeVideo.id} className="rounded border border-slate-200 p-3 dark:border-slate-800">
                {src ? (
                  <iframe
                    src={src}
                    title={youtubeVideo.title || `youtube-${youtubeVideo.id}`}
                    className="mb-2 h-52 w-full rounded"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : null}
                <p className="font-medium">{youtubeVideo.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{youtubeVideo.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
