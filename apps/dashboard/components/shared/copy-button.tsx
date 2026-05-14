"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CopyButtonProps {
 value: string;
 label?: string;
 className?: string;
 variant?: "icon" | "button";
}

export function CopyButton({ value, label, className, variant = "icon" }: CopyButtonProps) {
 const [copied, setCopied] = useState(false);

 async function handleCopy() {
 try {
 await navigator.clipboard.writeText(value);
 setCopied(true);
 toast.success("Copied to clipboard");
 setTimeout(() => setCopied(false), 2000);
 } catch {
 toast.error("Failed to copy");
 }
 }

 if (variant === "button") {
 return (
 <button
 onClick={handleCopy}
 className={cn(
 "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
 copied
 ? "bg-emerald-500/10 text-emerald-400"
 : "bg-secondary hover:bg-secondary/80 text-foreground",
 className
 )}
 >
 {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
 {label || (copied ? "Copied" : "Copy")}
 </button>
 );
 }

 return (
 <button
 onClick={handleCopy}
 className={cn(
 "p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground",
 copied && "text-emerald-400 hover:text-emerald-400",
 className
 )}
 title="Copy"
 >
 {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
 </button>
 );
}
