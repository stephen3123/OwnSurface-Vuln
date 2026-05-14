"use client";

import useSWR, { mutate as globalMutate, type SWRConfiguration } from "swr";
import { api, type DomainVerification, type Notification, type Report, type ScanResult, type UserPlan, type Watchlist, type WatchlistChange } from "@/lib/api-client";
import type { AuthUser } from "@/lib/auth";

export type SearchIndex = {
  scans: ScanResult[];
  domains: DomainVerification[];
  reports: Report[];
  watchlists: Watchlist[];
  notifications: Notification[];
};

export type DashboardHomeData = {
  plan: UserPlan | null;
  recentScans: ScanResult[];
  watchlists: Watchlist[];
  watchlistChanges: Array<WatchlistChange & { watchlist_name: string }>;
  notifications: Notification[];
  reports: Report[];
  domains: DomainVerification[];
};

const DEFAULT_DASHBOARD_SWR: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,
  keepPreviousData: true,
};

const LONG_CACHE_MS = 2 * 60 * 1000;
const STANDARD_CACHE_MS = 60 * 1000;
const SHORT_CACHE_MS = 30 * 1000;
const SEARCH_CACHE_MS = 5 * 60 * 1000;

export const dashboardKeys = {
  session: () => ["dashboard", "session"] as const,
  notifications: () => ["dashboard", "notifications"] as const,
  recentScans: () => ["dashboard", "recent-scans"] as const,
  domains: () => ["dashboard", "domains"] as const,
  watchlists: () => ["dashboard", "watchlists"] as const,
  reports: () => ["dashboard", "reports"] as const,
  plan: () => ["dashboard", "plan"] as const,
  dashboardHome: () => ["dashboard", "home"] as const,
  searchIndex: () => ["dashboard", "search-index"] as const,
  scan: (hash: string) => ["dashboard", "scan", hash] as const,
};

function mapSessionUser(user: { id: string; email: string; name?: string | null }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
  };
}

async function loadSession(): Promise<AuthUser | null> {
  try {
    const response = await api.getSession();
    if (response.error) {
      if (response.errorCode === "unauthorized") {
        return null;
      }
      console.warn("[session] fetch failed:", response.error);
      return null;
    }
    return response.data ? mapSessionUser(response.data) : null;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return null;
    }
    console.warn("[session] unexpected error:", err);
    return null;
  }
}

async function buildDashboardHomeData(): Promise<DashboardHomeData> {
  const [
    planRes,
    recentScansRes,
    watchlistsRes,
    notificationsRes,
    reportsRes,
    domainsRes,
  ] = await Promise.all([
    api.getUserPlan().catch(() => ({ data: null })),
    api.getRecentScans().catch(() => ({ data: [] })),
    api.getWatchlists().catch(() => ({ data: [] })),
    api.getNotifications().catch(() => ({ data: [] })),
    api.getReports().catch(() => ({ data: [] })),
    api.getDomains().catch(() => ({ data: [] })),
  ]);

  const watchlists = watchlistsRes.data || [];
  const watchlistDetailResults = await Promise.all(
    watchlists.slice(0, 4).map(async (watchlist) => {
      const detailRes = await api.getWatchlist(watchlist.id).catch(() => ({ data: null }));
      return { watchlist, detail: detailRes.data };
    }),
  );

  const watchlistChanges = watchlistDetailResults
    .flatMap(({ watchlist, detail }) =>
      (detail?.changes || []).map((change) => ({
        ...change,
        watchlist_name: watchlist.name,
      })),
    )
    .sort((left, right) => new Date(right.detected_at).getTime() - new Date(left.detected_at).getTime())
    .slice(0, 6);

  return {
    plan: planRes.data || null,
    recentScans: recentScansRes.data || [],
    watchlists,
    watchlistChanges,
    notifications: notificationsRes.data || [],
    reports: reportsRes.data || [],
    domains: domainsRes.data || [],
  };
}

async function buildSearchIndex(): Promise<SearchIndex> {
  const results = await Promise.allSettled([
    api.getRecentScans(),
    api.getDomains(),
    api.getReports(),
    api.getWatchlists(),
    api.getNotifications(),
  ]);

  const [
    scansResult,
    domainsResult,
    reportsResult,
    watchlistsResult,
    notificationsResult,
  ] = results;

  return {
    scans: scansResult.status === "fulfilled" ? (scansResult.value.data ?? []) : [],
    domains: domainsResult.status === "fulfilled" ? (domainsResult.value.data ?? []) : [],
    reports: reportsResult.status === "fulfilled" ? (reportsResult.value.data ?? []) : [],
    watchlists: watchlistsResult.status === "fulfilled" ? (watchlistsResult.value.data ?? []) : [],
    notifications: notificationsResult.status === "fulfilled" ? (notificationsResult.value.data ?? []) : [],
  };
}

