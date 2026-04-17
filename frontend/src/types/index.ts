export interface Roles {
  can_create_blog: boolean;
  can_edit_blog: boolean;
  can_delete_blog: boolean;
  can_publish_blog: boolean;
  can_manage_users: boolean;
  can_create_media: boolean;
  can_edit_media: boolean;
  can_delete_media: boolean;
  can_manage_media?: boolean;
  can_manage_subscribers: boolean;
  can_manage_contacts: boolean;
  can_manage_settings: boolean;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  language: string | null;
  roles: Partial<Roles>;
}

export interface LanguageOption {
  id: number;
  name: string;
  code: string;
  default: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface RegisterPayload extends LoginCredentials {
  first_name: string;
  last_name: string;
}

export interface RegisterResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface Blog {
  id: number;
  author: number;
  title: string;
  content: string;
  comment_count: number;
  reaction_count: number;
  user_reaction: string | null;
  translations: BlogTranslation[];
  sections: BlogSection[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  published_by: number | null;
}

export interface BlogCommentResponse {
  id: number;
  content: string;
  created_at: string;
  reply_to?: number | null;
  comment_count: number;
  reaction_count: number;
}

export interface BlogReactionResponse {
  id: number | null;
  reaction_type: string | null;
  action: "created" | "updated" | "removed";
  current_reaction: string | null;
  comment_count: number;
  reaction_count: number;
}

export interface BlogCommentItem {
  id: number;
  user: number;
  user_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  reply_to?: number | null;
  replies: Omit<BlogCommentItem, "replies">[];
}

export interface BlogTranslation {
  code: string;
  title: string;
  content: string;
}

export interface BlogSectionTranslation {
  code: string;
  title: string;
  content: string;
}

export interface BlogSection {
  id: number;
  order: number;
  /** Language-resolved title (current request lang / default lang fallback) */
  title: string;
  /** Language-resolved content */
  content: string;
  image: string | null;
  /** All stored translations for dashboard editing */
  translations: BlogSectionTranslation[];
}

export interface Picture {
  id: number;
  image: string;
  title: string;
  description: string;
  translations?: Array<{ code: string; title: string; description: string }>;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: number;
  video: string;
  stream_url?: string;
  title: string;
  description: string;
  translations?: Array<{ code: string; title: string; description: string }>;
  created_at: string;
  updated_at: string;
}

export interface YoutubeVideoTranslation {
  code: string;
  title: string;
  description: string;
}

export interface YoutubeVideo {
  id: number;
  video: string;
  title: string;
  description: string;
  translations: YoutubeVideoTranslation[];
  created_at: string;
  updated_at: string;
}

export interface GalleryPayload {
  pictures: Picture[];
  videos: Video[];
  youtube_videos?: YoutubeVideo[];
}

export interface ContactRecord {
  id: number;
  name: string;
  email: string;
  message: string;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriberRecord {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Social {
  id: number;
  name: string;
  url: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerTranslation {
  code: string;
  name: string;
  description: string;
}

export interface Partner {
  id: number;
  image: string;
  url: string;
  name: string;
  description: string;
  translations: PartnerTranslation[];
  created_at: string;
  updated_at: string;
}

export interface HeroSection {
  id: number;
  image: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LogoSection {
  id: number;
  image: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqTranslation {
  code: string;
  question: string;
  answer: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  translations: FaqTranslation[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TranslationRecord {
  id: number;
  language: number;
  language_code: string;
  page: string;
  key: string;
  value: string;
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}
