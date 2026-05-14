"use client";

import {
 Activity,
 Bell,
 Bolt,
 FileText,
 Globe,
 Loader2,
 LucideIcon,
 Radar,
 Scan,
 Search,
 X,
} from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
 api,
 type DomainVerification,
 type Notification,
 type Report,
 type ScanResult,
 type Watchlist,
} from "@/lib/api-client";
import { revalidateNotificationCaches, type SearchIndex, useSearchIndex } from "@/lib/dashboard-cache";
import { DASHBOARD_SEARCH_PAGES } from "@/lib/dashboard-route-metadata";
import { cn, formatRelative, getSecurityGrade, truncateUrl } from "@/lib/utils";

type SearchItemKind =
 | "action"
 | "page"
 | "domain"
 | "scan"
 | "report"
 | "watchlist"
 | "notification";

type SearchItem = {
 id: string;
 kind: SearchItemKind;
 title: string;
 subtitle: string;
 href: string;
 icon: LucideIcon;
 label: string;
 keywords: string[];
 badge?: string;
 priority?: number;
 notificationId?: string;
};

type SearchGroup = {
 key: string;
 label: string;
 items: SearchItem[];
};

const PAGE_ITEMS: SearchItem[] = DASHBOARD_SEARCH_PAGES.map((page, index) => ({
 id: `page-${page.id}`,
 kind: "page",
 title: page.label === "Home" ? "Dashboard home" : page.title || page.label,
 subtitle: page.description || "Open this dashboard section.",
 href: page.href,
 icon: page.icon,
 label: "Page",
 keywords: page.keywords || [],
 priority: 120 - index * 3,
}));

function normalizeSearchValue(value: string) {
 return value.trim().toLowerCase();
}

function tokenizeSearchValue(value: string) {
 return normalizeSearchValue(value).split(/\s+/).filter(Boolean);
}

function looksLikeUrlQuery(value: string) {
 const trimmed = value.trim();
 if (!trimmed || /\s/.test(trimmed)) return false;
 if (/^https?:\/\//i.test(trimmed)) return true;
 return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(trimmed);
}

function normalizeUrlQuery(value: string) {
 const trimmed = value.trim();
 if (!trimmed) return "";

 try {
 const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
 return parsed.toString();
 } catch {
 return "";
 }
}

function scoreSearchItem(item: SearchItem, query: string) {
 const normalizedQuery = normalizeSearchValue(query);
 if (!normalizedQuery) return item.priority ?? 0;

 const tokens = tokenizeSearchValue(normalizedQuery);
 const title = normalizeSearchValue(item.title);
 const subtitle = normalizeSearchValue(item.subtitle);
 const keywords = item.keywords.map((keyword) => normalizeSearchValue(keyword));
 const haystack = [title, subtitle, ...keywords].join(" ");

 let score = item.priority ?? 0;

 if (title === normalizedQuery) score += 220;
 if (title.startsWith(normalizedQuery)) score += 160;
 if (haystack.includes(normalizedQuery)) score += 90;

 for (const token of tokens) {
 if (title.includes(token)) {
 score += 42;
 continue;
 }

 if (subtitle.includes(token)) {
 score += 22;
 continue;
 }

 if (keywords.some((keyword) => keyword.includes(token))) {
 score += 18;
 continue;
 }

 return -1;
 }

 return score;
}

function sortAndLimit(items: SearchItem[], query: string, limit: number) {
 const deduped = dedupeSearchItems(items);

 return deduped
 .map((item) => ({ item, score: scoreSearchItem(item, query) }))
 .filter((entry) => entry.score >= 0)
 .sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title))
 .slice(0, limit)
 .map((entry) => entry.item);
}

function dedupeSearchItems(items: SearchItem[]) {
 const seen = new Set<string>();
 const uniqueItems: SearchItem[] = [];

 for (const item of items) {
 const key = `${item.kind}:${item.id}`;
 if (seen.has(key)) continue;
 seen.add(key);
 uniqueItems.push(item);
 }

 return uniqueItems;
}

function getItemAccentClasses(kind: SearchItemKind) {
 switch (kind) {
 case "action":
 return "bg-teal-500/12 text-teal-700";
 case "page":
 return "bg-slate-900/6 text-slate-700";
 case "domain":
 return "bg-cyan-500/12 text-cyan-700";
 case "scan":
 return "bg-emerald-500/12 text-emerald-700";
 case "report":
 return "bg-amber-500/12 text-amber-700";
 case "watchlist":
 return "bg-rose-500/12 text-rose-700";
 case "notification":
 return "bg-orange-500/12 text-orange-700";
 default:
 return "bg-slate-900/6 text-slate-700";
 }
}

