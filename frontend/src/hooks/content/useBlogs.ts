import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import api from "../../services/api";

export const useBlogs = (lang: string) =>
  useQuery({
    queryKey: queryKeys.blogs.list(lang),
    queryFn: () => api.getBlogs(lang),
  });

export const useDashboardBlogs = (lang: string) =>
  useQuery({
    queryKey: queryKeys.blogs.dashboard(lang),
    queryFn: () => api.getDashboardBlogs(lang),
  });

export const useBlog = (id: number, lang: string) =>
  useQuery({
    queryKey: queryKeys.blogs.detail(id, lang),
    queryFn: () => api.getBlog(id, lang),
    enabled: Number.isFinite(id) && id > 0,
  });

export const useBlogComments = (id: number) =>
  useQuery({
    queryKey: queryKeys.blogs.comments(id),
    queryFn: () => api.getBlogComments(id),
    enabled: Number.isFinite(id) && id > 0,
  });

export const useCreateBlog = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData) => api.createBlog(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.list(lang) });
    },
  });
};

export const useUpdateBlog = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) => api.updateBlog(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.list(lang) });
    },
  });
};

export const useDeleteBlog = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.list(lang) });
    },
  });
};

export const usePublishBlog = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.publishBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.list(lang) });
    },
  });
};

export const useAddBlogComment = (lang: string, id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; reply_to?: number }) => api.addBlogComment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.detail(id, lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.comments(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.list(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.dashboard(lang) });
    },
  });
};

export const useReactToBlog = (lang: string, id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reactionType: string) => api.reactToBlog(id, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.detail(id, lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.list(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.dashboard(lang) });
    },
  });
};
