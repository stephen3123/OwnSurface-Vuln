"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CompetitorAddFormProps {
 onAdd: (url: string) => Promise<void>;
 loading?: boolean;
}

export function CompetitorAddForm({ onAdd, loading }: CompetitorAddFormProps) {
 const [url, setUrl] = useState("");
 const [error, setError] = useState<string | null>(null);

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 const trimmed = url.trim();
 if (!trimmed || loading) return;

 setError(null);

 const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
 try {
 new URL(normalized);
 } catch {
 setError("Enter a valid URL");
 return;
 }

 try {
 await onAdd(normalized);
 setUrl("");
 } catch (err) {
 const message = err instanceof Error ? err.message : "Failed to add competitor";
 setError(message);
 toast.error(message);
 }
 }

 return (
 <form onSubmit={handleSubmit} className="space-y-2">
 <div className="flex items-center gap-3">
 <input
 type="text"
 value={url}
 onChange={(e) => {
 setUrl(e.target.value);
 if (error) setError(null);
 }}
 placeholder="HTTPS://COMPETITOR.COM"
 aria-invalid={error ? "true" : "false"}
 className={cn(
 "flex-1 max-w-sm px-4 py-3 bg-card border-2 rounded-xl text-sm font-black uppercase tracking-tight outline-none transition-all",
 error ? "border-red-500 focus:border-red-500" : "border-border focus:border-black"
 )}
 />
 <button
 type="submit"
 disabled={loading || !url.trim()}
 className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-zinc-800 rounded-xl text-[0.7rem] font-black uppercase tracking-widest text-white transition-all disabled:opacity-20 "
 >
 {loading ? "SCANNING..." : "TRACK COMPETITOR"}
 </button>
 </div>
 {error && <p className="text-xs font-medium text-red-500">{error}</p>}
 </form>
 );
}
