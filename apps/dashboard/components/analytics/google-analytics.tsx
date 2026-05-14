"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
 interface Window {
 gtag?: (...args: unknown[]) => void;
 }
}

interface GoogleAnalyticsProps {
 measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
 const pathname = usePathname();
 const searchParams = useSearchParams();

 useEffect(() => {
 if (!window.gtag) {
 return;
 }

 const search = searchParams.toString();
 const pagePath = search ? `${pathname}?${search}` : pathname;

 window.gtag("config", measurementId, {
 page_path: pagePath,
 });
 }, [measurementId, pathname, searchParams]);

 return null;
}
