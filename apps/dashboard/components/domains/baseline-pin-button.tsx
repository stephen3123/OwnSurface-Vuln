"use client";

import { useState, useEffect } from "react";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BaselinePinButtonProps {
 domain: string;
 scanId: string;
 isPinned?: boolean;
 onToggle?: (pinned: boolean) => void;
}

function getStorageKey(domain: string) {
 return `baseline_${domain}`;
}

export function BaselinePinButton({ domain, scanId, isPinned, onToggle }: BaselinePinButtonProps) {
 const [pinned, setPinned] = useState(isPinned ?? false);

 useEffect(() => {
 if (isPinned !== undefined) {
 setPinned(isPinned);
 return;
 }
 try {
 const stored = localStorage.getItem(getStorageKey(domain));
 setPinned(stored === scanId);
 } catch {}
 }, [domain, scanId, isPinned]);

 function handleToggle() {
 const next = !pinned;
 setPinned(next);

 try {
 if (next) {
 localStorage.setItem(getStorageKey(domain), scanId);
 toast.success("Scan pinned as baseline");
 } else {
 localStorage.removeItem(getStorageKey(domain));
 toast.success("Baseline unpinned");
 }
 } catch {}

 onToggle?.(next);
 }

 return (
 <button
 onClick={handleToggle}
 className={cn(
 "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
 pinned
 ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
 : "bg-secondary text-muted-foreground border border-border hover:border-teal-500/20 hover:text-foreground",
 )}
 >
 <Pin className={cn("w-3.5 h-3.5", pinned && "fill-teal-400")} />
 {pinned ? "Unpin Baseline" : "Pin as Baseline"}
 </button>
 );
}
