"use client";

import type { SocialLink } from "@/lib/api-client";
import { formatNumber, cn } from "@/lib/utils";

function getPlatformColor(platform: string): string {
 switch (platform.toLowerCase()) {
 case "twitter":
 case "x":
 return "hover:text-sky-400";
 case "github":
 return "hover:text-white";
 case "linkedin":
 return "hover:text-blue-400";
 case "facebook":
 return "hover:text-blue-500";
 case "instagram":
 return "hover:text-pink-400";
 case "youtube":
 return "hover:text-red-400";
 default:
 return "hover:text-teal-700";
 }
}

interface SocialLinksProps {
 links: SocialLink[];
}

export function SocialLinks({ links }: SocialLinksProps) {
 if (links.length === 0) return null;

 return (
 <div className="shell-panel rounded-[2rem] p-8 h-full border border-border">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground px-1 underline decoration-2 underline-offset-8">
 Digital Footprint
 </div>

 <div className="flex flex-wrap gap-3 px-1">
 {links.map((link) => {
 const colorClass = getPlatformColor(link.platform);
 return (
 <a
 key={link.platform}
 href={link.url}
 target="_blank"
 rel="noopener noreferrer"
 className={cn(
 "group flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border text-foreground transition-all hover:bg-muted/30 hover:scale-[1.02] ",
 colorClass
 )}
 >
 <div className="flex flex-col">
 <span className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground group-hover:text-inherit transition-colors">{link.platform}</span>
 </div>
 {link.followers != null && (
 <div className="ml-2 pl-3 border-l border-border text-[0.75rem] font-black font-mono">
 {formatNumber(link.followers)}
 </div>
 )}
 </a>
 );
 })}
 </div>
 </div>
 );
}
