export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
  },
  blogs: {
    all: ["blogs"] as const,
    list: (lang: string) => [...queryKeys.blogs.all, "list", lang] as const,
    detail: (id: number, lang: string) => [...queryKeys.blogs.all, "detail", id, lang] as const,
    comments: (id: number) => [...queryKeys.blogs.all, "comments", id] as const,
    dashboard: (lang: string) => [...queryKeys.blogs.all, "dashboard", lang] as const,
  },
  gallery: {
    all: ["gallery"] as const,
    list: (lang: string) => [...queryKeys.gallery.all, "list", lang] as const,
    dashboard: (lang: string) => [...queryKeys.gallery.all, "dashboard", lang] as const,
  },
  translations: {
    all: ["translations"] as const,
    byLang: (lang: string) => [...queryKeys.translations.all, lang] as const,
  },
  languages: {
    all: ["languages"] as const,
    list: () => [...queryKeys.languages.all, "list"] as const,
  },
  users: {
    all: ["users"] as const,
    dashboard: () => [...queryKeys.users.all, "dashboard"] as const,
  },
  contacts: {
    all: ["contacts"] as const,
    dashboard: () => [...queryKeys.contacts.all, "dashboard"] as const,
  },
  subscribers: {
    all: ["subscribers"] as const,
    dashboard: () => [...queryKeys.subscribers.all, "dashboard"] as const,
  },
  frontendAssets: {
    all: ["frontend-assets"] as const,
    socials: () => [...queryKeys.frontendAssets.all, "socials"] as const,
    partners: (lang: string) => [...queryKeys.frontendAssets.all, "partners", lang] as const,
    heroSection: () => [...queryKeys.frontendAssets.all, "hero-section"] as const,
    logoSection: () => [...queryKeys.frontendAssets.all, "logo-section"] as const,
    faqs: (lang: string) => [...queryKeys.frontendAssets.all, "faqs", lang] as const,
  },
};
