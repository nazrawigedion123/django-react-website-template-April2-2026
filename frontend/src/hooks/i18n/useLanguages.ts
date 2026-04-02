import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import api from "../../services/api";

export function useLanguages() {
  return useQuery({
    queryKey: queryKeys.languages.list(),
    queryFn: () => api.getLanguages(),
  });
}
