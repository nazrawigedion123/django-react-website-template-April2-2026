import { queryOptions, useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import api from "../../services/api";
import type { User } from "../../types";

export const userQueryOptions = (enabled = true) =>
  queryOptions<User>({
    queryKey: queryKeys.auth.user(),
    queryFn: () => api.getCurrentUser(),
    enabled,
    staleTime: Infinity,
    retry: false,
  });

export const useUser = (enabled = true) => useQuery(userQueryOptions(enabled));
