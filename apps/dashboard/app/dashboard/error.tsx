"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function DashboardError({
 error,
 reset,
}: {
 error: Error & { digest?: string };
 reset: () => void;
}) {
 useEffect(() => {
 console.error("[dashboard error]", error);
 }, [error]);

 return (
 <div className="flex min-h-[60vh] items-center justify-center px-4">
 <div className="text-center">
 <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
 <AlertTriangle className="h-7 w-7 text-red-400" />
 </div>
 <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
 <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
 {error.message || "An unexpected error occurred. Please try again."}
 </p>
 <button
 onClick={reset}
 className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
 >
 <RefreshCcw className="h-4 w-4" />
 Try Again
 </button>
 </div>
 </div>
 );
}
