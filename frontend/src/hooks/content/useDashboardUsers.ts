import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import api from "../../services/api";
import type { User } from "../../types";

export const useDashboardUsers = () =>
  useQuery({
    queryKey: queryKeys.users.dashboard(),
    queryFn: () => api.getDashboardUsers(),
  });

export const useUpdateDashboardUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<User["roles"]> }) =>
      api.updateDashboardUserRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
    },
  });
};
