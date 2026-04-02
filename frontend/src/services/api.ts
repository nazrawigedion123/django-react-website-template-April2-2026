import axios, { AxiosError, type AxiosRequestConfig } from "axios";

import type {
  AuthResponse,
  AuthTokens,
  Blog,
  BlogCommentItem,
  BlogCommentResponse,
  BlogReactionResponse,
  ContactRecord,
  Faq,
  GalleryPayload,
  HeroSection,
  LanguageOption,
  LogoSection,
  Partner,
  RegisterResponse,
  Social,
  SubscriberRecord,
  TranslationRecord,
  User,
  YoutubeVideo,
} from "../types";
import {
  decodeApiResponseBody,
  encodeProtobufEnvelope,
  PROTOBUF_ALT_CONTENT_TYPE,
  PROTOBUF_CONTENT_TYPE,
} from "../utils/protobufEnvelope";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKENS_KEY = "auth_tokens";
const LANG_KEY = "ui_lang";
const API_TRANSPORT = (import.meta.env.VITE_API_TRANSPORT || (import.meta.env.DEV ? "json" : "protobuf")).toLowerCase();
const USE_PROTOBUF_BY_DEFAULT = API_TRANSPORT === "protobuf";
const ACCEPT_HEADER = USE_PROTOBUF_BY_DEFAULT
  ? `${PROTOBUF_CONTENT_TYPE}, ${PROTOBUF_ALT_CONTENT_TYPE};q=0.95, application/json;q=0.9`
  : `application/json, ${PROTOBUF_CONTENT_TYPE};q=0.95, ${PROTOBUF_ALT_CONTENT_TYPE};q=0.9`;
const RAW_RESPONSE_CONFIG = {
  responseType: "arraybuffer" as const,
  transformResponse: [(data: unknown) => data],
};

class ApiService {
  private tokens: AuthTokens | null = null;
  private language: string = "en";
  private refreshInProgress: Promise<string | null> | null = null;
  private client = axios.create({
    baseURL: API_BASE_URL,
    ...RAW_RESPONSE_CONFIG,
  });

