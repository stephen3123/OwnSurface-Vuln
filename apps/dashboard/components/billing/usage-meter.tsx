"use client";

import { cn } from "@/lib/utils";

interface UsageMeterProps {
 used: number;
 limit: number;
 label: string;
 className?: string;
}

export function UsageMeter({ used, limit, label, className }: UsageMeterProps) {
 const isUnlimited = limit === -1;
 const percentage = isUnlimited ? 5 : Math.min((used / limit) * 100, 100);
 const isWarning = !isUnlimited && percentage >= 80;
 const isExceeded = !isUnlimited && percentage >= 100;

 return (
 <div className={cn("space-y-2.5", className)}>
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">{label}</span>
 <span className={cn("font-medium", isExceeded && "text-red-400", isWarning && !isExceeded && "text-yellow-400")}>
 {used.toLocaleString()} / {isUnlimited ? "Unlimited" : limit.toLocaleString()}
 </span>
 </div>
 <div className="h-2 bg-background rounded-full overflow-hidden">
 <div
 className={cn(
 "h-full rounded-full transition-all duration-500",
 isExceeded ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-teal-500"
 )}
 style={{ width: `${percentage}%` }}
 />
 </div>
 </div>
 );
}
