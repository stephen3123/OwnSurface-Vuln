"use client";

import { useState } from "react";
import { Scan, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanInputProps {
 onScan: (url: string) => void;
 loading?: boolean;
 className?: string;
 placeholder?: string;
 size?: "default" | "large";
}

export function ScanInput({ onScan, loading, className, placeholder, size = "default" }: ScanInputProps) {
 const [url, setUrl] = useState("");
 const [error, setError] = useState("");

 function validate(value: string): boolean {
 if (!value.trim()) {
 setError("Please enter a URL");
 return false;
 }
 try {
 const u = value.startsWith("http") ? value : `https://${value}`;
 new URL(u);
 setError("");
 return true;
 } catch {
 setError("Please enter a valid URL");
 return false;
 }
 }

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!validate(url)) return;
 const finalUrl = url.startsWith("http") ? url : `https://${url}`;
 onScan(finalUrl);
 }

 function handlePaste(e: React.ClipboardEvent) {
 const pasted = e.clipboardData.getData("text");
 if (pasted && (pasted.startsWith("http://") || pasted.startsWith("https://"))) {
 e.preventDefault();
 setUrl(pasted);
 setError("");
 }
 }

 return (
 <form onSubmit={handleSubmit} className={cn("w-full", className)}>
 <div
 className={cn(
 "shell-panel flex flex-col gap-2.5 rounded-[1.35rem] sm:flex-row sm:rounded-[1.6rem]",
 size === "large" ? "p-3" : "p-2.5"
 )}
 >
 <input
 type="text"
 value={url}
 onChange={(e) => {
 setUrl(e.target.value);
 if (error) setError("");
 }}
 onPaste={handlePaste}
 placeholder={placeholder || "Enter a website URL..."}
 className={cn(
 "flex-1 bg-transparent px-4 text-foreground placeholder:text-muted-foreground outline-none",
 size === "large" ? "py-4 text-base sm:text-lg" : "py-3 text-sm"
 )}
 />
 <button
 type="submit"
 disabled={loading}
 className={cn(
 "flex w-full shrink-0 items-center justify-center gap-2 rounded-[1.05rem] bg-teal-500/10 border border-teal-500/20 font-semibold text-teal-400 transition-all hover:bg-teal-500/20 hover:scale-[0.98] disabled:opacity-50 sm:w-auto sm:rounded-[1.15rem]",
 size === "large" ? "px-7 py-4 text-base" : "px-4.5 py-3 text-sm"
 )}
 >
 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
 Scan
 </button>
 </div>
 {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
 </form>
 );
}
