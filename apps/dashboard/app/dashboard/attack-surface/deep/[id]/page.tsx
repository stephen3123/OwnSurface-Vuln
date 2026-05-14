"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Redirect to the unified result page.
 * Deep scan results are now shown at /dashboard/attack-surface/[id]?mode=deep
 */
export default function DeepScanRedirect() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();

 useEffect(() => {
 router.replace(`/dashboard/attack-surface/${id}?mode=deep`);
 }, [id, router]);

 return (
 <div className="flex items-center justify-center py-20">
 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
 </div>
 );
}
