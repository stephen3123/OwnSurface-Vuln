import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CircleAlert,
  Download,
  Eye,
  FileText,
  GitCompareArrows,
  Globe,
  History,
  Home,
  KeyRound,
  Puzzle,
  Radio,
  Scan,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Swords,
  UserSearch,
  Wallet,
} from "lucide-react";

export type DashboardRouteItem = {
  id: string;
  href: string;
  label: string;
  title?: string;
  description?: string;
  icon: LucideIcon;
  keywords?: string[];
  navGroup?: "home" | "sites" | "intelligence" | "workspace";
  quickAction?: boolean;
  searchPage?: boolean;
};

export const DASHBOARD_SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  scan: "Quick Scan",
  new: "Launch",
  security: "Security Scan",
  pentest: "Pentest",
  api: "API Security",
  domains: "Domains",
  monitoring: "Site Health",
  uptime: "Uptime",
  ssl: "SSL",
  speed: "Speed",
  "attack-surface": "Web Security",
  "domain-scan": "Web Security",
  "offensive-scan": "Web Security",
  "api-spec-scan": "Web Security",
  "mobile-scan": "App Security",
  "extension-scan": "Extension Scan",
  watchlist: "Watchlists",
  history: "History",
  leads: "Leads",
  geo: "GEO Intelligence",
  "ai-visibility": "GEO Intelligence",
  visibility: "AI Visibility",
  mentions: "Brand Mentions",
  threads: "Thread Discovery",
  competitors: "Competitors",
  radar: "Radar",
  compare: "Compare",
  bulk: "Exports",
  billing: "Billing",
  settings: "Settings",
  "api-keys": "API",
  team: "Team",
  invite: "Invite",
  webhooks: "Webhooks",
  reports: "Reports",
  collections: "Collections",
  feed: "Feed",
  notifications: "Alerts",
  issues: "Issues",
  compliance: "Compliance",
  profile: "Profile",
  scanning: "Scanning",
  deep: "Deep Scan",
};

export const DASHBOARD_ROUTE_ITEMS: DashboardRouteItem[] = [
  {
    id: "home",
    href: "/dashboard",
    label: "Home",
    title: "Dashboard",
    description: "Open the command center for scans, security workflows, GEO, and live signals.",
    icon: Home,
    keywords: ["home", "dashboard", "overview", "command center", "workspace"],
    navGroup: "home",
    searchPage: true,
  },
  {
    id: "quick-scan",
    href: "/dashboard/scan",
    label: "Quick Scan",
    title: "Quick Scan",
    description: "Start a fresh website intelligence scan for any public URL.",
    icon: Scan,
    keywords: ["scan", "quick scan", "url", "website", "intelligence"],
    navGroup: "home",
    quickAction: true,
    searchPage: true,
  },
  {
    id: "alerts",
    href: "/dashboard/notifications",
    label: "Alerts",
    title: "Alerts",
    description: "Open alerts, follows, comments, and system updates.",
    icon: Bell,
    keywords: ["alerts", "notifications", "inbox", "updates"],
    navGroup: "home",
    searchPage: true,
  },
  {
    id: "domains",
    href: "/dashboard/domains",
    label: "Domains",
    title: "Domains",
    description: "Browse owned sites, verify domains, and launch deeper workflows.",
    icon: Globe,
    keywords: ["domains", "sites", "verified", "owned", "registry"],
    navGroup: "sites",
    quickAction: true,
    searchPage: true,
  },
  {
    id: "site-health",
    href: "/dashboard/monitoring",
    label: "Site Health",
    title: "Site Health",
    description: "Review uptime, SSL, and performance tracking.",
    icon: Activity,
    keywords: ["monitoring", "site health", "uptime", "ssl", "speed"],
    navGroup: "sites",
    searchPage: true,
  },
  {
    id: "issues",
    href: "/dashboard/issues",
    label: "Issues",
    title: "Issues",
    description: "Review prioritized problems across monitored properties.",
    icon: CircleAlert,
    keywords: ["issues", "findings", "problems", "alerts"],
    navGroup: "sites",
  },
  {
    id: "web-security",
    href: "/dashboard/domain-scan",
    label: "Web Security",
    title: "Web Security",
    description: "Launch security scan, pentest, or API security for verified domains.",
    icon: ScanSearch,
    keywords: ["web security", "domain scan", "security", "pentest", "api security", "security probe", "offensive scan", "api spec"],
    navGroup: "sites",
    quickAction: true,
    searchPage: true,
  },
  {
    id: "app-security",
    href: "/dashboard/mobile-scan",
    label: "App Security",
    title: "App Security",
    description: "Launch security scan, pentest, or store checks for APK and IPA files.",
    icon: Smartphone,
    keywords: ["app security", "mobile scan", "app scan", "pentest", "store check", "apk", "ipa"],
    navGroup: "sites",
    quickAction: true,
    searchPage: true,
  },
  {
    id: "extension-scan",
    href: "/dashboard/extension-scan",
    label: "Extension Scan",
    title: "Extension Scan",
    description: "Inspect browser extensions for permissions, risks, and behaviors.",
    icon: Puzzle,
    keywords: ["extension scan", "browser extension", "permissions", "extensions"],
    navGroup: "sites",
  },
  {
    id: "compliance",
    href: "/dashboard/compliance",
    label: "Compliance",
    title: "Compliance",
    description: "Track compliance posture across your monitored portfolio.",
    icon: ShieldCheck,
    keywords: ["compliance", "privacy", "regulations", "gdpr"],
    navGroup: "sites",
  },
  {
    id: "geo",
    href: "/dashboard/geo",
    label: "GEO Intelligence",
    title: "GEO Intelligence",
    description: "Track AI visibility, brand mentions, and thread opportunities from one place.",
    icon: Sparkles,
    keywords: ["geo", "geo intelligence", "ai visibility", "brand mentions", "thread discovery", "llm", "chatgpt", "claude", "gemini"],
    navGroup: "sites",
    quickAction: true,
    searchPage: true,
  },
  {
    id: "watchlists",
    href: "/dashboard/watchlist",
    label: "Watchlists",
    title: "Watchlists",
    description: "Monitor groups of websites for changes.",
    icon: Eye,
    keywords: ["watchlists", "monitor", "alerts", "changes"],
    navGroup: "intelligence",
    quickAction: true,
    searchPage: true,
  },
  {
    id: "competitors",
    href: "/dashboard/competitors",
    label: "Competitors",
    title: "Competitors",
    description: "Track and compare competitor activity and posture.",
    icon: Swords,
    keywords: ["competitors", "benchmarking", "rivals"],
    navGroup: "intelligence",
  },
  {
    id: "radar",
    href: "/dashboard/radar",
    label: "Radar",
    title: "Radar",
    description: "Review trend and signal feeds across technology, security, and community.",
    icon: Radio,
    keywords: ["radar", "signals", "trends", "security alerts", "community"],
    navGroup: "intelligence",
    quickAction: true,
    searchPage: true,
  },
  {
    id: "compare",
    href: "/dashboard/domains/compare",
    label: "Compare",
    title: "Compare",
    description: "Benchmark two sites side by side.",
    icon: GitCompareArrows,
    keywords: ["compare", "benchmark", "domains", "competitors"],
    navGroup: "intelligence",
    quickAction: true,
    searchPage: true,
  },
  {
    id: "leads",
    href: "/dashboard/leads",
    label: "Leads",
    title: "Leads",
    description: "Discover and track lead opportunities from monitored assets.",
    icon: UserSearch,
    keywords: ["leads", "prospects", "pipeline"],
    navGroup: "intelligence",
  },
  {
    id: "history",
    href: "/dashboard/history",
    label: "History",
    title: "History",
    description: "Review timelines and compare recent scan runs.",
    icon: History,
    keywords: ["history", "recent scans", "timeline"],
    navGroup: "workspace",
    searchPage: true,
  },
  {
    id: "exports",
    href: "/dashboard/bulk",
    label: "Exports",
    title: "Exports",
    description: "Run bulk exports for scans and saved results.",
    icon: Download,
    keywords: ["bulk", "export", "csv", "exports"],
    navGroup: "workspace",
    quickAction: true,
  },
  {
    id: "billing",
    href: "/dashboard/billing",
    label: "Billing",
    title: "Billing",
    description: "Check usage, subscriptions, and plan limits.",
    icon: Wallet,
    keywords: ["billing", "plan", "usage", "subscription"],
    navGroup: "workspace",
    searchPage: true,
  },
  {
    id: "settings",
    href: "/dashboard/settings",
    label: "Settings",
    title: "Settings",
    description: "Update profile details and workspace preferences.",
    icon: Settings2,
    keywords: ["settings", "preferences", "profile"],
    navGroup: "workspace",
    searchPage: true,
  },
  {
    id: "api",
    href: "/dashboard/api-keys",
    label: "API",
    title: "API",
    description: "Manage dashboard and integration credentials.",
    icon: KeyRound,
    keywords: ["api", "keys", "credentials", "tokens"],
    navGroup: "workspace",
    searchPage: true,
  },
  {
    id: "reports",
    href: "/dashboard/reports",
    label: "Reports",
    title: "Reports",
    description: "Manage saved reports and shareable links.",
    icon: FileText,
    keywords: ["reports", "saved views", "share"],
    searchPage: true,
  },
];

