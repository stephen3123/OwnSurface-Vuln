"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { revalidateNotificationCaches, useUnreadNotificationsCount } from "@/lib/dashboard-cache";
import { formatRelative } from "@/lib/utils";
import {
 Bell,
 CheckCheck,
 Loader2,
 ShieldAlert,
 TrendingUp,
 Eye,
 AlertTriangle,
 ArrowRight,
} from "lucide-react";

interface NotificationItem {
 id: string;
 title: string;
 body: string | null;
 type: string;
 read: boolean;
 link: string | null;
 created_at: string;
}

function getNotificationIcon(type: string) {
 switch (type) {
 case "security":
 return ShieldAlert;
 case "watchlist":
 return Eye;
 case "monitoring":
 return TrendingUp;
 case "warning":
 return AlertTriangle;
 default:
 return Bell;
 }
}

function getNotificationIconBg(type: string) {
 switch (type) {
 case "security":
 return "bg-red-500/10 text-red-500";
 case "watchlist":
 return "bg-blue-500/10 text-blue-500";
 case "monitoring":
 return "bg-emerald-500/10 text-emerald-500";
 case "warning":
 return "bg-amber-500/10 text-amber-500";
 default:
 return "bg-slate-500/10 text-slate-500";
 }
}

export function NotificationDropdown() {
 const [open, setOpen] = useState(false);
 const [notifications, setNotifications] = useState<NotificationItem[]>([]);
 const [loading, setLoading] = useState(false);
 const [markingAll, setMarkingAll] = useState(false);
 const ref = useRef<HTMLDivElement>(null);
 const { unreadCount } = useUnreadNotificationsCount();

 useEffect(() => {
 function handleClick(e: MouseEvent) {
 if (ref.current && !ref.current.contains(e.target as Node)) {
 setOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClick);
 return () => document.removeEventListener("mousedown", handleClick);
 }, []);

 useEffect(() => {
 if (open) {
 loadNotifications();
 }
 }, [open]);

 async function loadNotifications() {
 setLoading(true);
 const res = await api.request<NotificationItem[]>("/notifications?limit=6");
 if (res.data) {
 setNotifications(res.data);
 }
 setLoading(false);
 }

 async function markAllRead() {
 setMarkingAll(true);
 await api.request("/notifications/read-all", { method: "POST" });
 setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
 await revalidateNotificationCaches();
 setMarkingAll(false);
 }

 async function markOneRead(id: string) {
 await api.markNotificationRead(id);
 setNotifications((prev) =>
 prev.map((n) => (n.id === id ? { ...n, read: true } : n))
 );
 await revalidateNotificationCaches();
 }

 const unreadInList = Array.isArray(notifications) ? notifications.filter((n) => !n.read).length : 0;

 return (
 <div className="relative" ref={ref}>
 <button
 onClick={() => setOpen(!open)}
 className="relative flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-border bg-transparent text-muted-foreground transition-colors hover:text-foreground hover:border-teal-500/25 hover:bg-accent"
 aria-label="Notifications"
 >
 <Bell className="h-4.5 w-4.5" />
 {unreadCount > 0 && (
 <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.6rem] font-bold text-white animate-in zoom-in-50">
 {unreadCount > 99 ? "99+" : unreadCount}
 </span>
 )}
 </button>

 {open && (
 <div className="absolute right-0 top-full z-50 mt-2.5 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border border-border bg-card ">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
 {unreadInList > 0 && (
 <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[0.6rem] font-bold text-white">
 {unreadInList}
 </span>
 )}
 </div>
 {unreadInList > 0 && (
 <button
 onClick={markAllRead}
 disabled={markingAll}
 className="flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors disabled:opacity-50"
 >
 <CheckCheck className="h-3.5 w-3.5" />
 Mark all read
 </button>
 )}
 </div>

 {/* List */}
 <div className="max-h-[22rem] overflow-y-auto">
 {loading ? (
 <div className="flex items-center justify-center py-10">
 <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
 </div>
 ) : notifications.length === 0 ? (
 <div className="px-5 py-10 text-center">
 <Bell className="mx-auto h-8 w-8 text-muted-foreground/30" />
 <p className="mt-3 text-sm text-muted-foreground">No notifications yet</p>
 </div>
 ) : (
 <div className="divide-y divide-border/70">
 {notifications.map((item) => {
 const Icon = getNotificationIcon(item.type);
 const iconBg = getNotificationIconBg(item.type);

 return (
 <Link
 key={item.id}
 href={item.link || "/dashboard/notifications"}
 onClick={() => {
 if (!item.read) markOneRead(item.id);
 setOpen(false);
 }}
 className={`flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-teal-500/5 ${
 !item.read ? "bg-teal-500/[0.03]" : ""
 }`}
 >
 <div
 className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] ${iconBg}`}
 >
 <Icon className="h-4 w-4" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-2">
 <p
 className={`text-sm leading-5 ${
 !item.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"
 }`}
 >
 {item.title}
 </p>
 {!item.read && (
 <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
 )}
 </div>
 {item.body && (
 <p className="mt-0.5 text-xs leading-5 text-muted-foreground line-clamp-2">
 {item.body}
 </p>
 )}
 <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground/70">
 {formatRelative(item.created_at)}
 </p>
 </div>
 </Link>
 );
 })}
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="border-t border-border px-5 py-3">
 <Link
 href="/dashboard/notifications"
 onClick={() => setOpen(false)}
 className="flex items-center justify-center gap-2 text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors"
 >
 View all notifications
 <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </div>
 </div>
 )}
 </div>
 );
}
