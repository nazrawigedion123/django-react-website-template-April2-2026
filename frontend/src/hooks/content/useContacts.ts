import { useMutation, useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import api from "../../services/api";

export const useCreateContact = () =>
  useMutation({
    mutationFn: (payload: { name: string; email: string; message: string }) => api.createContact(payload),
  });

export const useCreateSubscriber = () =>
  useMutation({
    mutationFn: (payload: { email: string }) => api.createSubscriber(payload),
  });

export const useDashboardContacts = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.contacts.dashboard(),
    queryFn: () => api.getDashboardContacts(),
    enabled,
  });

export const useDashboardSubscribers = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.subscribers.dashboard(),
    queryFn: () => api.getDashboardSubscribers(),
    enabled,
  });
