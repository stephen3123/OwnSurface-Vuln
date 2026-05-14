"use client";

import { useState } from "react";
import { CopyButton } from "@/components/shared/copy-button";
import { Shield, Code } from "lucide-react";

interface SecurityBadgePreviewProps {
 domain: string;
 grade: string;
 score: number;
}

function getGradeColor(grade: string) {
 if (grade.startsWith("A")) return { fill: "#10b981", text: "#ecfdf5" };
 if (grade === "B") return { fill: "#eab308", text: "#fefce8" };
 if (grade === "C") return { fill: "#f97316", text: "#fff7ed" };
 return { fill: "#ef4444", text: "#fef2f2" };
}

export function SecurityBadgePreview({ domain, grade, score }: SecurityBadgePreviewProps) {
 const [showEmbed, setShowEmbed] = useState(false);
 const colors = getGradeColor(grade);

 const badgeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/badge/${encodeURIComponent(domain)}`;
 const embedCode = `<a href="${typeof window !== "undefined" ? window.location.origin : ""}/report/${encodeURIComponent(domain)}" target="_blank" rel="noopener">
 <img src="${badgeUrl}" alt="OwnSurface Security Score" width="150" height="40" />
</a>`;

 return (
 <div className="bg-card border border-border rounded-xl p-5 mb-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <Shield className="w-5 h-5 text-teal-400" />
 <h3 className="text-sm font-semibold">Security Badge</h3>
 </div>
 <button
 onClick={() => setShowEmbed(!showEmbed)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary hover:bg-secondary/80 transition-colors"
 >
 <Code className="w-3.5 h-3.5" />
 {showEmbed ? "Hide Embed" : "Get Embed Code"}
 </button>
 </div>

 {/* Badge SVG preview */}
 <div className="flex items-center justify-center py-6 bg-background rounded-lg border border-border mb-4">
 <svg width="200" height="52" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
 <rect width="200" height="52" rx="8" fill="#0f172a" />
 <rect x="1" y="1" width="198" height="50" rx="7" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
 {/* Shield icon */}
 <g transform="translate(12, 10)">
 <path
 d="M16 2l-12 5.5v7.5c0 6.5 5.1 12.6 12 14 6.9-1.4 12-7.5 12-14v-7.5L16 2z"
 fill={colors.fill}
 opacity="0.2"
 />
 <path
 d="M16 2l-12 5.5v7.5c0 6.5 5.1 12.6 12 14 6.9-1.4 12-7.5 12-14v-7.5L16 2z"
 fill="none"
 stroke={colors.fill}
 strokeWidth="1.5"
 />
 <text
 x="16"
 y="20"
 textAnchor="middle"
 fontSize="12"
 fontWeight="bold"
 fill={colors.fill}
 fontFamily="system-ui, sans-serif"
 >
 {grade}
 </text>
 </g>
 {/* Text */}
 <text x="52" y="22" fontSize="11" fontWeight="600" fill="white" fontFamily="system-ui, sans-serif">
 OwnSurface Security
 </text>
 <text x="52" y="38" fontSize="10" fill="rgba(255,255,255,0.6)" fontFamily="system-ui, sans-serif">
 {domain} - {score}/100
 </text>
 </svg>
 </div>

 {/* Embed code */}
 {showEmbed && (
 <div className="space-y-3">
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <label className="text-xs font-medium text-muted-foreground">HTML Embed Code</label>
 <CopyButton value={embedCode} variant="button" label="Copy Code" />
 </div>
 <textarea
 readOnly
 value={embedCode}
 rows={4}
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-xs font-mono outline-none resize-none"
 />
 </div>
 <p className="text-xs text-muted-foreground">
 Add this snippet to your website to display your security grade. The badge updates automatically after each scan.
 </p>
 </div>
 )}
 </div>
 );
}
