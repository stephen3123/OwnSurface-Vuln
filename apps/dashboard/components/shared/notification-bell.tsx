"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
 className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
 const router = useRouter();
 const [unreadCount, setUnreadCount] = useState(0);

 const fetchCount = useCallback(async () => {
 const res = await api.getUnreadCount();
 if (res.data) {
 setUnreadCount(res.data.count);
 }
 }, []);

 useEffect(() => {
 fetchCount();
 const interval = setInterval(fetchCount, 30_000);
 return () => clearInterval(interval);
 }, [fetchCount]);

 return (
 <button
 onClick={() => router.push("/dashboard/notifications")}
 className={cn(
 "relative flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-border bg-card text-muted-foreground hover:text-foreground transition-colors",
 className
 )}
 >
 <Bell className="h-4.5 w-4.5" />
 {unreadCount > 0 && (
 <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
 {unreadCount > 99 ? "99+" : unreadCount}
 </span>
 )}
 </button>
 );
}