function buildScanAction(query: string) {
 const normalizedUrl = normalizeUrlQuery(query);
 if (!normalizedUrl) return null;

 return {
 id: `action-scan-${normalizedUrl}`,
 kind: "action" as const,
 title: `Scan ${truncateUrl(normalizedUrl, 42)}`,
 subtitle: "Launch a new scan directly from search.",
 href: `/dashboard/scan?url=${encodeURIComponent(normalizedUrl)}`,
 icon: Bolt,
 label: "Action",
 keywords: ["scan", "website", "analyze", normalizedUrl],
 priority: 240,
 };
}

function buildSearchItems(index: SearchIndex, query: string) {
 const dynamicScanAction = looksLikeUrlQuery(query) ? buildScanAction(query) : null;

 const scanItems = dedupeSearchItems(index.scans.map((scan) => ({
 id: `scan-${scan.hash}`,
 kind: "scan" as const,
 title: truncateUrl(scan.url, 68),
 subtitle: `${getSecurityGrade(scan.security.score)} security, ${scan.technologies.length} technologies, ${formatRelative(scan.scanned_at)}`,
 href: `/dashboard/scan/${scan.hash}`,
 icon: Scan,
 label: "Scan",
 keywords: [
 scan.url,
 scan.company?.name || "",
 scan.technologies.map((tech) => tech.name).join(" "),
 scan.social_links.map((social) => social.platform).join(" "),
 ],
 badge: getSecurityGrade(scan.security.score),
 priority: 92,
 })));

 const domainItems = dedupeSearchItems(index.domains.map((domain) => ({
 id: `domain-${domain.id}`,
 kind: "domain" as const,
 title: domain.domain,
 subtitle: domain.verified
 ? `Verified domain, ${formatRelative(domain.verified_at || domain.created_at)}`
 : `Pending verification, added ${formatRelative(domain.created_at)}`,
 href: `/dashboard/domains/${domain.id}`,
 icon: Globe,
 label: "Domain",
 keywords: [domain.domain, domain.verification_method, domain.verified ? "verified" : "pending"],
 badge: domain.verified ? "Verified" : "Pending",
 priority: domain.verified ? 95 : 82,
 })));

 const reportItems = dedupeSearchItems(index.reports.map((report) => ({
 id: `report-${report.id}`,
 kind: "report" as const,
 title: truncateUrl(report.url, 68),
 subtitle: `${report.is_public ? "Public" : "Private"} report, created ${formatRelative(report.created_at)}`,
 href: report.is_public ? `/report/${report.slug}` : `/dashboard/scan/${report.scan_hash}`,
 icon: FileText,
 label: "Report",
 keywords: [report.url, report.slug, report.is_public ? "public" : "private"],
 badge: report.is_public ? "Public" : "Private",
 priority: 84,
 })));

 const watchlistItems = dedupeSearchItems(index.watchlists.map((watchlist) => ({
 id: `watchlist-${watchlist.id}`,
 kind: "watchlist" as const,
 title: watchlist.name,
 subtitle: `${watchlist.urls.length} URLs, ${watchlist.frequency} checks`,
 href: `/dashboard/watchlist/${watchlist.id}`,
 icon: Radar,
 label: "Watchlist",
 keywords: [watchlist.name, watchlist.description, watchlist.frequency, watchlist.urls.join(" ")],
 badge: watchlist.frequency,
 priority: 86,
 })));

 const notificationItems = dedupeSearchItems(index.notifications.map((notification) => ({
 id: `notification-${notification.id}`,
 kind: "notification" as const,
 title: notification.title,
 subtitle: notification.body || `${notification.type} notification from ${formatRelative(notification.created_at)}`,
 href: notification.link || "/dashboard/notifications",
 icon: Bell,
 label: "Notification",
 keywords: [
 notification.title,
 notification.body,
 notification.type,
 notification.actor?.username || "",
 notification.actor?.name || "",
 ],
 badge: notification.read ? "Read" : "Unread",
 priority: notification.read ? 60 : 88,
 notificationId: notification.id,
 })));

 return {
 quickActions: dynamicScanAction ? [dynamicScanAction] : [],
 pages: PAGE_ITEMS,
 domains: domainItems,
 scans: scanItems,
 reports: reportItems,
 watchlists: watchlistItems,
 notifications: notificationItems,
 };
}

