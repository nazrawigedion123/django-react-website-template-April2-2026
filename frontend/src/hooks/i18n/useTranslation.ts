import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useLanguage } from "../../contexts/LanguageContext";
import { queryKeys } from "../../lib/queryKeys";
import api from "../../services/api";

export function useTranslation() {
  const { lang } = useLanguage();
  const { data } = useQuery({
    queryKey: queryKeys.translations.byLang(lang),
    queryFn: () => api.getFrontendTranslations(lang),
  });

  const dictionary = useMemo(() => {
    const mapped = new Map<string, string>();
    (data ?? []).forEach((item) => mapped.set(`${item.page}.${item.key}`, item.value));
    return mapped;
  }, [data]);

  const t = (key: string, fallback?: string) => dictionary.get(key) ?? fallback ?? key;

  return { t, lang };
}