const NAV_GROUP_ORDER = [
  ["home", "Home"],
  ["sites", "My Sites"],
  ["intelligence", "Intelligence"],
  ["workspace", "Workspace"],
] as const;

export const DASHBOARD_NAV_GROUPS = NAV_GROUP_ORDER.map(([group, label]) => ({
  label,
  items: DASHBOARD_ROUTE_ITEMS.filter((item) => item.navGroup === group),
}));

export const DASHBOARD_QUICK_ACTIONS = DASHBOARD_ROUTE_ITEMS.filter((item) => item.quickAction);
export const DASHBOARD_SEARCH_PAGES = DASHBOARD_ROUTE_ITEMS.filter((item) => item.searchPage);

export function getBreadcrumbLabel(segment: string): string {
  if (DASHBOARD_SEGMENT_LABELS[segment]) return DASHBOARD_SEGMENT_LABELS[segment];
  if (segment.length > 12 && /^[a-f0-9-]+$/i.test(segment)) {
    return `${segment.slice(0, 8)}…`;
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function getDashboardTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (/^\/dashboard\/scan\/[^/]+$/.test(pathname)) return "Scan Result";
  if (/^\/dashboard\/watchlist\/[^/]+$/.test(pathname)) return "Watchlist";
  if (/^\/dashboard\/domains\/[^/]+$/.test(pathname) && pathname !== "/dashboard/domains/compare") {
    return "Domain Profile";
  }
  if (pathname.startsWith("/dashboard/domain-scan")) return "Web Security";
  if (pathname.startsWith("/dashboard/mobile-scan")) return "App Security";
  if (pathname.startsWith("/dashboard/geo")) return "GEO Intelligence";

  const exact = DASHBOARD_ROUTE_ITEMS.find((item) => item.href === pathname);
  if (exact?.title) return exact.title;

  const prefix = [...DASHBOARD_ROUTE_ITEMS]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => pathname.startsWith(item.href) && item.href !== "/dashboard");
  if (prefix?.title) return prefix.title;

  const part = pathname.split("/").filter(Boolean).pop() || "dashboard";
  return part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
}