export function useSession() {
  return useSWR<AuthUser | null>(dashboardKeys.session(), loadSession, {
    ...DEFAULT_DASHBOARD_SWR,
    dedupingInterval: SHORT_CACHE_MS,
    revalidateIfStale: true,
  });
}

export function useNotifications() {
  return useSWR<Notification[]>(
    dashboardKeys.notifications(),
    async () => (await api.getNotifications()).data ?? [],
    {
      ...DEFAULT_DASHBOARD_SWR,
      dedupingInterval: SHORT_CACHE_MS,
      fallbackData: [],
    },
  );
}

export function useUnreadNotificationsCount() {
  const notifications = useNotifications();
  const unreadCount = (notifications.data || []).filter((item) => !item.read).length;

  return {
    ...notifications,
    unreadCount,
  };
}

export function useRecentScans(config?: SWRConfiguration<ScanResult[]>) {
  return useSWR<ScanResult[]>(
    dashboardKeys.recentScans(),
    async () => (await api.getRecentScans()).data ?? [],
    {
      ...DEFAULT_DASHBOARD_SWR,
      dedupingInterval: STANDARD_CACHE_MS,
      fallbackData: [],
      ...config,
    },
  );
}

export function useDomains(config?: SWRConfiguration<DomainVerification[]>) {
  return useSWR<DomainVerification[]>(
    dashboardKeys.domains(),
    async () => (await api.getDomains()).data ?? [],
    {
      ...DEFAULT_DASHBOARD_SWR,
      dedupingInterval: STANDARD_CACHE_MS,
      fallbackData: [],
      ...config,
    },
  );
}

export function useReports() {
  return useSWR<Report[]>(
    dashboardKeys.reports(),
    async () => (await api.getReports()).data ?? [],
    {
      ...DEFAULT_DASHBOARD_SWR,
      dedupingInterval: STANDARD_CACHE_MS,
      fallbackData: [],
    },
  );
}

export function useWatchlists() {
  return useSWR<Watchlist[]>(
    dashboardKeys.watchlists(),
    async () => (await api.getWatchlists()).data ?? [],
    {
      ...DEFAULT_DASHBOARD_SWR,
      dedupingInterval: STANDARD_CACHE_MS,
      fallbackData: [],
    },
  );
}

export function useUserPlan() {
  return useSWR<UserPlan | null>(
    dashboardKeys.plan(),
    async () => (await api.getUserPlan()).data ?? null,
    {
      ...DEFAULT_DASHBOARD_SWR,
      dedupingInterval: LONG_CACHE_MS,
    },
  );
}

export function useDashboardHomeData() {
  return useSWR<DashboardHomeData>(dashboardKeys.dashboardHome(), buildDashboardHomeData, {
    ...DEFAULT_DASHBOARD_SWR,
    dedupingInterval: STANDARD_CACHE_MS,
  });
}

export function useSearchIndex(enabled: boolean) {
  return useSWR<SearchIndex>(enabled ? dashboardKeys.searchIndex() : null, buildSearchIndex, {
    ...DEFAULT_DASHBOARD_SWR,
    dedupingInterval: SEARCH_CACHE_MS,
    revalidateOnFocus: false,
  });
}

export async function mutateSession(user: AuthUser | null) {
  await globalMutate(dashboardKeys.session(), user, { revalidate: false });
}

export async function resetDashboardCache() {
  await globalMutate(() => true, undefined, { revalidate: false });
}

export async function revalidateNotificationCaches() {
  await Promise.all([
    globalMutate(dashboardKeys.notifications()),
    globalMutate(dashboardKeys.searchIndex()),
    globalMutate(dashboardKeys.dashboardHome()),
  ]);
}

export async function revalidateAfterScan(hash?: string) {
  await Promise.all([
    globalMutate(dashboardKeys.recentScans()),
    globalMutate(dashboardKeys.dashboardHome()),
    globalMutate(dashboardKeys.searchIndex()),
    hash ? globalMutate(dashboardKeys.scan(hash)) : Promise.resolve(undefined),
  ]);
}

export async function revalidateWatchlistCaches() {
  await Promise.all([
    globalMutate(dashboardKeys.watchlists()),
    globalMutate(dashboardKeys.dashboardHome()),
    globalMutate(dashboardKeys.searchIndex()),
  ]);
}

export async function revalidateReportCaches() {
  await Promise.all([
    globalMutate(dashboardKeys.reports()),
    globalMutate(dashboardKeys.dashboardHome()),
    globalMutate(dashboardKeys.searchIndex()),
  ]);
}

export async function revalidatePlanCaches() {
  await Promise.all([
    globalMutate(dashboardKeys.plan()),
    globalMutate(dashboardKeys.dashboardHome()),
  ]);
}
