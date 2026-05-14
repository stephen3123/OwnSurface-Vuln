"use client";

import { useState, useEffect } from "react";
import { api, type ApiKey } from "@/lib/api-client";
import { CopyButton } from "@/components/shared/copy-button";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { maskApiKey, formatDate, formatNumber } from "@/lib/utils";
import { Key, Plus, Trash2, Loader2, X, AlertTriangle, Copy, Code, Terminal, ChevronDown, ChevronUp, Workflow, Shield, BarChart3, Layers } from "lucide-react";
import { toast } from "sonner";

export default function ApiKeysPage() {
 const [keys, setKeys] = useState<ApiKey[]>([]);
 const [loading, setLoading] = useState(true);
 const [showCreate, setShowCreate] = useState(false);
 const [keyName, setKeyName] = useState("");
 const [creating, setCreating] = useState(false);
 const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
 const [showDocs, setShowDocs] = useState(false);

 const apiBase = typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "/api/v1";

 useEffect(() => {
 loadKeys();
 }, []);

 async function loadKeys() {
 const res = await api.getApiKeys();
 if (res.data) setKeys(res.data);
 setLoading(false);
 }

 async function handleCreate(e: React.FormEvent) {
 e.preventDefault();
 if (!keyName.trim()) return;
 setCreating(true);
 const res = await api.createApiKey(keyName.trim());
 if (res.data) {
 setNewlyCreatedKey(res.data.key);
 setKeyName("");
 setShowCreate(false);
 loadKeys();
 } else {
 toast.error(res.error || "Failed to create key");
 }
 setCreating(false);
 }

 async function handleDelete(id: string) {
 if (!confirm("Are you sure you want to revoke this API key? This cannot be undone.")) return;
 const res = await api.deleteApiKey(id);
 if (!res.error) {
 setKeys((prev) => prev.filter((k) => k.id !== id));
 toast.success("API key revoked");
 } else {
 toast.error(res.error || "Failed to revoke key");
 }
 }

 return (
 <div className="dashboard-page mx-auto max-w-3xl">
 <div className="dashboard-toolbar-end">
 <button
 onClick={() => setShowCreate(true)}
 className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
 >
 <Plus className="w-4 h-4" />
 New Key
 </button>
 </div>

 {/* Newly created key warning */}
 {newlyCreatedKey && (
 <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
 <div className="flex-1">
 <h3 className="font-semibold text-yellow-400 mb-1">Save your API key now</h3>
 <p className="text-sm text-muted-foreground mb-3">
 This is the only time the full key will be shown. Copy it and store it securely.
 </p>
 <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border font-mono text-sm">
 <span className="flex-1 break-all">{newlyCreatedKey}</span>
 <CopyButton value={newlyCreatedKey} />
 </div>
 <button
 onClick={() => setNewlyCreatedKey(null)}
 className="mt-3 text-sm text-muted-foreground hover:text-foreground"
 >
 I&apos;ve saved it, dismiss
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Why use the API */}
 <div className="space-y-6">
 <div>
 <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Why use the API</p>
 <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
 Your API key gives you programmatic access to everything OwnSurface can do — scan websites, pull results, run bulk jobs, and pipe structured intelligence into your own systems. No browser needed.
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
 {[
 { icon: Workflow, title: "Automate scans in CI/CD", desc: "Scan every deploy target, staging URL, or client site as part of your pipeline." },
 { icon: Layers, title: "Bulk scan at scale", desc: "Feed 500 URLs into a single bulk job and get structured results for your entire portfolio." },
 { icon: Shield, title: "Security monitoring scripts", desc: "Schedule scans from cron jobs or serverless functions to track header changes, SSL issues, and new vulnerabilities." },
 { icon: BarChart3, title: "Build on top of OwnSurface", desc: "Pull scan data into internal dashboards, client reports, Slack bots, or any system that speaks HTTP." },
 ].map((item) => (
 <div key={item.title} className="flex items-start gap-3 py-2">
 <item.icon className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
 <div>
 <p className="text-sm font-medium">{item.title}</p>
 <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* API Usage Guide */}
 <div className="shell-panel rounded-[1.5rem] overflow-hidden">
 <button
 onClick={() => setShowDocs(!showDocs)}
 className="w-full flex items-center justify-between p-5 text-left hover:bg-accent/50 transition-colors"
 >
 <div className="flex items-center gap-3">
 <Code className="w-5 h-5 text-teal-500" />
 <div>
 <h3 className="font-semibold text-sm">How to use your API key</h3>
 <p className="text-xs text-muted-foreground mt-0.5">cURL, JavaScript, and Python examples</p>
 </div>
 </div>
 {showDocs ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
 </button>
 {showDocs && (
 <div className="px-5 pb-5 space-y-5 border-t border-border pt-5">
 <p className="text-sm text-muted-foreground">
 Pass your API key in the <code className="px-1.5 py-0.5 bg-accent rounded text-xs font-mono">X-Api-Key</code> header with every request.
 </p>

 {/* Scan a website */}
 <div>
 <div className="flex items-center gap-2 mb-2">
 <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scan a website</span>
 </div>
 <div className="relative group">
 <pre className="p-4 bg-[#0a0a0a] rounded-xl text-xs font-mono text-green-400 overflow-x-auto leading-relaxed">{`curl -X POST ${apiBase}/scan \\
 -H "X-Api-Key: YOUR_API_KEY" \\
 -H "Content-Type: application/json" \\
 -d '{"url": "example.com"}'`}</pre>
 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <CopyButton value={`curl -X POST ${apiBase}/scan \\\n -H "X-Api-Key: YOUR_API_KEY" \\\n -H "Content-Type: application/json" \\\n -d '{"url": "example.com"}'`} />
 </div>
 </div>
 </div>

 {/* Get scan result */}
 <div>
 <div className="flex items-center gap-2 mb-2">
 <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Get scan result</span>
 </div>
 <div className="relative group">
 <pre className="p-4 bg-[#0a0a0a] rounded-xl text-xs font-mono text-green-400 overflow-x-auto leading-relaxed">{`curl ${apiBase}/scan/SCAN_HASH \\
 -H "X-Api-Key: YOUR_API_KEY"`}</pre>
 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <CopyButton value={`curl ${apiBase}/scan/SCAN_HASH \\\n -H "X-Api-Key: YOUR_API_KEY"`} />
 </div>
 </div>
 </div>

 {/* JavaScript */}
 <div>
 <div className="flex items-center gap-2 mb-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">JavaScript / Node.js</span>
 </div>
 <div className="relative group">
 <pre className="p-4 bg-[#0a0a0a] rounded-xl text-xs font-mono text-blue-400 overflow-x-auto leading-relaxed">{`const res = await fetch("${apiBase}/scan", {
 method: "POST",
 headers: {
 "X-Api-Key": "YOUR_API_KEY",
 "Content-Type": "application/json",
 },
 body: JSON.stringify({ url: "example.com" }),
});
const data = await res.json();`}</pre>
 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <CopyButton value={`const res = await fetch("${apiBase}/scan", {\n method: "POST",\n headers: {\n "X-Api-Key": "YOUR_API_KEY",\n "Content-Type": "application/json",\n },\n body: JSON.stringify({ url: "example.com" }),\n});\nconst data = await res.json();`} />
 </div>
 </div>
 </div>

 {/* Python */}
 <div>
 <div className="flex items-center gap-2 mb-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Python</span>
 </div>
 <div className="relative group">
 <pre className="p-4 bg-[#0a0a0a] rounded-xl text-xs font-mono text-yellow-400 overflow-x-auto leading-relaxed">{`import requests

res = requests.post(
 "${apiBase}/scan",
 headers={"X-Api-Key": "YOUR_API_KEY"},
 json={"url": "example.com"},
)
print(res.json())`}</pre>
 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <CopyButton value={`import requests\n\nres = requests.post(\n "${apiBase}/scan",\n headers={"X-Api-Key": "YOUR_API_KEY"},\n json={"url": "example.com"},\n)\nprint(res.json())`} />
 </div>
 </div>
 </div>

 {/* Available endpoints */}
 <div>
 <div className="flex items-center gap-2 mb-3">
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available endpoints</span>
 </div>
 <div className="grid gap-2 text-xs">
 {[
 { method: "POST", path: "/scan", desc: "Scan a website" },
 { method: "GET", path: "/scan/{hash}", desc: "Get scan result" },
 { method: "GET", path: "/scan/recent", desc: "Recent scans" },
 { method: "POST", path: "/bulk", desc: "Bulk scan multiple URLs" },
 { method: "GET", path: "/bulk/{id}", desc: "Get bulk job status" },
 { method: "POST", path: "/enrich", desc: "Enrich domain data" },
 { method: "GET", path: "/history/{hash}", desc: "Scan history for a domain" },
 ].map((ep) => (
 <div key={ep.path} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-accent/50">
 <span className={`font-mono font-bold w-12 ${ep.method === "POST" ? "text-teal-500" : "text-blue-400"}`}>{ep.method}</span>
 <code className="font-mono text-foreground">/api/v1{ep.path}</code>
 <span className="text-muted-foreground ml-auto">{ep.desc}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Create dialog */}
 {showCreate && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold">Create API Key</h2>
 <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-accent rounded-md">
 <X className="w-5 h-5" />
 </button>
 </div>
 <form onSubmit={handleCreate} className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1.5">Key Name</label>
 <input
 type="text"
 required
 value={keyName}
 onChange={(e) => setKeyName(e.target.value)}
 placeholder="e.g., Production Server"
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => setShowCreate(false)}
 className="flex-1 py-2.5 bg-secondary rounded-lg text-sm font-medium"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={creating}
 className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {creating && <Loader2 className="w-4 h-4 animate-spin" />}
 Create
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Keys list */}
 {loading ? (
 <div className="space-y-3">
 {Array.from({ length: 3 }).map((_, i) => (
 <CardSkeleton key={i} />
 ))}
 </div>
 ) : keys.length === 0 ? (
 <div className="dashboard-empty">
 <Key className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
 <h3 className="font-semibold mb-1">No API keys</h3>
 <p className="text-sm text-muted-foreground mb-4">
 Create an API key to access OwnSurface programmatically.
 </p>
 <button
 onClick={() => setShowCreate(true)}
 className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium"
 >
 <Plus className="w-4 h-4" />
 Create Key
 </button>
 </div>
 ) : (
 <div className="shell-panel overflow-hidden rounded-[1.5rem] divide-y divide-border">
 {keys.map((key) => (
 <div key={key.id} className="flex items-center justify-between gap-4 p-4 sm:p-5">
 <div>
 <div className="flex items-center gap-2">
 <Key className="w-4 h-4 text-muted-foreground" />
 <span className="text-sm font-medium">{key.name}</span>
 </div>
 <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
 <span className="font-mono">{key.key_preview}</span>
 <span>Created {formatDate(key.created_at)}</span>
 <span>{formatNumber(key.requests_today)} requests today</span>
 {key.last_used_at && <span>Last used {formatDate(key.last_used_at)}</span>}
 </div>
 </div>
 <button
 onClick={() => handleDelete(key.id)}
 className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
 title="Revoke key"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
