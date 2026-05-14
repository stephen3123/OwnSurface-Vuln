"use client";

import type { CompanyInfo as CompanyInfoType } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface CompanyInfoProps {
 company: CompanyInfoType;
}

export function CompanyInfoCard({ company }: CompanyInfoProps) {
 return (
 <div className="shell-panel rounded-[1.7rem] p-6 h-full flex flex-col border-border/50">
 <div className="flex items-center gap-2 mb-6 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground px-1 underline decoration-2 underline-offset-8">
 Corporate Identity
 </div>
 
 <div className="flex flex-col sm:flex-row items-start gap-6 px-1">
 <div className="relative shrink-0 group">
 <div className="absolute inset-0 bg-teal-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
 {company.logo_url ? (
 <img
 src={company.logo_url}
 alt={company.name}
 className="relative w-16 h-16 rounded-2xl object-contain bg-card p-2 border border-border "
 />
 ) : (
 <div className="relative w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden p-0.5">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={`https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(company.name || "company")}`}
 alt={company.name || "Company"}
 className="w-full h-full rounded-[14px] object-cover mix-blend-luminosity opacity-70"
 />
 </div>
 )}
 </div>

 <div className="flex-1 min-w-0 pt-1">
 <div className="flex items-center flex-wrap gap-3 mb-2">
 <h4 className="text-xl font-black tracking-tight text-foreground uppercase">{company.name}</h4>
 {company.industry && (
 <span className="rounded-full bg-black/5 border border-black/10 text-foreground px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-widest">
 {company.industry}
 </span>
 )}
 </div>
 
 {company.description && (
 <p className="text-[0.92rem] text-foreground leading-relaxed line-clamp-3 mb-4 font-black">
 {company.description}
 </p>
 )}

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 pt-2 border-t border-border/40 mt-auto">
 {company.location && (
 <div className="flex items-center gap-2.5">
 <span className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground">Location:</span>
 <span className="text-xs font-black text-foreground uppercase">{company.location}</span>
 </div>
 )}
 {company.employee_range && (
 <div className="flex items-center gap-2.5">
 <span className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground">Size:</span>
 <span className="text-xs font-black text-foreground uppercase">{company.employee_range} Employees</span>
 </div>
 )}
 {company.founded && (
 <div className="flex items-center gap-2.5">
 <span className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground">Est:</span>
 <span className="text-xs font-black text-foreground uppercase">{company.founded}</span>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
