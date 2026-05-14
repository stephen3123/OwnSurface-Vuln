"use client";

import type { Technology } from "@/lib/api-client";
import { getCategoryColor, cn } from "@/lib/utils";

interface TechStackGridProps {
 technologies: Technology[];
}

export function TechStackGrid({ technologies }: TechStackGridProps) {
 const grouped = technologies.reduce<Record<string, Technology[]>>((acc, tech) => {
 const cat = tech.category || "Other";
 if (!acc[cat]) acc[cat] = [];
 acc[cat].push(tech);
 return acc;
 }, {});

 const categories = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

 if (technologies.length === 0) {
 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border-border">
 <div className="flex items-center gap-2 mb-6 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground px-1 underline decoration-2 underline-offset-8">
 Technology Inventory
 </div>
 <p className="text-zinc-600 text-[0.85rem] font-medium px-1">No technologies detected by the automated scanner.</p>
 </div>
 );
 }

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border-border">
 <div className="flex items-center justify-between mb-8 px-1">
 <div className="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground underline decoration-2 underline-offset-8">
 Technology Inventory
 </div>
 <div className="flex items-center gap-1.5 rounded-full bg-black/5 border border-black/10 px-3 py-1 text-[0.62rem] font-black text-foreground">
 {technologies.length} Stack Components
 </div>
 </div>

 <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
 {categories.map(([category, techs]) => (
 <div key={category} className="space-y-3">
 <h4 className="text-[0.62rem] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 px-1">
 {category}
 </h4>
 <div className="flex flex-wrap gap-2 px-1">
 {techs.map((tech) => (
 <div
 key={tech.name}
 className={cn(
 "platform-chip text-[0.72rem] tracking-tight py-1.5 px-3 border-border/50",
 getCategoryColor(category)
 )}
 >
 <span className="font-semibold text-foreground/90">{tech.name}</span>
 {tech.version && (
 <span className="ml-1.5 text-[0.65rem] font-bold text-muted-foreground opacity-60 bg-card/50 px-1.5 py-0.5 rounded-md border border-border/40">{tech.version}</span>
 )}
 {tech.confidence < 80 && (
 <div className="ml-2 h-1.5 w-1.5 rounded-full bg-amber-500/40 animate-pulse" title={`Confidence: ${tech.confidence}%`} />
 )}
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
