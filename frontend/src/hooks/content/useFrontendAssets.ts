import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import api from "../../services/api";

export const useSocials = () =>
  useQuery({
    queryKey: queryKeys.frontendAssets.socials(),
    queryFn: () => api.getSocials(),
  });

export const useCreateSocial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; url: string; icon: string }) => api.createSocial(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.socials() });
    },
  });
};

export const useUpdateSocial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name: string; url: string; icon: string } }) =>
      api.updateSocial(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.socials() });
    },
  });
};

export const useDeleteSocial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSocial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.socials() });
    },
  });
};

export const usePartners = (lang: string) =>
  useQuery({
    queryKey: queryKeys.frontendAssets.partners(lang),
    queryFn: () => api.getPartners(lang),
  });

export const useCreatePartner = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData) => api.createPartner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.partners(lang) });
    },
  });
};

export const useUpdatePartner = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) => api.updatePartner(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.partners(lang) });
    },
  });
};

export const useDeletePartner = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletePartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.partners(lang) });
    },
  });
};

export const useHeroSection = () =>
  useQuery({
    queryKey: queryKeys.frontendAssets.heroSection(),
    queryFn: () => api.getHeroSection(),
  });

export const useCreateHeroSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData) => api.createHeroSection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.heroSection() });
    },
  });
};

export const useUpdateHeroSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) => api.updateHeroSection(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.heroSection() });
    },
  });
};

export const useLogoSection = () =>
  useQuery({
    queryKey: queryKeys.frontendAssets.logoSection(),
    queryFn: () => api.getLogoSection(),
  });

export const useCreateLogoSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData) => api.createLogoSection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.logoSection() });
    },
  });
};

export const useUpdateLogoSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) => api.updateLogoSection(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.logoSection() });
    },
  });
};

export const useFaqs = (lang: string) =>
  useQuery({
    queryKey: queryKeys.frontendAssets.faqs(lang),
    queryFn: () => api.getFaqs(lang),
  });

export const useCreateFaq = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { active: boolean; translations: string }) => api.createFaq(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.faqs(lang) });
    },
  });
};

export const useUpdateFaq = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { active: boolean; translations: string } }) =>
      api.updateFaq(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.faqs(lang) });
    },
  });
};

export const useDeleteFaq = (lang: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteFaq(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.frontendAssets.faqs(lang) });
    },
  });
};
