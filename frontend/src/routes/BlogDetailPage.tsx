import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { useLanguage } from "../contexts/LanguageContext";
import { useUser } from "../hooks/auth/useUser";
import { useAddBlogComment, useBlog, useBlogComments, useReactToBlog } from "../hooks/content/useBlogs";
import { useLanguages } from "../hooks/i18n/useLanguages";
import { useTranslation } from "../hooks/i18n/useTranslation";
import api from "../services/api";
import type { Blog, BlogCommentItem, BlogSection } from "../types";

const REACTION_OPTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Sad" },
  { type: "angry", emoji: "😡", label: "Angry" },
] as const;

type ReactionType = (typeof REACTION_OPTIONS)[number]["type"];
const isReactionType = (value: string): value is ReactionType =>
  REACTION_OPTIONS.some((option) => option.type === value);

function resolveBlogText(blog: Blog, lang: string, defaultLangCode: string | undefined) {
  const entries = blog.translations ?? [];
  const byCode = new Map(entries.map((entry) => [entry.code, entry]));
  const current = byCode.get(lang);
  const fallback = defaultLangCode ? byCode.get(defaultLangCode) : undefined;
  const firstNonEmpty = entries.find((entry) => (entry.title || "").trim() || (entry.content || "").trim());
  const sectionByLang = blog.sections
    .map((section) => {
      const sectionTranslations = section.translations ?? [];
      const sectionByCode = new Map(sectionTranslations.map((entry) => [entry.code, entry]));
      const sectionCurrent = sectionByCode.get(lang);
      const sectionDefault = defaultLangCode ? sectionByCode.get(defaultLangCode) : undefined;
      const sectionAny = sectionTranslations.find(
        (entry) => (entry.title || "").trim() || (entry.content || "").trim(),
      );
      return {
        title:
          (sectionCurrent?.title || "").trim() ||
          (sectionDefault?.title || "").trim() ||
          (sectionAny?.title || "").trim() ||
          (section.title || "").trim(),
        content:
          (sectionCurrent?.content || "").trim() ||
          (sectionDefault?.content || "").trim() ||
          (sectionAny?.content || "").trim() ||
          (section.content || "").trim(),
      };
    })
    .find((section) => section.title || section.content);

  return {
    title:
      (current?.title || "").trim() ||
      (fallback?.title || "").trim() ||
      (firstNonEmpty?.title || "").trim() ||
      (sectionByLang?.title || "").trim() ||
      (blog.title || "").trim(),
    content:
      (current?.content || "").trim() ||
      (fallback?.content || "").trim() ||
      (firstNonEmpty?.content || "").trim() ||
      (sectionByLang?.content || "").trim() ||
      (blog.content || "").trim(),
  };
}

function resolveSectionText(section: BlogSection, lang: string, defaultLangCode: string | undefined) {
  const entries = section.translations ?? [];
  const byCode = new Map(entries.map((entry) => [entry.code, entry]));
  const current = byCode.get(lang);
  const fallback = defaultLangCode ? byCode.get(defaultLangCode) : undefined;
  const firstNonEmpty = entries.find((entry) => (entry.title || "").trim() || (entry.content || "").trim());

  return {
    title:
      (current?.title || "").trim() ||
      (fallback?.title || "").trim() ||
      (firstNonEmpty?.title || "").trim() ||
      (section.title || "").trim(),
    content:
      (current?.content || "").trim() ||
      (fallback?.content || "").trim() ||
      (firstNonEmpty?.content || "").trim() ||
      (section.content || "").trim(),
  };
}

