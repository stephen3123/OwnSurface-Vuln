"use client";

import { useState, useEffect } from "react";
import { Scale, X } from "lucide-react";

interface LegalDisclaimerProps {
 className?: string;
}

const STORAGE_KEY = "compliance-disclaimer-dismissed";

export function LegalDisclaimer({ className }: LegalDisclaimerProps) {
 const [dismissed, setDismissed] = useState(true);

 useEffect(() => {
 setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
 }, []);

 function handleDismiss() {
 setDismissed(true);
 localStorage.setItem(STORAGE_KEY, "true");
 }

 if (dismissed) return null;

 return (
 <div className={`flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 ${className ?? ""}`}>
 <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
 <p className="flex-1 text-xs text-amber-300/80">
 This compliance analysis is for informational purposes only and does not constitute legal advice.
 Consult with a qualified legal professional for compliance requirements specific to your organization.
 </p>
 <button onClick={handleDismiss} className="shrink-0 text-amber-400/60 hover:text-amber-400 transition-colors">
 <X className="h-3.5 w-3.5" />
 </button>
 </div>
 );
}
