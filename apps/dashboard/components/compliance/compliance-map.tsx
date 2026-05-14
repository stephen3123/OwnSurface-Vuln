"use client";

import { useState, memo } from "react";
// @ts-expect-error react-simple-maps has no type declarations
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { CountryComplianceResult } from "@/lib/compliance/engine";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ComplianceMapProps {
 results: CountryComplianceResult[];
 onCountryClick: (countryCode: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
 compliant: "#10b981",
 partial: "#f59e0b",
 non_compliant: "#ef4444",
 unknown: "#1e293b",
};

const ISO_NUMERIC_TO_ALPHA2: Record<string, string> = {
 "040": "AT", "056": "BE", "100": "BG", "191": "HR", "196": "CY",
 "203": "CZ", "208": "DK", "233": "EE", "246": "FI", "250": "FR",
 "276": "DE", "300": "GR", "348": "HU", "372": "IE", "380": "IT",
 "428": "LV", "440": "LT", "442": "LU", "470": "MT", "528": "NL",
 "616": "PL", "620": "PT", "642": "RO", "703": "SK", "705": "SI",
 "724": "ES", "752": "SE", "352": "IS", "438": "LI", "578": "NO",
 "826": "GB", "840": "US", "124": "CA", "076": "BR",
 "710": "ZA", "702": "SG", "764": "TH", "036": "AU",
 "392": "JP", "156": "CN", "356": "IN", "410": "KR", "792": "TR",
 "756": "CH",
};

const COUNTRY_NAMES: Record<string, string> = {
 AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
 CZ: "Czechia", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
 DE: "Germany", GR: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
 LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
 PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia", SI: "Slovenia",
 ES: "Spain", SE: "Sweden", IS: "Iceland", LI: "Liechtenstein", NO: "Norway",
 GB: "United Kingdom", US: "United States", CA: "Canada", BR: "Brazil",
 ZA: "South Africa", SG: "Singapore", TH: "Thailand", AU: "Australia",
 JP: "Japan", CN: "China", IN: "India", KR: "South Korea", TR: "Turkey",
 CH: "Switzerland",
};

const STATUS_LABELS: Record<string, string> = {
 compliant: "Compliant",
 partial: "Partial",
 non_compliant: "Non-Compliant",
 unknown: "Not Evaluated",
};

function ComplianceMapInner({ results, onCountryClick }: ComplianceMapProps) {
 const [tooltip, setTooltip] = useState<{ name: string; status: string; x: number; y: number } | null>(null);
 const [zoom, setZoom] = useState(1);
 const [center, setCenter] = useState<[number, number]>([0, 20]);

 const resultMap = new Map<string, CountryComplianceResult>();
 for (const r of results) {
 resultMap.set(r.countryCode, r);
 }

 function getCountryColor(geoId: string): string {
 const alpha2 = ISO_NUMERIC_TO_ALPHA2[geoId];
 if (!alpha2) return STATUS_COLORS.unknown;
 const result = resultMap.get(alpha2);
 if (!result) return STATUS_COLORS.unknown;
 return STATUS_COLORS[result.overallStatus] ?? STATUS_COLORS.unknown;
 }

 function handleClick(geoId: string) {
 const alpha2 = ISO_NUMERIC_TO_ALPHA2[geoId];
 if (alpha2 && resultMap.has(alpha2)) {
 onCountryClick(alpha2);
 }
 }

 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 <div className="mb-4 flex items-center justify-between">
 <p className="section-kicker">World Compliance Map</p>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
 <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />Compliant</span>
 <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />Partial</span>
 <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />Non-Compliant</span>
 <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-700" />Unknown</span>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => setZoom((z) => Math.min(z * 1.5, 8))}
 className="rounded-lg p-1.5 hover:bg-white/5 transition-colors"
 >
 <ZoomIn className="h-4 w-4 text-muted-foreground" />
 </button>
 <button
 onClick={() => setZoom((z) => Math.max(z / 1.5, 1))}
 className="rounded-lg p-1.5 hover:bg-white/5 transition-colors"
 >
 <ZoomOut className="h-4 w-4 text-muted-foreground" />
 </button>
 <button
 onClick={() => { setZoom(1); setCenter([0, 20]); }}
 className="rounded-lg p-1.5 hover:bg-white/5 transition-colors"
 >
 <RotateCcw className="h-4 w-4 text-muted-foreground" />
 </button>
 </div>
 </div>
 </div>

 <div className="relative overflow-hidden rounded-xl border border-border bg-[#06060a]">
 <ComposableMap
 projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
 style={{ width: "100%", height: "auto" }}
 >
 <ZoomableGroup zoom={zoom} center={center} onMoveEnd={({ coordinates, zoom: z }: any) => { setCenter(coordinates); setZoom(z); }}>
 <Geographies geography={GEO_URL}>
 {({ geographies }: { geographies: any[] }) =>
 geographies.map((geo) => {
 const geoId = geo.id;
 const alpha2 = ISO_NUMERIC_TO_ALPHA2[geoId];
 const hasData = alpha2 && resultMap.has(alpha2);
 const color = getCountryColor(geoId);

 return (
 <Geography
 key={geo.rsmKey}
 geography={geo}
 fill={color}
 stroke="#1a1a2e"
 strokeWidth={0.5}
 style={{
 default: { outline: "none", opacity: hasData ? 1 : 0.3 },
 hover: { outline: "none", opacity: 1, fill: hasData ? color : "#334155", cursor: hasData ? "pointer" : "default" },
 pressed: { outline: "none" },
 }}
 onClick={() => handleClick(geoId)}
 onMouseEnter={(e: React.MouseEvent) => {
 const name = alpha2 ? (COUNTRY_NAMES[alpha2] ?? geo.properties.name) : geo.properties.name;
 const result = alpha2 ? resultMap.get(alpha2) : undefined;
 const status = result ? (STATUS_LABELS[result.overallStatus] ?? "Unknown") : "Not Evaluated";
 setTooltip({ name, status, x: e.clientX, y: e.clientY });
 }}
 onMouseLeave={() => setTooltip(null)}
 />
 );
 })
 }
 </Geographies>
 </ZoomableGroup>
 </ComposableMap>

 {tooltip && (
 <div
 className="pointer-events-none fixed z-50 rounded-lg border border-border bg-[#0f0f18] px-3 py-2"
 style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
 >
 <p className="text-xs font-semibold">{tooltip.name}</p>
 <p className="text-[10px] text-muted-foreground">{tooltip.status}</p>
 </div>
 )}
 </div>
 </div>
 );
}

export const ComplianceMap = memo(ComplianceMapInner);
