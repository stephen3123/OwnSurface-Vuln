"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getRouteKey(pathname: string, search: string) {
 return `${pathname}${search ? `?${search}` : ""}`;
}

export function RouteProgress() {
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const routeKey = useMemo(
  () => getRouteKey(pathname, searchParams.toString()),
  [pathname, searchParams],
 );

 const [visible, setVisible] = useState(false);
 const [progress, setProgress] = useState(0);
 const routeRef = useRef(routeKey);
 const progressTimerRef = useRef<number | null>(null);
 const hideTimerRef = useRef<number | null>(null);
 const beginTimerRef = useRef<number | null>(null);
 const startedAtRef = useRef(0);

 const clearTimers = () => {
  if (beginTimerRef.current) {
   window.clearTimeout(beginTimerRef.current);
   beginTimerRef.current = null;
  }
  if (progressTimerRef.current) {
   window.clearInterval(progressTimerRef.current);
   progressTimerRef.current = null;
  }
  if (hideTimerRef.current) {
   window.clearTimeout(hideTimerRef.current);
   hideTimerRef.current = null;
  }
 };

 const beginProgress = () => {
  clearTimers();
  startedAtRef.current = Date.now();
  setVisible(true);
  setProgress(12);

  progressTimerRef.current = window.setInterval(() => {
   setProgress((current) => {
    if (current >= 88) return current;
    const nextStep = current < 40 ? 12 : current < 68 ? 7 : 3;
    return Math.min(current + nextStep, 88);
   });
  }, 140);
 };

 const scheduleBeginProgress = () => {
  if (beginTimerRef.current) {
   window.clearTimeout(beginTimerRef.current);
  }

  // Defer the state update so it doesn't run during Next/React's
  // internal insertion-effect navigation plumbing.
  beginTimerRef.current = window.setTimeout(() => {
   beginTimerRef.current = null;
   beginProgress();
  }, 0);
 };

 useEffect(() => {
  routeRef.current = routeKey;

  if (!visible) return;

  const elapsed = Date.now() - startedAtRef.current;
  const remaining = Math.max(180 - elapsed, 0);

  window.clearInterval(progressTimerRef.current ?? undefined);
  progressTimerRef.current = null;

  hideTimerRef.current = window.setTimeout(() => {
   setProgress(100);
   hideTimerRef.current = window.setTimeout(() => {
    setVisible(false);
    setProgress(0);
   }, 180);
  }, remaining);
 }, [routeKey, visible]);

 useEffect(() => {
  const handleClick = (event: MouseEvent) => {
   if (event.defaultPrevented || event.button !== 0) return;
   if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

   const target = event.target as HTMLElement | null;
   const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
   if (!anchor) return;
   if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

   const nextUrl = new URL(anchor.href, window.location.href);
   if (nextUrl.origin !== window.location.origin) return;

   const nextRouteKey = getRouteKey(nextUrl.pathname, nextUrl.searchParams.toString());
   if (nextRouteKey === routeRef.current) return;

   scheduleBeginProgress();
  };

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = function pushState(...args) {
   const url = args[2];
   if (typeof url === "string") {
    const nextUrl = new URL(url, window.location.href);
    const nextRouteKey = getRouteKey(nextUrl.pathname, nextUrl.searchParams.toString());
    if (nextRouteKey !== routeRef.current) scheduleBeginProgress();
   }
   return originalPushState(...args);
  };

  window.history.replaceState = function replaceState(...args) {
   const url = args[2];
   if (typeof url === "string") {
    const nextUrl = new URL(url, window.location.href);
    const nextRouteKey = getRouteKey(nextUrl.pathname, nextUrl.searchParams.toString());
    if (nextRouteKey !== routeRef.current) scheduleBeginProgress();
   }
   return originalReplaceState(...args);
  };

  window.addEventListener("click", handleClick, true);

  return () => {
   clearTimers();
   window.removeEventListener("click", handleClick, true);
   window.history.pushState = originalPushState;
   window.history.replaceState = originalReplaceState;
  };
 }, []);

 return (
  <div
   className={`pointer-events-none fixed inset-x-0 top-0 z-[90] transition-opacity duration-150 ${
    visible ? "opacity-100" : "opacity-0"
   }`}
   aria-hidden="true"
  >
   <div
    className="h-[2px] origin-left bg-[linear-gradient(90deg,rgba(45,212,191,0.95),rgba(96,165,250,0.92),rgba(45,212,191,0.9))] shadow-[0_0_14px_rgba(45,212,191,0.38)] transition-[transform] duration-180 ease-out"
    style={{ transform: `scaleX(${progress / 100})` }}
   />
  </div>
 );
}