export function BlogDetailPage() {
  const { blogId } = useParams({ from: "/blog/$blogId" });
  const blogIdNum = Number(blogId);
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const { data: languages = [] } = useLanguages();
  const { data: user } = useUser(!!api.getTokens());
  const { data: blog, isLoading, error } = useBlog(blogIdNum, lang);
  const { data: comments = [], isLoading: commentsLoading } = useBlogComments(blogIdNum);
  const addComment = useAddBlogComment(lang, blogIdNum);
  const reactToBlog = useReactToBlog(lang, blogIdNum);
  const [commentText, setCommentText] = useState("");
  const [showCommentComposer, setShowCommentComposer] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [openReplyFor, setOpenReplyFor] = useState<number | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const closePickerTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const ignoreNextClickRef = useRef(false);
  const defaultLangCode = languages.find((language) => language.default)?.code;
  const likeReaction = REACTION_OPTIONS[0];
  const extraReactions = REACTION_OPTIONS.slice(1);
  const currentReactionOption = selectedReaction
    ? REACTION_OPTIONS.find((option) => option.type === selectedReaction) ?? likeReaction
    : likeReaction;
  const hasSelectedReaction = selectedReaction !== null;

  useEffect(() => {
    if (!blog?.user_reaction) {
      setSelectedReaction(null);
      return;
    }
    if (isReactionType(blog.user_reaction)) {
      setSelectedReaction(blog.user_reaction);
      return;
    }
    setSelectedReaction(null);
  }, [blog?.id, blog?.user_reaction]);

  const applyReaction = (reaction: ReactionType) => {
    if (!user) return;
    clearCloseReactionTimer();
    reactToBlog.mutate(reaction, {
      onSuccess: (response) => {
        const nextReaction = response.current_reaction;
        if (nextReaction && REACTION_OPTIONS.some((option) => option.type === nextReaction)) {
          setSelectedReaction(nextReaction as ReactionType);
        } else {
          setSelectedReaction(null);
        }
        setShowReactionPicker(false);
      },
    });
  };

  const clearCloseReactionTimer = () => {
    if (closePickerTimerRef.current !== null) {
      window.clearTimeout(closePickerTimerRef.current);
      closePickerTimerRef.current = null;
    }
  };

  const openReactionPicker = () => {
    clearCloseReactionTimer();
    setShowReactionPicker(true);
  };

  const scheduleCloseReactionPicker = () => {
    clearCloseReactionTimer();
    closePickerTimerRef.current = window.setTimeout(() => {
      setShowReactionPicker(false);
    }, 220);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLikeLongPress = () => {
    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      openReactionPicker();
    }, 450);
  };

  const endLikeTouch = () => {
    clearLongPressTimer();
    if (longPressTriggeredRef.current) {
      ignoreNextClickRef.current = true;
      return;
    }
    ignoreNextClickRef.current = true;
    applyReaction("like");
  };

  const handleLikeClick = () => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }
    applyReaction(selectedReaction ?? "like");
  };

  const setReplyText = (commentId: number, value: string) => {
    setReplyDrafts((prev) => ({ ...prev, [commentId]: value }));
  };

  const postReply = (commentId: number) => {
    const content = (replyDrafts[commentId] ?? "").trim();
    if (!content) return;
    addComment.mutate(
      { content, reply_to: commentId },
      {
        onSuccess: () => {
          setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }));
          setOpenReplyFor(null);
        },
      },
    );
  };

  if (isLoading) return <p>{t("common.loading", "Loading...")}</p>;
  if (error || !blog) return <p>{t("errors.blog_load_failed", "Failed to load blogs.")}</p>;

  const resolved = resolveBlogText(blog, lang, defaultLangCode);

  return (
    <section className="space-y-4">
      <div>
        <Link to="/blog" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          {t("blog.back_to_list", "Back to blog list")}
        </Link>
      </div>
      <article className="space-y-4 rounded border border-slate-200 p-4 dark:border-slate-800">
        <header>
          <h1 className="text-2xl font-bold">{resolved.title || t("blog.untitled", "Untitled")}</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {new Date(blog.created_at).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {blog.comment_count} {t("blog.comments", "comments")} · {blog.reaction_count} {t("blog.reactions", "reactions")}
          </p>
        </header>

        {resolved.content ? (
          <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-200">{resolved.content}</p>
        ) : null}

        <div className="space-y-4">
          {blog.sections.map((section) => {
            const sectionText = resolveSectionText(section, lang, defaultLangCode);
            return (
              <section key={section.id} className="space-y-2">
                {sectionText.title ? <h2 className="text-lg font-semibold">{sectionText.title}</h2> : null}
                {section.image ? (
                  <img
                    src={section.image}
                    alt={sectionText.title || t("blog.section_image", "Blog section image")}
                    className="max-h-80 rounded border border-slate-200 object-cover dark:border-slate-800"
                  />
                ) : null}
                {sectionText.content ? (
                  <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-200">{sectionText.content}</p>
                ) : null}
              </section>
            );
          })}
        </div>

        <section className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <h2 className="text-base font-semibold">React and Comment</h2>
          {user ? (
            <>
              <div
                className="relative w-fit"
                onMouseEnter={openReactionPicker}
                onMouseLeave={scheduleCloseReactionPicker}
              >
                <button
                  type="button"
                  onClick={handleLikeClick}
                  onTouchStart={startLikeLongPress}
                  onTouchEnd={endLikeTouch}
                  onTouchCancel={clearLongPressTimer}
                  disabled={reactToBlog.isPending}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    hasSelectedReaction
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
                    reactToBlog.isPending ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                >
                  <span className="mr-2">{currentReactionOption.emoji}</span>
                  {currentReactionOption.label}
                </button>

                {showReactionPicker ? (
                  <div
                    className="absolute left-0 top-full z-10 mt-1 flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                    onMouseEnter={openReactionPicker}
                    onMouseLeave={scheduleCloseReactionPicker}
                  >
                    {extraReactions.map((reaction) => (
                      <button
                        key={reaction.type}
                        type="button"
                        title={reaction.label}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          applyReaction(reaction.type);
                        }}
                        className="h-10 w-10 rounded-full text-xl transition hover:scale-110 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {reaction.emoji}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hover the like button on desktop, or long-press on mobile to choose other reactions.
              </p>

              {!showCommentComposer ? (
                <button
                  type="button"
                  onClick={() => setShowCommentComposer(true)}
                  className="w-fit rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
                >
                  Comment
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={addComment.isPending || !commentText.trim()}
                      onClick={() =>
                        addComment.mutate({ content: commentText.trim() }, {
                          onSuccess: () => {
                            setCommentText("");
                            setShowCommentComposer(false);
                          },
                        })
                      }
                      className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-200 dark:text-slate-900"
                    >
                      {addComment.isPending ? "Posting..." : "Post Comment"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCommentComposer(false);
                        setCommentText("");
                      }}
                      className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to react or leave a comment.
            </p>
          )}
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <h2 className="text-base font-semibold">Comments</h2>
          {commentsLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const replyText = replyDrafts[comment.id] ?? "";
                return (
                  <article key={comment.id} className="rounded border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-sm font-semibold">{comment.user_name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{comment.content}</p>

                    {user ? (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setOpenReplyFor((prev) => (prev === comment.id ? null : comment.id))}
                          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Reply
                        </button>
                      </div>
                    ) : null}

                    {openReplyFor === comment.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(comment.id, e.target.value)}
                          rows={2}
                          placeholder="Write a reply..."
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          disabled={addComment.isPending || !replyText.trim()}
                          onClick={() => postReply(comment.id)}
                          className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-200 dark:text-slate-900"
                        >
                          {addComment.isPending ? "Posting..." : "Post Reply"}
                        </button>
                      </div>
                    ) : null}

                    {comment.replies.length > 0 ? (
                      <div className="mt-3 space-y-2 border-l border-slate-200 pl-3 dark:border-slate-700">
                        {comment.replies.map((reply: Omit<BlogCommentItem, "replies">) => (
                          <div key={reply.id} className="rounded bg-slate-50 p-2 dark:bg-slate-900">
                            <p className="text-xs font-semibold">{reply.user_name}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(reply.created_at).toLocaleString()}
                            </p>
                            <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </article>
    </section>
  );
}
