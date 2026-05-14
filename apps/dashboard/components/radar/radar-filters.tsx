"use client";

import { Filter } from "lucide-react";

interface RadarFiltersProps {
 type: string;
 technology: string;
 dateRange: string;
 onTypeChange: (type: string) => void;
 onTechnologyChange: (tech: string) => void;
 onDateRangeChange: (range: string) => void;
}

const eventTypes = [
 { value: "", label: "All Types" },
 { value: "tech_trend", label: "Tech Trends" },
 { value: "security_alert", label: "Security Alerts" },
 { value: "market_signal", label: "Market Signals" },
];

const dateRanges = [
 { value: "7d", label: "Last 7 days" },
 { value: "30d", label: "Last 30 days" },
 { value: "90d", label: "Last 90 days" },
];

export function RadarFilters({
 type,
 technology,
 dateRange,
 onTypeChange,
 onTechnologyChange,
 onDateRangeChange,
}: RadarFiltersProps) {
 return (
 <div className="flex flex-wrap items-center gap-3">
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <Filter className="w-4 h-4" />
 <span>Filters:</span>
 </div>
 <select
 value={type}
 onChange={(e) => onTypeChange(e.target.value)}
 className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 >
 {eventTypes.map((t) => (
 <option key={t.value} value={t.value}>
 {t.label}
 </option>
 ))}
 </select>
 <input
 type="text"
 value={technology}
 onChange={(e) => onTechnologyChange(e.target.value)}
 placeholder="Technology..."
 className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40 w-40"
 />
 <select
 value={dateRange}
 onChange={(e) => onDateRangeChange(e.target.value)}
 className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 >
 {dateRanges.map((d) => (
 <option key={d.value} value={d.value}>
 {d.label}
 </option>
 ))}
 </select>
 </div>
 );
}
