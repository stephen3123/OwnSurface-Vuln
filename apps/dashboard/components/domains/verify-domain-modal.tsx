"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import { CopyButton } from "@/components/shared/copy-button";
import { toast } from "sonner";
import {
 Globe,
 Loader2,
 CheckCircle2,
 X,
 FileCode,
 Server,
} from "lucide-react";

interface VerifyDomainModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 onVerified: () => void;
}

type Step = "enter" | "method" | "instructions" | "verifying";
type VerificationMethod = "dns_txt" | "html_meta";

interface VerificationToken {
 token: string;
 domain_id: string;
}

export function VerifyDomainModal({ open, onOpenChange, onVerified }: VerifyDomainModalProps) {
 const [step, setStep] = useState<Step>("enter");
 const [domain, setDomain] = useState("");
 const [method, setMethod] = useState<VerificationMethod>("dns_txt");
 const [token, setToken] = useState<VerificationToken | null>(null);
 const [loading, setLoading] = useState(false);
 const [verifying, setVerifying] = useState(false);
 const [verified, setVerified] = useState(false);
 const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

 useEffect(() => {
 if (!open) {
 setStep("enter");
 setDomain("");
 setMethod("dns_txt");
 setToken(null);
 setLoading(false);
 setVerifying(false);
 setVerified(false);
 if (pollRef.current) clearInterval(pollRef.current);
 }
 }, [open]);

 async function handleSubmitDomain(e: React.FormEvent) {
 e.preventDefault();
 if (!domain.trim()) return;
 setStep("method");
 }

 async function handleSelectMethod() {
 setLoading(true);
 const res = await api.request<any>("/domains/verify", {
 method: "POST",
 body: JSON.stringify({ domain: domain.trim(), method }),
 });
 setLoading(false);
 // API returns { verification: { id, token, ... }, token, instructions }
 const verification = res.data?.verification || res.data;
 if (verification?.id || verification?.verification_token) {
 setToken({
 token: verification.verification_token || res.data?.token || "",
 domain_id: verification.id || "",
 });
 setStep("instructions");
 } else {
 toast.error(res.error || "Failed to start verification");
 }
 }

 async function handleCheckVerification() {
 if (!token) return;
 setVerifying(true);
 const res = await api.request<{ verified: boolean }>(`/domains/verify/${token.domain_id}/check`, {
 method: "POST",
 });
 if (res.data?.verified) {
 setVerified(true);
 setVerifying(false);
 toast.success("Domain verified successfully!");
 setTimeout(() => onVerified(), 1500);
 } else {
 setVerifying(false);
 toast.error("Verification not detected yet. Make sure the record is in place and try again.");
 }
 }

 if (!open) return null;

 const dnsRecord = token ? `xrayai-verify=${token.token}` : "";
 const htmlMeta = token
 ? `<meta name="xrayai-verify" content="${token.token}">`
 : "";

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4">
 <div className="flex items-center justify-between mb-5">
 <h2 className="text-lg font-semibold">Verify Domain</h2>
 <button
 onClick={() => onOpenChange(false)}
 className="p-1 hover:bg-accent rounded-md"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Step 1: Enter domain */}
 {step === "enter" && (
 <form onSubmit={handleSubmitDomain} className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1.5">Domain Name</label>
 <div className="relative">
 <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input
 type="text"
 required
 value={domain}
 onChange={(e) => setDomain(e.target.value)}
 placeholder="example.com"
 className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 autoFocus
 />
 </div>
 <p className="text-xs text-muted-foreground mt-1">
 Enter the root domain without protocol (e.g. example.com)
 </p>
 </div>
 <button
 type="submit"
 className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
 >
 Continue
 </button>
 </form>
 )}

 {/* Step 2: Choose method */}
 {step === "method" && (
 <div className="space-y-4">
 <p className="text-sm text-muted-foreground">
 Choose how to verify ownership of <span className="font-medium text-foreground">{domain}</span>
 </p>

 <div className="space-y-3">
 <button
 onClick={() => setMethod("dns_txt")}
 className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
 method === "dns_txt"
 ? "border-teal-500/40 bg-teal-500/5"
 : "border-border hover:border-teal-500/20"
 }`}
 >
 <Server className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium">DNS TXT Record</p>
 <p className="text-xs text-muted-foreground mt-0.5">
 Recommended for most users. Works with any hosting provider.
 </p>
 <div className={`mt-2.5 space-y-1.5 text-xs text-muted-foreground overflow-hidden transition-all ${method === "dns_txt" ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
 <p className="font-medium text-foreground/80">How it works:</p>
 <p>1. We&apos;ll give you a unique TXT record value</p>
 <p>2. Log in to your DNS provider (Cloudflare, Namecheap, GoDaddy, etc.)</p>
 <p>3. Add a new TXT record with the value we provide</p>
 <p>4. Click &quot;Check Verification&quot; — usually takes a few minutes</p>
 </div>
 </div>
 </button>

 <button
 onClick={() => setMethod("html_meta")}
 className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
 method === "html_meta"
 ? "border-teal-500/40 bg-teal-500/5"
 : "border-border hover:border-teal-500/20"
 }`}
 >
 <FileCode className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium">HTML Meta Tag</p>
 <p className="text-xs text-muted-foreground mt-0.5">
 Best if you have direct access to your site&apos;s HTML code.
 </p>
 <div className={`mt-2.5 space-y-1.5 text-xs text-muted-foreground overflow-hidden transition-all ${method === "html_meta" ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
 <p className="font-medium text-foreground/80">How it works:</p>
 <p>1. We&apos;ll give you a unique meta tag</p>
 <p>2. Paste it in the <code className="rounded bg-muted px-1 py-0.5 font-mono">&lt;head&gt;</code> section of your homepage</p>
 <p>3. Deploy the change so it&apos;s live on your site</p>
 <p>4. Click &quot;Check Verification&quot; — instant once deployed</p>
 </div>
 </div>
 </button>
 </div>

 <div className="flex gap-3 pt-2">
 <button
 onClick={() => setStep("enter")}
 className="flex-1 py-2.5 bg-secondary rounded-lg text-sm font-medium"
 >
 Back
 </button>
 <button
 onClick={handleSelectMethod}
 disabled={loading}
 className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {loading && <Loader2 className="w-4 h-4 animate-spin" />}
 Continue
 </button>
 </div>
 </div>
 )}

 {/* Step 3: Instructions */}
 {step === "instructions" && !verified && (
 <div className="space-y-4">
 {method === "dns_txt" ? (
 <>
 <div className="space-y-3">
 <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1 — Copy this TXT record value</p>
 <div className="relative bg-background border border-border rounded-lg p-3">
 <pre className="text-sm font-mono break-all whitespace-pre-wrap pr-10">
 {dnsRecord}
 </pre>
 <div className="absolute top-2 right-2">
 <CopyButton value={dnsRecord} />
 </div>
 </div>
 </div>

 <div className="space-y-2">
 <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2 — Add it to your DNS</p>
 <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2 text-xs text-muted-foreground">
 <p>1. Go to your DNS provider (Cloudflare, Namecheap, GoDaddy, Route 53, etc.)</p>
 <p>2. Navigate to <span className="font-medium text-foreground">DNS settings</span> for <span className="font-medium text-foreground">{domain}</span></p>
 <p>3. Add a new record: Type = <code className="rounded bg-muted px-1 py-0.5 font-mono">TXT</code>, Host = <code className="rounded bg-muted px-1 py-0.5 font-mono">@</code>, Value = the copied text above</p>
 <p>4. Save and come back here to verify</p>
 </div>
 </div>

 <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
 <p className="text-xs text-blue-400">
 <span className="font-semibold">Tip:</span> DNS changes usually propagate within 1–5 minutes.
 In rare cases it can take up to 48 hours. You can close this dialog and verify later from the Domains page.
 </p>
 </div>
 </>
 ) : (
 <>
 <div className="space-y-3">
 <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1 — Copy this meta tag</p>
 <div className="relative bg-background border border-border rounded-lg p-3">
 <pre className="text-sm font-mono break-all whitespace-pre-wrap pr-10">
 {htmlMeta}
 </pre>
 <div className="absolute top-2 right-2">
 <CopyButton value={htmlMeta} />
 </div>
 </div>
 </div>

 <div className="space-y-2">
 <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2 — Add it to your homepage</p>
 <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2 text-xs text-muted-foreground">
 <p>1. Open the HTML source of your homepage (<code className="rounded bg-muted px-1 py-0.5 font-mono">index.html</code> or your layout template)</p>
 <p>2. Paste the meta tag inside the <code className="rounded bg-muted px-1 py-0.5 font-mono">&lt;head&gt;</code> section, before the closing <code className="rounded bg-muted px-1 py-0.5 font-mono">&lt;/head&gt;</code></p>
 <p>3. Deploy the change so it&apos;s live at <span className="font-medium text-foreground">https://{domain}</span></p>
 <p>4. Come back here and click verify</p>
 </div>
 </div>

 <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
 <p className="text-xs text-blue-400">
 <span className="font-semibold">Tip:</span> Verification is instant once the tag is live.
 If using Next.js, add it to <code className="font-mono">layout.tsx</code>. For WordPress, use a &quot;Header Scripts&quot; plugin.
 </p>
 </div>
 </>
 )}

 <div className="flex gap-3 pt-2">
 <button
 onClick={() => setStep("method")}
 className="flex-1 py-2.5 bg-secondary rounded-lg text-sm font-medium"
 >
 Back
 </button>
 <button
 onClick={handleCheckVerification}
 disabled={verifying}
 className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
 Check Verification
 </button>
 </div>
 </div>
 )}

 {/* Verified */}
 {verified && (
 <div className="text-center py-6">
 <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
 <h3 className="text-lg font-semibold mb-1">Domain Verified!</h3>
 <p className="text-sm text-muted-foreground">
 <span className="font-medium text-foreground">{domain}</span> has been successfully verified.
 </p>
 </div>
 )}
 </div>
 </div>
 );
}
