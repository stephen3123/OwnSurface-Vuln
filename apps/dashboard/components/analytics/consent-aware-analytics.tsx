"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { hasAnalyticsConsent, readConsentCookie } from "@/lib/consent";

interface ConsentAwareAnalyticsProps {
 measurementId: string;
}

export function ConsentAwareAnalytics({ measurementId }: ConsentAwareAnalyticsProps) {
 const [enabled, setEnabled] = useState(false);

 useEffect(() => {
 const syncConsent = () => {
 setEnabled(hasAnalyticsConsent(readConsentCookie()));
 };

 syncConsent();
 window.addEventListener("ownsurface:consent-changed", syncConsent);
 return () => window.removeEventListener("ownsurface:consent-changed", syncConsent);
 }, []);

 if (!enabled) {
 return null;
 }

 return (
 <>
 <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
 <Script id="google-analytics" strategy="afterInteractive">
 {`
 window.dataLayer = window.dataLayer || [];
 function gtag(){dataLayer.push(arguments);}
 window.gtag = gtag;
 gtag('js', new Date());
 gtag('config', '${measurementId}', { send_page_view: false });
 `}
 </Script>
 <GoogleAnalytics measurementId={measurementId} />
 </>
 );
}

