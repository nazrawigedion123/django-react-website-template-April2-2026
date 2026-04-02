import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

import { AppShell } from "./components/AppShell";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { userQueryOptions } from "./hooks/auth/useUser";
import { queryKeys } from "./lib/queryKeys";
import api from "./services/api";
import { AboutPage } from "./routes/AboutPage";
import { BlogDetailPage } from "./routes/BlogDetailPage";
import { BlogPage } from "./routes/BlogPage";
import { DashboardBlogsPage } from "./routes/DashboardBlogsPage";
import { DashboardContactsPage } from "./routes/DashboardContactsPage";
import { DashboardMediaPage } from "./routes/DashboardMediaPage";
import { DashboardOverviewPage } from "./routes/DashboardOverviewPage";
import { DashboardSettingsPage } from "./routes/DashboardSettingsPage";
import { DashboardUsersPage } from "./routes/DashboardUsersPage";
import { GalleryPage } from "./routes/GalleryPage";
import { GoogleCallbackPage } from "./routes/GoogleCallbackPage";
import { HomePage } from "./routes/HomePage";
import { LoginPage } from "./routes/LoginPage";
import { RegisterPage } from "./routes/RegisterPage";

interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog",
  component: BlogPage,
});

const blogDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog/$blogId",
  component: BlogDetailPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gallery",
  component: GalleryPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: async ({ context }) => {
    if (!api.getTokens()) {
      return;
    }
    try {
      const user = await context.queryClient.ensureQueryData(userQueryOptions(true));
      if (user) {
        throw redirect({ to: "/dashboard" });
      }
    } catch (_error) {
      api.logout();
      context.queryClient.setQueryData(queryKeys.auth.user(), null);
    }
  },
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  beforeLoad: async ({ context }) => {
    if (!api.getTokens()) {
      return;
    }
    try {
      const user = await context.queryClient.ensureQueryData(userQueryOptions(true));
      if (user) {
        throw redirect({ to: "/dashboard" });
      }
    } catch (_error) {
      api.logout();
      context.queryClient.setQueryData(queryKeys.auth.user(), null);
    }
  },
  component: RegisterPage,
});

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/callback",
  component: GoogleCallbackPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: async ({ context, location }) => {
    if (!api.getTokens()) {
      throw redirect({ to: "/login", search: { redirect: location.pathname } });
    }
    const cachedUser = context.queryClient.getQueryData(userQueryOptions(true).queryKey);
    if (cachedUser) {
      return;
    }
    try {
      const user = await context.queryClient.ensureQueryData(userQueryOptions(true));
      if (!user) {
        throw redirect({ to: "/login", search: { redirect: location.pathname } });
      }
    } catch (_error) {
      api.logout();
      context.queryClient.setQueryData(queryKeys.auth.user(), null);
      throw redirect({ to: "/login", search: { redirect: location.pathname } });
    }
  },
  component: DashboardLayout,
});

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/",
  component: DashboardOverviewPage,
});

const dashboardBlogsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/blogs",
  component: DashboardBlogsPage,
});

const dashboardMediaRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/media",
  component: DashboardMediaPage,
});

const dashboardContactsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/contacts",
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(userQueryOptions(true));
    if (!user?.roles?.can_manage_contacts && !user?.roles?.can_manage_subscribers) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: DashboardContactsPage,
});

const dashboardSettingsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/settings",
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(userQueryOptions(true));
    if (!user?.roles?.can_manage_settings) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: DashboardSettingsPage,
});

const dashboardUsersRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/users",
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(userQueryOptions(true));
    if (!user?.roles?.can_manage_users) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: DashboardUsersPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  blogRoute,
  blogDetailRoute,
  galleryRoute,
  aboutRoute,
  loginRoute,
  registerRoute,
  callbackRoute,
  dashboardRoute.addChildren([
    dashboardIndexRoute,
    dashboardBlogsRoute,
    dashboardMediaRoute,
    dashboardContactsRoute,
    dashboardUsersRoute,
    dashboardSettingsRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined as unknown as QueryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