  constructor() {
    const storedTokens = localStorage.getItem(TOKENS_KEY);
    if (storedTokens) {
      try {
        this.tokens = JSON.parse(storedTokens) as AuthTokens;
      } catch (_error) {
        this.tokens = null;
      }
    }

    const storedLang = localStorage.getItem(LANG_KEY);
    if (storedLang) {
      this.language = storedLang;
    }

    this.client.interceptors.request.use((config) => {
      const headers = config.headers ?? {};

      headers.Accept = headers.Accept ?? ACCEPT_HEADER;
      headers["X-Language"] = this.language;

      if (this.tokens?.access) {
        headers.Authorization = `Bearer ${this.tokens.access}`;
      }

      if (!(config.data instanceof FormData) && config.data !== undefined) {
        const isBinaryPayload = config.data instanceof ArrayBuffer || config.data instanceof Uint8Array;

        if (USE_PROTOBUF_BY_DEFAULT && !isBinaryPayload) {
          config.data = encodeProtobufEnvelope(config.data);
          headers["Content-Type"] = PROTOBUF_CONTENT_TYPE;
        } else if (!isBinaryPayload) {
          headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
        }
      }

      config.headers = headers;
      config.responseType = "arraybuffer";
      config.transformResponse = RAW_RESPONSE_CONFIG.transformResponse;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        response.data = decodeApiResponseBody(response.data, response.headers["content-type"]);
        return response;
      },
      async (error: AxiosError) => {
        if (error.response) {
          error.response.data = decodeApiResponseBody(error.response.data, error.response.headers?.["content-type"]) as never;
        }

        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
          throw error;
        }

        const refreshed = await this.refreshToken();
        if (!refreshed) {
          throw error;
        }

        originalRequest._retry = true;
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${refreshed}`,
          "X-Language": this.language,
        };

        return this.client.request(originalRequest);
      },
    );
  }

  setTokens(tokens: AuthTokens | null) {
    this.tokens = tokens;
    if (tokens) {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    } else {
      localStorage.removeItem(TOKENS_KEY);
    }
  }

  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  setLanguage(lang: string) {
    this.language = lang;
    localStorage.setItem(LANG_KEY, lang);
  }

  getLanguage(): string {
    return this.language;
  }

  private async decodeRawResponse<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await axios.request({
      baseURL: API_BASE_URL,
      ...RAW_RESPONSE_CONFIG,
      ...config,
    });

    return decodeApiResponseBody(response.data, response.headers["content-type"]) as T;
  }

  private async refreshToken(): Promise<string | null> {
    if (this.refreshInProgress) {
      return this.refreshInProgress;
    }
    if (!this.tokens?.refresh) {
      return null;
    }

    this.refreshInProgress = (async () => {
      try {
        const headers: Record<string, string> = {
          Accept: ACCEPT_HEADER,
        };
        const payload = USE_PROTOBUF_BY_DEFAULT
          ? encodeProtobufEnvelope({ refresh: this.tokens?.refresh })
          : { refresh: this.tokens?.refresh };

        if (USE_PROTOBUF_BY_DEFAULT) {
          headers["Content-Type"] = PROTOBUF_CONTENT_TYPE;
        } else {
          headers["Content-Type"] = "application/json";
        }

        const data = await this.decodeRawResponse<{ access: string }>({
          method: "post",
          url: "/token/refresh/",
          data: payload,
          headers,
        });

        const access = data.access;
        this.setTokens({ ...this.tokens!, access });
        return access;
      } catch (_error) {
        this.setTokens(null);
        return null;
      } finally {
        this.refreshInProgress = null;
      }
    })();

    return this.refreshInProgress;
  }

  async login(credentials: Record<string, unknown>): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>("/login/", credentials);
    this.setTokens({ access: data.access, refresh: data.refresh });
    return data;
  }

  async register(userData: Record<string, unknown>): Promise<RegisterResponse> {
    const { data } = await this.client.post<RegisterResponse>("/users/", userData);
    if (data.access && data.refresh) {
      this.setTokens({ access: data.access, refresh: data.refresh });
    }
    return data;
  }

  async googleLogin(code: string, codeVerifier: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>("/google/login/", {
      code,
      code_verifier: codeVerifier,
    });
    this.setTokens({ access: data.access, refresh: data.refresh });
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>("/users/me/");
    if (data.language) {
      this.setLanguage(data.language);
    }
    return data;
  }

  async getBlogs(lang: string): Promise<Blog[]> {
    const { data } = await this.client.get<Blog[]>("/blogs/", { params: { lang } });
    return data;
  }

  async getBlog(id: number, lang: string): Promise<Blog> {
    const { data } = await this.client.get<Blog>(`/blogs/${id}/`, { params: { lang } });
    return data;
  }

  async addBlogComment(id: number, payload: { content: string; reply_to?: number }): Promise<BlogCommentResponse> {
    const { data } = await this.client.post<BlogCommentResponse>(`/blogs/${id}/comments/`, payload);
    return data;
  }

  async getBlogComments(id: number): Promise<BlogCommentItem[]> {
    const { data } = await this.client.get<BlogCommentItem[]>(`/blogs/${id}/comments/`);
    return data;
  }

  async reactToBlog(id: number, reactionType: string): Promise<BlogReactionResponse> {
    const { data } = await this.client.post<BlogReactionResponse>(`/blogs/${id}/reactions/`, { reaction_type: reactionType });
    return data;
  }

  async getDashboardBlogs(lang: string): Promise<Blog[]> {
    const { data } = await this.client.get<Blog[]>("/dashboard/blogs/", { params: { lang } });
    return data;
  }

  async createBlog(payload: FormData): Promise<Blog> {
    const { data } = await this.client.post<Blog>("/dashboard/blogs/", payload);
    return data;
  }

  async updateBlog(id: number, payload: FormData): Promise<Blog> {
    const { data } = await this.client.put<Blog>(`/dashboard/${id}/blogs/`, payload);
    return data;
  }

  async deleteBlog(id: number): Promise<void> {
    await this.client.delete(`/dashboard/${id}/blogs/`);
  }

  async publishBlog(id: number): Promise<Blog> {
    const { data } = await this.client.post<Blog>(`/dashboard/${id}/blogs/publish/`);
    return data;
  }

  async getGallery(lang: string): Promise<GalleryPayload> {
    const [picturesRes, videosRes, youtubeRes] = await Promise.all([
      this.client.get<GalleryPayload["pictures"]>("/gallery/", { params: { lang } }),
      this.client.get<GalleryPayload["videos"]>("/gallery/videos/", { params: { lang } }),
      this.client.get<GalleryPayload["youtube_videos"]>("/gallery/youtube/", { params: { lang } }),
    ]);

    return {
      pictures: picturesRes.data,
      videos: videosRes.data,
      youtube_videos: youtubeRes.data ?? [],
    };
  }

  async getDashboardMedia(lang: string): Promise<GalleryPayload> {
    const { data } = await this.client.get<GalleryPayload>("/dashboard/media/", {
      params: { lang },
    });
    return data;
  }

  async uploadPicture(payload: FormData) {
    const { data } = await this.client.post("/dashboard/media/pictures/", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  async updatePicture(id: number, payload: FormData) {
    const { data } = await this.client.put(`/dashboard/${id}/media/pictures/`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  async deletePicture(id: number): Promise<void> {
    await this.client.delete(`/dashboard/${id}/media/pictures/`);
  }

  async uploadVideo(payload: FormData) {
    const { data } = await this.client.post("/dashboard/media/videos/", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  async updateVideo(id: number, payload: FormData) {
    const { data } = await this.client.put(`/dashboard/${id}/media/videos/`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  async deleteVideo(id: number): Promise<void> {
    await this.client.delete(`/dashboard/${id}/media/videos/`);
  }

  async uploadYoutube(payload: { video: string; translations: string }): Promise<YoutubeVideo> {
    const { data } = await this.client.post<YoutubeVideo>("/dashboard/media/youtube/", payload);
    return data;
  }

  async updateYoutube(id: number, payload: { video: string; translations: string }): Promise<YoutubeVideo> {
    const { data } = await this.client.put<YoutubeVideo>(`/dashboard/${id}/media/youtube/`, payload);
    return data;
  }

  async deleteYoutube(id: number): Promise<void> {
    await this.client.delete(`/dashboard/${id}/media/youtube/`);
  }

  async createContact(payload: { name: string; email: string; message: string }): Promise<ContactRecord> {
    const { data } = await this.client.post<ContactRecord>("/contacts/", payload);
    return data;
  }

  async createSubscriber(payload: { email: string }): Promise<SubscriberRecord> {
    const { data } = await this.client.post<SubscriberRecord>("/subscribers/", payload);
    return data;
  }

  async getDashboardContacts(): Promise<ContactRecord[]> {
    const { data } = await this.client.get<ContactRecord[]>("/contacts/");
    return data;
  }

  async getDashboardSubscribers(): Promise<SubscriberRecord[]> {
    const { data } = await this.client.get<SubscriberRecord[]>("/subscribers/");
    return data;
  }

  async getFrontendTranslations(lang: string): Promise<TranslationRecord[]> {
    const { data } = await this.client.get<TranslationRecord[]>("/translations/", {
      params: { lang },
    });
    return data;
  }

  async getLanguages(): Promise<LanguageOption[]> {
    const { data } = await this.client.get<LanguageOption[]>("/languages/");
    return data;
  }

  async getDashboardUsers(): Promise<User[]> {
    const { data } = await this.client.get<User[]>("/dashboard/users/");
    return data;
  }

  async updateDashboardUserRole(id: number, payload: Partial<User["roles"]>): Promise<User> {
    const { data } = await this.client.put<User>(`/dashboard/${id}/users/`, { roles: payload });
    return data;
  }

  async getSocials(): Promise<Social[]> {
    const { data } = await this.client.get<Social[]>("/socials/");
    return data;
  }

  async createSocial(payload: { name: string; url: string; icon: string }): Promise<Social> {
    const { data } = await this.client.post<Social>("/socials/", payload);
    return data;
  }

  async updateSocial(id: number, payload: { name: string; url: string; icon: string }): Promise<Social> {
    const { data } = await this.client.put<Social>(`/socials/${id}/`, payload);
    return data;
  }

  async deleteSocial(id: number): Promise<void> {
    await this.client.delete(`/socials/${id}/`);
  }

  async getPartners(lang: string): Promise<Partner[]> {
    const { data } = await this.client.get<Partner[]>("/partners/", { params: { lang } });
    return data;
  }

  async createPartner(payload: FormData): Promise<Partner> {
    const { data } = await this.client.post<Partner>("/partners/", payload);
    return data;
  }

  async updatePartner(id: number, payload: FormData): Promise<Partner> {
    const { data } = await this.client.put<Partner>(`/partners/${id}/`, payload);
    return data;
  }

  async deletePartner(id: number): Promise<void> {
    await this.client.delete(`/partners/${id}/`);
  }

  async getHeroSection(): Promise<HeroSection[]> {
    const { data } = await this.client.get<HeroSection[]>("/hero-section/");
    return data;
  }

  async createHeroSection(payload: FormData): Promise<HeroSection> {
    const { data } = await this.client.post<HeroSection>("/hero-section/", payload);
    return data;
  }

  async updateHeroSection(id: number, payload: FormData): Promise<HeroSection> {
    const { data } = await this.client.put<HeroSection>(`/hero-section/${id}/`, payload);
    return data;
  }

  async getLogoSection(): Promise<LogoSection[]> {
    const { data } = await this.client.get<LogoSection[]>("/logo-section/");
    return data;
  }

  async createLogoSection(payload: FormData): Promise<LogoSection> {
    const { data } = await this.client.post<LogoSection>("/logo-section/", payload);
    return data;
  }

  async updateLogoSection(id: number, payload: FormData): Promise<LogoSection> {
    const { data } = await this.client.put<LogoSection>(`/logo-section/${id}/`, payload);
    return data;
  }

  async getFaqs(lang: string): Promise<Faq[]> {
    const { data } = await this.client.get<Faq[]>("/faqs/", { params: { lang } });
    return data;
  }

  async createFaq(payload: { active: boolean; translations: string }): Promise<Faq> {
    const { data } = await this.client.post<Faq>("/faqs/", payload);
    return data;
  }

  async updateFaq(id: number, payload: { active: boolean; translations: string }): Promise<Faq> {
    const { data } = await this.client.put<Faq>(`/faqs/${id}/`, payload);
    return data;
  }

  async deleteFaq(id: number): Promise<void> {
    await this.client.delete(`/faqs/${id}/`);
  }

  logout() {
    this.setTokens(null);
  }
}

export const api = new ApiService();
export default api;