export function GlobalSearchPanel() {
 const router = useRouter();
 const pathname = usePathname();
 const containerRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
 const [open, setOpen] = useState(false);
 const [query, setQuery] = useState("");
 const [shortcutLabel, setShortcutLabel] = useState("Ctrl");
 const [activeIndex, setActiveIndex] = useState(-1);
 const deferredQuery = useDeferredValue(query);
 const { data: indexData, isLoading, error } = useSearchIndex(open);
 const index: SearchIndex = indexData || {
 scans: [],
 domains: [],
 reports: [],
 watchlists: [],
 notifications: [],
 };
 const loadIssue = error ? "Some live results are temporarily unavailable." : "";

 useEffect(() => {
 if (typeof navigator === "undefined") return;
 const platform = navigator.platform.toLowerCase();
 if (platform.includes("mac")) {
 setShortcutLabel("Cmd");
 }
 }, []);

 useEffect(() => {
 setOpen(false);
 setQuery("");
 setActiveIndex(-1);
 }, [pathname]);

 useEffect(() => {
 function handleGlobalKeydown(event: KeyboardEvent) {
 if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
 event.preventDefault();
 setOpen(true);
 requestAnimationFrame(() => inputRef.current?.focus());
 return;
 }

 if (!open) return;

 if (event.key === "Escape") {
 setOpen(false);
 inputRef.current?.blur();
 }
 }

 window.addEventListener("keydown", handleGlobalKeydown);
 return () => window.removeEventListener("keydown", handleGlobalKeydown);
 }, [open]);

 useEffect(() => {
 function handlePointerDown(event: MouseEvent) {
 if (!containerRef.current?.contains(event.target as Node)) {
 setOpen(false);
 }
 }

 document.addEventListener("mousedown", handlePointerDown);
 return () => document.removeEventListener("mousedown", handlePointerDown);
 }, []);

 const builtItems = buildSearchItems(index, deferredQuery);
 const normalizedQuery = normalizeSearchValue(deferredQuery);
 const isSearching = normalizedQuery.length > 0;

 const groups: SearchGroup[] = isSearching
 ? [
 { key: "quick-actions", label: "Quick actions", items: sortAndLimit(builtItems.quickActions, deferredQuery, 2) },
 { key: "pages", label: "Pages", items: sortAndLimit(builtItems.pages, deferredQuery, 6) },
 { key: "domains", label: "Domains", items: sortAndLimit(builtItems.domains, deferredQuery, 6) },
 { key: "scans", label: "Scans", items: sortAndLimit(builtItems.scans, deferredQuery, 6) },
 { key: "reports", label: "Reports", items: sortAndLimit(builtItems.reports, deferredQuery, 5) },
 { key: "watchlists", label: "Watchlists", items: sortAndLimit(builtItems.watchlists, deferredQuery, 5) },
 { key: "notifications", label: "Notifications", items: sortAndLimit(builtItems.notifications, deferredQuery, 4) },
 ].filter((group) => group.items.length > 0)
 : [
 { key: "quick-actions", label: "Suggested", items: builtItems.pages.slice(0, 6) },
 { key: "scans", label: "Recent scans", items: builtItems.scans.slice(0, 5) },
 { key: "domains", label: "Verified domains", items: builtItems.domains.slice(0, 5) },
 {
 key: "notifications",
 label: "Unread notifications",
 items: builtItems.notifications.filter((item) => item.badge === "Unread").slice(0, 4),
 },
 ].filter((group) => group.items.length > 0);

 const flatItems = groups.flatMap((group) => group.items);
 const flatItemKeys = flatItems.map((item) => `${item.kind}:${item.id}`);

 useEffect(() => {
 if (!open) {
 setActiveIndex(-1);
 return;
 }

 setActiveIndex(flatItems.length > 0 ? 0 : -1);
 }, [deferredQuery, flatItems.length, open]);

 useEffect(() => {
 if (activeIndex < 0) return;
 itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
 }, [activeIndex]);

 function closeAndReset() {
 setOpen(false);
 setQuery("");
 setActiveIndex(-1);
 }

 function navigateToItem(item: SearchItem) {
 if (item.notificationId) {
 void api.markNotificationRead(item.notificationId);
 void revalidateNotificationCaches();
 }

 closeAndReset();

 if (/^https?:\/\//i.test(item.href) && typeof window !== "undefined") {
 window.location.assign(item.href);
 return;
 }

 router.push(item.href);
 }

 function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
 if (event.key === "ArrowDown" && flatItems.length > 0) {
 event.preventDefault();
 setOpen(true);
 setActiveIndex((current) => (current + 1) % flatItems.length);
 return;
 }

 if (event.key === "ArrowUp" && flatItems.length > 0) {
 event.preventDefault();
 setOpen(true);
 setActiveIndex((current) => (current <= 0 ? flatItems.length - 1 : current - 1));
 return;
 }

 if (event.key === "Enter") {
 const item = flatItems[activeIndex] ?? flatItems[0];
 if (item) {
 event.preventDefault();
 navigateToItem(item);
 }
 return;
 }

 if (event.key === "Escape") {
 event.preventDefault();
 setOpen(false);
 inputRef.current?.blur();
 }
 }

 itemRefs.current = [];

 return (
 <div
 ref={containerRef}
 className="relative"
 >
 <div
 className={cn(
 "group flex h-10 items-center rounded-[0.95rem] border bg-background transition-all",
 open ? "border-teal-500/30 ring-4 ring-teal-500/10" : "border-border hover:border-teal-500/25",
 "w-10 sm:w-[18rem] md:w-[22rem] lg:w-[29rem]"
 )}
 >
 <button
 type="button"
 onClick={() => {
 setOpen(true);
 inputRef.current?.focus();
 }}
 className="flex h-full w-10 items-center justify-center text-muted-foreground"
 aria-label="Open global search"
 >
 <Search className="h-4.5 w-4.5" />
 </button>

 <input
 ref={inputRef}
 type="text"
 value={query}
 onFocus={() => setOpen(true)}
 onChange={(event) => {
 setQuery(event.target.value);
 if (!open) setOpen(true);
 }}
 onKeyDown={handleInputKeyDown}
 placeholder="Search everything..."
 className="hidden h-full min-w-0 flex-1 bg-transparent pr-2 text-sm text-foreground outline-none placeholder:text-muted-foreground sm:block"
 aria-label="Search everything"
 />

 <div className="hidden items-center gap-1 pr-2 lg:flex">
 <span className="rounded-md border border-border bg-accent px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
 {shortcutLabel}
 </span>
 <span className="rounded-md border border-border bg-accent px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
 K
 </span>
 </div>

 {query && (
 <button
 type="button"
 onClick={() => {
 setQuery("");
 inputRef.current?.focus();
 }}
 className="hidden h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground sm:flex"
 aria-label="Clear search"
 >
 <X className="h-4 w-4" />
 </button>
 )}
 </div>

 {open && (
 <div className="absolute right-0 top-[calc(100%+0.7rem)] z-50 w-[min(94vw,42rem)] overflow-hidden rounded-xl border border-border bg-card sm:left-0 sm:right-auto sm:w-[32rem] md:w-[38rem] lg:w-[44rem]">
 <div className="border-b border-border px-3 py-3 sm:hidden">
 <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3">
 <Search className="h-4.5 w-4.5 text-muted-foreground" />
 <input
 type="text"
 value={query}
 onChange={(event) => setQuery(event.target.value)}
 onKeyDown={handleInputKeyDown}
 placeholder="Search everything..."
 className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
 autoFocus
 />
 </div>
 </div>

 <div className="border-b border-border px-4 py-3">
 <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
 <span className="rounded-full border border-border bg-accent px-2.5 py-1">Enter to open</span>
 <span className="rounded-full border border-border bg-accent px-2.5 py-1">Arrow keys to move</span>
 <span className="rounded-full border border-border bg-accent px-2.5 py-1">{shortcutLabel} + K</span>
 {loadIssue && (
 <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-400">
 {loadIssue}
 </span>
 )}
 </div>
 </div>

 <div className="max-h-[min(70vh,40rem)] overflow-y-auto px-3 py-3 sm:px-4">
 {isLoading && (
 <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm text-muted-foreground">
 <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
 Indexing your latest dashboard activity
 </div>
 )}

 {groups.length === 0 ? (
 <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/50 px-6 text-center">
 <Search className="h-9 w-9 text-muted-foreground" />
 <p className="mt-4 text-base font-semibold text-foreground">No matching results</p>
 <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
 Try a domain, page name, scan URL, report slug, collection title, or watchlist keyword.
 </p>
 </div>
 ) : (
 <div className="space-y-4 pb-1">
 {groups.map((group) => (
 <div key={group.key}>
 <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
 {group.label}
 </div>
 <div className="space-y-1.5">
 {group.items.map((item) => {
 const itemKey = `${item.kind}:${item.id}`;
 const flatIndex = flatItemKeys.indexOf(itemKey);
 const isActive = flatIndex === activeIndex;
 const Icon = item.icon;

 return (
 <button
 key={`${group.key}:${itemKey}`}
 ref={(node) => {
 itemRefs.current[flatIndex] = node;
 }}
 type="button"
 onClick={() => navigateToItem(item)}
 onMouseEnter={() => setActiveIndex(flatIndex)}
 className={cn(
 "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all sm:px-4",
 isActive
 ? "border-teal-500/25 bg-teal-500/8"
 : "border-transparent bg-transparent hover:border-border hover:bg-accent"
 )}
 >
 <div
 className={cn(
 "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
 getItemAccentClasses(item.kind)
 )}
 >
 <Icon className="h-5 w-5" />
 </div>

 <div className="min-w-0 flex-1 py-0.5">
 <div className="flex items-center gap-2">
 <span className="truncate font-medium text-foreground">{item.title}</span>
 {item.badge && (
 <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground">
 {item.badge}
 </span>
 )}
 </div>
 <div className="mt-0.5 truncate text-[13px] text-muted-foreground">{item.subtitle}</div>
 </div>

 <div className="shrink-0 pt-1">
 <span className="rounded-lg border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
 {item.label}
 </span>
 </div>
 </button>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
