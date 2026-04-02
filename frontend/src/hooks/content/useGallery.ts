import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import api from "../../services/api";

export const useGallery = (lang: string) =>
  useQuery({
    queryKey: queryKeys.gallery.list(lang),
    queryFn: () => api.getGallery(lang),
  });

export const useDashboardMedia = (lang: string) =>
  useQuery({
    queryKey: queryKeys.gallery.dashboard(lang),
    queryFn: () => api.getDashboardMedia(lang),
  });

export const useUploadPicture = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.uploadPicture(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.list(lang) });
    },
  });
};

export const useUpdatePicture = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) => api.updatePicture(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.list(lang) });
    },
  });
};

export const useDeletePicture = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletePicture(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.list(lang) });
    },
  });
};

export const useUploadVideo = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.uploadVideo(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.list(lang) });
    },
  });
};

export const useUpdateVideo = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) => api.updateVideo(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.list(lang) });
    },
  });
};

export const useDeleteVideo = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.list(lang) });
    },
  });
};

export const useUploadYoutube = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { video: string; translations: string }) => api.uploadYoutube(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.list(lang) });
    },
  });
};

export const useUpdateYoutube = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { video: string; translations: string } }) =>
      api.updateYoutube(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.list(lang) });
    },
  });
};

export const useDeleteYoutube = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteYoutube(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.dashboard(lang) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.list(lang) });
    },
  });
};
