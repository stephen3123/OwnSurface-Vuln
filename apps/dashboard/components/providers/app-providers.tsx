"use client";

import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-provider";
import { ConsentAwareAnalytics } from "@/components/analytics/consent-aware-analytics";
import { CookieConsentManager } from "@/components/consent/cookie-consent-manager";

interface AppProvidersProps {
 children: React.ReactNode;
 googleAnalyticsId?: string;
}

export function AppProviders({ children, googleAnalyticsId }: AppProvidersProps) {
 return (
 <SWRConfig
 value={{
 revalidateOnFocus: true,
 revalidateOnReconnect: true,
 shouldRetryOnError: true,
 errorRetryCount: 2,
 errorRetryInterval: 3000,
 onErrorRetry(error, _key, _config, revalidate, { retryCount }) {
 // Don't retry on auth errors — user needs to log in
 if (error?.message?.includes("unauthorized") || error?.message?.includes("401")) return;
 // Don't retry more than 2 times
 if (retryCount >= 2) return;
 setTimeout(() => revalidate({ retryCount }), 3000);
 },
 }}
 >
 <AuthProvider>
 {children}
 {googleAnalyticsId ? <ConsentAwareAnalytics measurementId={googleAnalyticsId} /> : null}
 <CookieConsentManager />
 <Toaster
 position="bottom-right"
 toastOptions={{
 style: {
 background: "rgba(255,255,255,0.94)",
 border: "1px solid rgba(17, 64, 59, 0.12)",
 color: "hsl(192 37% 10%)",
 boxShadow: "0 18px 40px rgba(9, 23, 22, 0.12)",
 backdropFilter: "blur(14px)",
 },
 }}
 />
 </AuthProvider>
 </SWRConfig>
 );
}

