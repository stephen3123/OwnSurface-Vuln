"use client";

import { cn } from "@/lib/utils";

interface AppMetadataProps {
 metadata: {
 app_name?: string;
 package_name?: string;
 version_name?: string;
 platform: "android" | "ios";
 framework?: string;
 target_sdk?: number;
 permissions?: string[];
 };
}

const FRAMEWORK_COLORS: Record<string, string> = {
 "React Native": "bg-cyan-50 text-cyan-900 border-cyan-200",
 Flutter: "bg-blue-50 text-blue-900 border-blue-200",
 Xamarin: "bg-purple-50 text-purple-900 border-purple-200",
 Cordova: "bg-green-50 text-green-900 border-green-200",
 Native: "bg-muted/30 text-muted-foreground border-border",
};

export function AppMetadata({ metadata }: AppMetadataProps) {
 const frameworkStyle =
 FRAMEWORK_COLORS[metadata.framework || ""] || FRAMEWORK_COLORS.Native;

 return (
 <div className="shell-panel bg-card/50 rounded-[2rem] p-8 border border-border h-fit">
 <h3 className="mb-6 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
 APPLICATION ARTIFACT METADATA
 </h3>
 <div className="flex items-start gap-4 mt-2">
 <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-muted/30 border border-border font-medium text-[0.8rem] text-muted-foreground">
 {metadata.platform === "android" ? "APK" : "IPA"}
 </div>

 <div className="min-w-0 flex-1">
 <h2 className={cn("text-[1.5rem] font-medium tracking-tighter text-foreground", !metadata.app_name && "animate-pulse")}>
 {metadata.app_name || metadata.package_name || "Processing App..."}
 </h2>
 <p className="mt-1 truncate text-[0.85rem] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
 {metadata.package_name || "INTELLIGENCE EXTRACTION PENDING"}
 </p>

 <div className="mt-4 flex flex-wrap items-center gap-2">
 {/* Platform badge */}
 <span className="rounded-md bg-muted/30 border border-border px-3 py-1 text-[0.65rem] uppercase tracking-widest font-medium text-muted-foreground">
 {metadata.platform === "android" ? "Android" : "iOS"}
 </span>

 {/* Version */}
 {metadata.version_name && (
 <span className="rounded-md bg-muted/30 border border-border px-3 py-1 text-[0.65rem] uppercase tracking-widest font-medium text-muted-foreground">
 VERSION {metadata.version_name}
 </span>
 )}

 {/* Target SDK */}
 {metadata.target_sdk && (
 <span className="rounded-md bg-muted/30 border border-border px-3 py-1 text-[0.65rem] uppercase tracking-widest font-medium text-muted-foreground">
 SDK LEVEL {metadata.target_sdk}
 </span>
 )}

 {/* Framework badge */}
 {metadata.framework && (
 <span
 className={cn("rounded-md border px-3 py-1 text-[0.65rem] uppercase tracking-widest font-medium", frameworkStyle)}
 >
 {metadata.framework}
 </span>
 )}

 {/* Permissions count */}
 {metadata.permissions && metadata.permissions.length > 0 && (
 <span className="rounded-md bg-amber-50 border border-amber-200 px-3 py-1 text-[0.65rem] uppercase tracking-widest font-medium text-amber-900">
 {metadata.permissions.length} PERMISSION{metadata.permissions.length !== 1 ? "S" : ""}
 </span>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
