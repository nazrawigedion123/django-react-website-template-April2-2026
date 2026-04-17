import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://localhost:8000/v1",
    NEXT_PUBLIC_API_TRANSPORT:
      process.env.NEXT_PUBLIC_API_TRANSPORT ?? process.env.VITE_API_TRANSPORT ?? "json",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
      process.env.VITE_GOOGLE_CLIENT_ID ??
      process.env.VITE_SOCIAL_AUTH_GOOGLE_CLIENT_ID ??
      "",
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ??
      process.env.VITE_GOOGLE_REDIRECT_URI ??
      process.env.VITE_GOOGLE_REDIRECT_URL ??
      "http://localhost:3000/callback",
  },
};

export default nextConfig;
