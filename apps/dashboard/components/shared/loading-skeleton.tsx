import { cn } from "@/lib/utils";

interface SkeletonProps {
 className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
 return <div className={cn("animate-shimmer rounded-md", className)} />;
}

export function CardSkeleton() {
 return (
 <div className="shell-panel rounded-[1.5rem] p-6 space-y-4">
 <Skeleton className="h-4 w-1/3" />
 <Skeleton className="h-8 w-1/2" />
 <Skeleton className="h-3 w-full" />
 <Skeleton className="h-3 w-2/3" />
 </div>
 );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
 return (
 <div className="space-y-3">
 <div className="flex gap-4 pb-3 border-b border-border">
 <Skeleton className="h-4 w-1/4" />
 <Skeleton className="h-4 w-1/4" />
 <Skeleton className="h-4 w-1/4" />
 <Skeleton className="h-4 w-1/4" />
 </div>
 {Array.from({ length: rows }).map((_, i) => (
 <div key={i} className="flex gap-4 py-2">
 <Skeleton className="h-5 w-1/4" />
 <Skeleton className="h-5 w-1/4" />
 <Skeleton className="h-5 w-1/4" />
 <Skeleton className="h-5 w-1/4" />
 </div>
 ))}
 </div>
 );
}

export function ScanResultSkeleton() {
 return (
 <div className="space-y-6">
 <div className="shell-panel rounded-[1.5rem] p-6 space-y-3">
 <Skeleton className="h-5 w-1/3" />
 <Skeleton className="h-4 w-full" />
 <Skeleton className="h-4 w-4/5" />
 </div>
 <div className="grid md:grid-cols-2 gap-6">
 <div className="shell-panel rounded-[1.5rem] p-6 space-y-4">
 <Skeleton className="h-5 w-1/4" />
 <div className="grid grid-cols-3 gap-3">
 {Array.from({ length: 9 }).map((_, i) => (
 <Skeleton key={i} className="h-8 w-full" />
 ))}
 </div>
 </div>
 <div className="shell-panel rounded-[1.5rem] p-6 space-y-4">
 <Skeleton className="h-5 w-1/4" />
 <Skeleton className="h-32 w-32 rounded-full mx-auto" />
 <Skeleton className="h-4 w-full" />
 </div>
 </div>
 </div>
 );
}
