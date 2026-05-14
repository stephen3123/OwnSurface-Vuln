"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type LeadSearchResult, type TechnologyListItem } from "@/lib/api-client";
import { useUserPlan } from "@/lib/dashboard-cache";
import Link from "next/link";
import {
 UserSearch,
 Search,
 Download,
 Loader2,
 ChevronLeft,
 ChevronRight,
 Lock,
 Building2,
 MapPin,
 Users,
 Globe,
 Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeadsPage() {
 const { data: userPlan } = useUserPlan();
 const isPro = userPlan?.plan === "pro";

 const [results, setResults] = useState<LeadSearchResult[]>([]);
 const [total, setTotal] = useState(0);
 const [page, setPage] = useState(1);
 const [perPage] = useState(25);
 const [hasMore, setHasMore] = useState(false);
 const [loading, setLoading] = useState(false);
 const [exporting, setExporting] = useState(false);

 // Filters
 const [query, setQuery] = useState("");
 const [technology, setTechnology] = useState("");
 const [industry, setIndustry] = useState("");
 const [employees, setEmployees] = useState("");
 const [trafficTier, setTrafficTier] = useState("");
 const [location, setLocation] = useState("");

 // Technologies for autocomplete
 const [technologies, setTechnologies] = useState<TechnologyListItem[]>([]);
 const [showTechDropdown, setShowTechDropdown] = useState(false);
 const [techFilter, setTechFilter] = useState("");

 useEffect(() => {
 api.getLeadTechnologies().then((res) => {
 if (res.data?.technologies) setTechnologies(res.data.technologies);
 });
 }, []);

 const search = useCallback(async (p = 1) => {
 setLoading(true);
 const res = await api.searchLeads({
 q: query || undefined,
 technology: technology || undefined,
 industry: industry || undefined,
 employees: employees || undefined,
 traffic_tier: trafficTier || undefined,
 location: location || undefined,
 page: p,
 per_page: perPage,
 });
 if (res.data) {
 setResults(res.data.results);
 setTotal(res.data.total);
 setHasMore(res.data.has_more);
 setPage(p);
 }
 setLoading(false);
 }, [query, technology, industry, employees, trafficTier, location, perPage]);

 useEffect(() => {
 search(1);
 }, [search]);

 async function handleExport() {
 if (!isPro) return;
 setExporting(true);
 const res = await api.exportLeadsCsv({
 q: query || undefined,
 technology: technology || undefined,
 industry: industry || undefined,
 employees: employees || undefined,
 traffic_tier: trafficTier || undefined,
 location: location || undefined,
 });
 if (res.data) {
 const blob = new Blob([res.data as unknown as string], { type: "text/csv" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = "leads.csv";
 a.click();
 URL.revokeObjectURL(url);
 }
 setExporting(false);
 }

 const filteredTechs = technologies.filter(
 (t) => t.technology_name.toLowerCase().includes(techFilter.toLowerCase())
 ).slice(0, 15);

 const employeeRanges = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"];
 const trafficTiers = ["Very High", "High", "Medium", "Low"];

 return (
 <div className="dashboard-page mx-auto max-w-5xl space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <p className="mt-1 text-sm text-muted-foreground">
 Search companies by technology, industry, traffic, and more
 </p>
 </div>
 <button
 onClick={handleExport}
 disabled={!isPro || exporting || total === 0}
 className={cn(
 "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors",
 isPro
 ? "bg-foreground text-background hover:bg-foreground/90"
 : "bg-secondary text-muted-foreground cursor-not-allowed"
 )}
 >
 {!isPro && <Lock className="h-3.5 w-3.5" />}
 <Download className="h-4 w-4" />
 {exporting ? "Exporting..." : "Export CSV"}
 </button>
 </div>

 {/* Filters */}
 <div className="rounded-xl border border-border/40 bg-card/50 p-5">
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {/* Full-text search */}
 <div className="relative sm:col-span-2 lg:col-span-3">
 <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
 <input
 type="text"
 placeholder="Search companies, domains, descriptions..."
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
 />
 </div>

 {/* Technology */}
 <div className="relative">
 <label className="mb-1 block text-xs font-medium text-muted-foreground">Technology</label>
 <input
 type="text"
 placeholder="e.g. React, WordPress..."
 value={technology || techFilter}
 onChange={(e) => {
 setTechFilter(e.target.value);
 setShowTechDropdown(true);
 if (!e.target.value) setTechnology("");
 }}
 onFocus={() => setShowTechDropdown(true)}
 onBlur={() => setTimeout(() => setShowTechDropdown(false), 200)}
 className="w-full rounded-xl border border-border bg-background py-2 px-3 text-sm focus:border-teal-500 focus:outline-none"
 />
 {showTechDropdown && filteredTechs.length > 0 && (
 <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-background">
 {filteredTechs.map((t) => (
 <button
 key={t.technology_name}
 className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-secondary"
 onMouseDown={(e) => {
 e.preventDefault();
 setTechnology(t.technology_name);
 setTechFilter(t.technology_name);
 setShowTechDropdown(false);
 }}
 >
 <span>{t.technology_name}</span>
 <span className="text-xs text-muted-foreground">{t.domain_count} domains</span>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Industry */}
 <div>
 <label className="mb-1 block text-xs font-medium text-muted-foreground">Industry</label>
 <input
 type="text"
 placeholder="e.g. Technology, Finance..."
 value={industry}
 onChange={(e) => setIndustry(e.target.value)}
 className="w-full rounded-xl border border-border bg-background py-2 px-3 text-sm focus:border-teal-500 focus:outline-none"
 />
 </div>

 {/* Employees */}
 <div>
 <label className="mb-1 block text-xs font-medium text-muted-foreground">Employees</label>
 <select
 value={employees}
 onChange={(e) => setEmployees(e.target.value)}
 className="w-full rounded-xl border border-border bg-background py-2 px-3 text-sm focus:border-teal-500 focus:outline-none"
 >
 <option value="">Any</option>
 {employeeRanges.map((r) => (
 <option key={r} value={r}>{r}</option>
 ))}
 </select>
 </div>

 {/* Traffic Tier */}
 <div>
 <label className="mb-1 block text-xs font-medium text-muted-foreground">Traffic Tier</label>
 <select
 value={trafficTier}
 onChange={(e) => setTrafficTier(e.target.value)}
 className="w-full rounded-xl border border-border bg-background py-2 px-3 text-sm focus:border-teal-500 focus:outline-none"
 >
 <option value="">Any</option>
 {trafficTiers.map((t) => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 </div>

 {/* Location */}
 <div>
 <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
 <input
 type="text"
 placeholder="e.g. San Francisco, UK..."
 value={location}
 onChange={(e) => setLocation(e.target.value)}
 className="w-full rounded-xl border border-border bg-background py-2 px-3 text-sm focus:border-teal-500 focus:outline-none"
 />
 </div>
 </div>
 </div>

 {/* Results count */}
 <div className="flex items-center justify-between text-sm text-muted-foreground">
 <span>
 {!isPro && total > 3 ? (
 <>
 Showing 3 of {total.toLocaleString()} results —{" "}
 <Link href="/pricing" className="font-medium text-teal-600 hover:underline">
 Upgrade to see all
 </Link>
 </>
 ) : (
 <>{total.toLocaleString()} results found</>
 )}
 </span>
 {loading && <Loader2 className="h-4 w-4 animate-spin" />}
 </div>

 {/* Results table */}
 <div className="overflow-x-auto rounded-xl border border-border/40 bg-card/50">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border">
 <th className="px-4 py-3 text-left font-medium text-muted-foreground">Domain</th>
 <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
 <th className="px-4 py-3 text-left font-medium text-muted-foreground">Industry</th>
 <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employees</th>
 <th className="px-4 py-3 text-left font-medium text-muted-foreground">Traffic</th>
 <th className="px-4 py-3 text-left font-medium text-muted-foreground">Security</th>
 </tr>
 </thead>
 <tbody>
 {results.length === 0 && !loading && (
 <tr>
 <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
 No results found. Try adjusting your filters or scan more websites.
 </td>
 </tr>
 )}
 {results.map((r) => (
 <tr key={r.domain} className="border-b border-border/50 last:border-b-0 hover:bg-secondary/30">
 <td className="px-4 py-3">
 <Link
 href={`/dashboard/leads/${r.domain}`}
 className="flex items-center gap-2 font-medium text-foreground hover:text-teal-600"
 >
 <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
 {r.domain}
 </Link>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-1.5">
 <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
 <span className="truncate max-w-[160px]">{r.company_name || "-"}</span>
 </div>
 </td>
 <td className="px-4 py-3 text-muted-foreground">{r.industry || "-"}</td>
 <td className="px-4 py-3">
 {r.employees_range ? (
 <span className="flex items-center gap-1">
 <Users className="h-3.5 w-3.5 text-muted-foreground" />
 {r.employees_range}
 </span>
 ) : "-"}
 </td>
 <td className="px-4 py-3">
 {r.traffic_tier ? (
 <span className={cn(
 "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
 r.traffic_tier === "Very High" && "bg-emerald-500/10 text-emerald-400",
 r.traffic_tier === "High" && "bg-blue-500/10 text-blue-400",
 r.traffic_tier === "Medium" && "bg-amber-500/10 text-amber-400",
 r.traffic_tier === "Low" && "bg-muted text-muted-foreground",
 )}>
 {r.traffic_tier}
 </span>
 ) : "-"}
 </td>
 <td className="px-4 py-3">
 {r.security_grade ? (
 <span className={cn(
 "inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
 r.security_grade === "A" && "bg-emerald-500/10 text-emerald-400",
 r.security_grade === "B" && "bg-blue-500/10 text-blue-400",
 r.security_grade === "C" && "bg-amber-500/10 text-amber-400",
 r.security_grade === "D" && "bg-orange-500/10 text-orange-400",
 r.security_grade === "F" && "bg-red-500/10 text-red-400",
 )}>
 {r.security_grade}
 </span>
 ) : (
 <Shield className="h-4 w-4 text-muted-foreground/40" />
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {isPro && total > perPage && (
 <div className="flex items-center justify-center gap-3">
 <button
 onClick={() => search(page - 1)}
 disabled={page <= 1}
 className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-sm font-medium disabled:opacity-40"
 >
 <ChevronLeft className="h-4 w-4" /> Previous
 </button>
 <span className="text-sm text-muted-foreground">
 Page {page} of {Math.ceil(total / perPage)}
 </span>
 <button
 onClick={() => search(page + 1)}
 disabled={!hasMore}
 className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-sm font-medium disabled:opacity-40"
 >
 Next <ChevronRight className="h-4 w-4" />
 </button>
 </div>
 )}
 </div>
 );
}
