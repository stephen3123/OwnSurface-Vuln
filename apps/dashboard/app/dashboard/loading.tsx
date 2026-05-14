import { Skeleton } from "@/components/shared/loading-skeleton";

export default function DashboardLoading() {
 return (
 <div className="dashboard-page mx-auto max-w-[1440px] space-y-6">
 <div className="overflow-hidden rounded-md bg-card/60">
 <div className="h-[2px] w-1/3 animate-pulse bg-[linear-gradient(90deg,rgba(45,212,191,0.95),rgba(96,165,250,0.92))]" />
 </div>
 <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
 <div className="rounded-lg border border-border/40 bg-card/45 p-6">
 <Skeleton className="h-5 w-40" />
 <Skeleton className="mt-4 h-10 w-3/4" />
 <Skeleton className="mt-3 h-4 w-full" />
 <Skeleton className="mt-2 h-4 w-2/3" />
 </div>
 <div className="rounded-lg border border-border/40 bg-card/45 p-6">
 <Skeleton className="h-4 w-28" />
 <Skeleton className="mt-4 h-24 w-full" />
 </div>
 </div>
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
 <div className="rounded-lg border border-border/40 bg-card/45 p-5">
 <Skeleton className="h-4 w-24" />
 <Skeleton className="mt-4 h-8 w-20" />
 <Skeleton className="mt-3 h-3 w-full" />
 </div>
 <div className="rounded-lg border border-border/40 bg-card/45 p-5">
 <Skeleton className="h-4 w-32" />
 <Skeleton className="mt-4 h-8 w-16" />
 <Skeleton className="mt-3 h-3 w-4/5" />
 </div>
 <div className="rounded-lg border border-border/40 bg-card/45 p-5">
 <Skeleton className="h-4 w-28" />
 <Skeleton className="mt-4 h-8 w-24" />
 <Skeleton className="mt-3 h-3 w-3/4" />
 </div>
 </div>
 </div>
 );
}
