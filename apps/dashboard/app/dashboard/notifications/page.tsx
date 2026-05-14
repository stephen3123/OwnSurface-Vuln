"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, type Notification } from "@/lib/api-client";
import { formatRelative, cn } from "@/lib/utils";
import {
 Bell,
 Heart,
 MessageSquare,
 UserPlus,
 Award,
 Info,
 Loader2,
 CheckCheck,
 Check,
} from "lucide-react";
import { toast } from "sonner";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
 like: Heart,
 comment: MessageSquare,
 follow: UserPlus,
 badge: Award,
 system: Info,
};

const typeColors: Record<string, string> = {
 like: "bg-red-500/10 text-red-500",
 comment: "bg-blue-500/10 text-blue-500",
 follow: "bg-teal-500/10 text-teal-700",
 badge: "bg-yellow-500/10 text-yellow-600",
 system: "bg-slate-500/10 text-slate-500",
};

export default function NotificationsPage() {
 const router = useRouter();
 const [notifications, setNotifications] = useState<Notification[]>([]);
 const [loading, setLoading] = useState(true);
 const [markingAll, setMarkingAll] = useState(false);

 useEffect(() => {
 loadNotifications();
 }, []);

 async function loadNotifications() {
 setLoading(true);
 const res = await api.getNotifications();
 if (res.data) setNotifications(res.data);
 setLoading(false);
 }

 async function handleMarkRead(id: string) {
 const res = await api.markNotificationRead(id);
 if (!res.error) {
 setNotifications((prev) =>
 prev.map((n) => (n.id === id ? { ...n, read: true } : n))
 );
 }
 }

 async function handleMarkAllRead() {
 setMarkingAll(true);
 const res = await api.markAllNotificationsRead();
 if (!res.error) {
 setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
 toast.success("All notifications marked as read");
 } else {
 toast.error("Failed to mark all as read");
 }
 setMarkingAll(false);
 }

 function handleClick(notification: Notification) {
 if (!notification.read) {
 handleMarkRead(notification.id);
 }
 if (notification.link) {
 router.push(notification.link);
 }
 }

 const unreadCount = notifications.filter((n) => !n.read).length;

 return (
 <div className="dashboard-page mx-auto max-w-3xl">
 {/* Header */}
 <div className="shell-panel flex items-center justify-between rounded-[1.75rem] p-5 sm:p-6">
 <div>
 <h2 className="text-lg font-bold">Notifications</h2>
 <p className="text-sm text-muted-foreground">
 {unreadCount > 0
 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
 : "You're all caught up"}
 </p>
 </div>
 {unreadCount > 0 && (
 <button
 onClick={handleMarkAllRead}
 disabled={markingAll}
 className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary/80 disabled:opacity-50"
 >
 {markingAll ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <CheckCheck className="h-4 w-4" />
 )}
 Mark all read
 </button>
 )}
 </div>

 {/* List */}
 {loading ? (
 <div className="flex items-center justify-center py-16">
 <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
 </div>
 ) : notifications.length === 0 ? (
 <div className="rounded-xl border border-border bg-card py-16 text-center">
 <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
 <p className="mt-3 text-sm text-muted-foreground">No notifications yet.</p>
 </div>
 ) : (
 <div className="divide-y divide-border rounded-xl border border-border bg-card">
 {notifications.map((notification) => {
 const Icon = typeIcons[notification.type] || Info;
 const iconColor = typeColors[notification.type] || typeColors.system;

 return (
 <button
 key={notification.id}
 onClick={() => handleClick(notification)}
 className={cn(
 "flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-accent/30 first:rounded-t-xl last:rounded-b-xl",
 !notification.read && "bg-teal-500/3"
 )}
 >
 {/* Type icon */}
 <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconColor)}>
 <Icon className="h-5 w-5" />
 </div>

 {/* Content */}
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <p className={cn("text-sm", !notification.read && "font-semibold")}>
 {notification.title}
 </p>
 {notification.body && (
 <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
 {notification.body}
 </p>
 )}
 </div>
 {!notification.read && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 handleMarkRead(notification.id);
 }}
 className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
 title="Mark as read"
 >
 <Check className="h-4 w-4" />
 </button>
 )}
 </div>

 <div className="mt-1.5 flex items-center gap-2">
 {notification.actor && (
 <span className="text-xs font-medium text-teal-700">
 @{notification.actor.username}
 </span>
 )}
 <span className="text-xs text-muted-foreground">
 {formatRelative(notification.created_at)}
 </span>
 </div>
 </div>

 {/* Unread indicator */}
 {!notification.read && (
 <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500" />
 )}
 </button>
 );
 })}
 </div>
 )}
 </div>
 );
}
