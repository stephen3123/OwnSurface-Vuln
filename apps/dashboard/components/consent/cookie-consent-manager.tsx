"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2 } from "lucide-react";
import { CONSENT_COOKIE_VERSION, createConsentPreferences, readConsentCookie, writeConsentCookie } from "@/lib/consent";

function isConsentManagedPath(pathname: string) {
 if (pathname.startsWith("/dashboard")) return false;
 if (pathname.startsWith("/login")) return false;
 if (pathname.startsWith("/register")) return false;
 if (pathname.startsWith("/reset-password")) return false;
 if (pathname.startsWith("/api/")) return false;
 return true;
}

function announceConsentChange() {
 window.dispatchEvent(new Event("ownsurface:consent-changed"));
}

export function CookieConsentManager() {
 const pathname = usePathname();
 const [showBanner, setShowBanner] = useState(false);
 const [showPreferences, setShowPreferences] = useState(false);
 const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

 const canRender = useMemo(() => isConsentManagedPath(pathname), [pathname]);

 useEffect(() => {
 if (!canRender) {
 setShowBanner(false);
 setShowPreferences(false);
 return;
 }

 const current = readConsentCookie();
 const needsPrompt = !current || current.version !== CONSENT_COOKIE_VERSION;
 setAnalyticsEnabled(current?.analytics ?? false);
 setShowBanner(needsPrompt);
 }, [canRender, pathname]);

 if (!canRender || !showBanner) {
 return null;
 }

 function saveConsent(analytics: boolean) {
 writeConsentCookie(createConsentPreferences(analytics));
 announceConsentChange();
 setAnalyticsEnabled(analytics);
 setShowBanner(false);
 setShowPreferences(false);
 }

 return (
 <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[#0a0f0d]/95 backdrop-blur-xl">
 <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-10">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
 <div className="max-w-3xl">
 <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/40">Cookie preferences</p>
 <p className="mt-2 text-sm leading-6 text-white/60">
 Essential cookies keep sign-in and core product flows working. Analytics cookies help us understand how public pages are used after consent.
 Read the full <Link href="/cookies" className="font-semibold text-white hover:text-teal-400 transition-colors">cookie notice</Link> and <Link href="/privacy" className="font-semibold text-white hover:text-teal-400 transition-colors">privacy policy</Link>.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={() => setShowPreferences((value) => !value)}
 className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:border-white/20 hover:bg-white/10 transition-colors"
 >
 <Settings2 className="h-4 w-4" />
 Manage preferences
 </button>
 <button
 type="button"
 onClick={() => saveConsent(false)}
 className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:border-white/20 hover:bg-white/10 transition-colors"
 >
 Reject non-essential
 </button>
 <button
 type="button"
 onClick={() => saveConsent(true)}
 className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
 >
 Accept all
 </button>
 </div>
 </div>

 {showPreferences ? (
 <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
 <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
 <div className="text-sm font-semibold text-white">Essential cookies</div>
 <p className="mt-2 text-sm leading-6 text-white/50">
 Required for authentication, security, and core product operation.
 </p>
 <div className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-teal-400">Always active</div>
 </div>

 <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
 <div className="flex items-start justify-between gap-3">
 <div>
 <div className="text-sm font-semibold text-white">Analytics cookies</div>
 <p className="mt-2 text-sm leading-6 text-white/50">
 Enable Google Analytics on public pages after consent.
 </p>
 </div>
 <label className="relative inline-flex cursor-pointer items-center">
 <input
 type="checkbox"
 checked={analyticsEnabled}
 onChange={(event) => setAnalyticsEnabled(event.target.checked)}
 className="peer sr-only"
 />
 <div className="h-6 w-11 rounded-full bg-white/10 peer-checked:bg-teal-500 peer-focus:ring-2 peer-focus:ring-teal-500/30 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
 </label>
 </div>
 <button
 type="button"
 onClick={() => saveConsent(analyticsEnabled)}
 className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:border-white/20 hover:bg-white/10 transition-colors"
 >
 Save preferences
 </button>
 </div>
 </div>
 ) : null}
 </div>
 </div>
 );
}
