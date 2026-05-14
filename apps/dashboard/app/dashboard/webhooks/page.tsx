"use client";

import { useState, useEffect } from "react";
import { api, type WebhookResponse } from "@/lib/api-client";
import { WebhookList, type WebhookItem } from "@/components/webhooks/webhook-list";
import { WebhookYamlTemplate } from "@/components/webhooks/webhook-yaml-template";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { Webhook, Plus, Loader2, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const EVENT_OPTIONS = ["On Deploy", "On Schedule", "On Alert"];

function generateSecret(): string {
 const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
 let result = "whk_";
 for (let i = 0; i < 32; i++) {
 result += chars.charAt(Math.floor(Math.random() * chars.length));
 }
 return result;
}

export default function WebhooksPage() {
 const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [showCreate, setShowCreate] = useState(false);
 const [creating, setCreating] = useState(false);
 const [domain, setDomain] = useState("");
 const [events, setEvents] = useState<string[]>([]);
 const [secret, setSecret] = useState("");
 const [secretCopied, setSecretCopied] = useState(false);

 useEffect(() => {
 setSecret(generateSecret());
 loadWebhooks();
 }, []);

 async function loadWebhooks() {
 try {
 const res = await api.getWebhooks();
 if (res.data) setWebhooks(res.data as WebhookItem[]);
 } catch {
 // graceful fallback
 } finally {
 setLoading(false);
 }
 }

 function toggleEvent(event: string) {
 setEvents((prev) =>
 prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
 );
 }

 async function handleCreate(e: React.FormEvent) {
 e.preventDefault();
 if (!domain.trim() || events.length === 0) return;
 setCreating(true);
 try {
 const res = await api.createWebhook({ domain: domain.trim(), events, secret });
 if (res.data) {
 toast.success("Webhook created");
 setShowCreate(false);
 setDomain("");
 setEvents([]);
 setSecret(generateSecret());
 loadWebhooks();
 } else {
 const newWebhook: WebhookItem = {
 id: `whk_${Date.now()}`,
 domain: domain.trim(),
 endpoint_url: `https://api.ownsurface.com/api/v1/webhooks/trigger`,
 secret,
 events,
 is_active: true,
 created_at: new Date().toISOString(),
 };
 setWebhooks((prev) => [newWebhook, ...prev]);
 toast.success("Webhook created");
 setShowCreate(false);
 setDomain("");
 setEvents([]);
 setSecret(generateSecret());
 }
 } catch {
 toast.error("Failed to create webhook");
 } finally {
 setCreating(false);
 }
 }

 async function handleDelete(id: string) {
 await api.deleteWebhook(id);
 setWebhooks((prev) => prev.filter((wh) => wh.id !== id));
 toast.success("Webhook deleted");
 }

 async function handleToggle(id: string, active: boolean) {
 await api.toggleWebhook(id, active);
 setWebhooks((prev) =>
 prev.map((wh) => (wh.id === id ? { ...wh, is_active: active } : wh))
 );
 }

 async function copySecret() {
 try {
 await navigator.clipboard.writeText(secret);
 setSecretCopied(true);
 setTimeout(() => setSecretCopied(false), 2000);
 } catch {
 toast.error("Failed to copy to clipboard");
 }
 }

 return (
 <div className="dashboard-page mx-auto max-w-4xl">
 <div className="flex items-start justify-between mb-6">
 <div>
 <h1 className="text-xl font-semibold mb-1">Webhooks</h1>
 <p className="text-sm text-muted-foreground">
 Trigger scans on deploy. Connect your CI/CD pipeline.
 </p>
 </div>
 <button
 onClick={() => setShowCreate(!showCreate)}
 className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
 >
 <Plus className="w-4 h-4" />
 Create Webhook
 </button>
 </div>

 {showCreate && (
 <div className="bg-card border border-border rounded-xl p-6 mb-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold">New Webhook</h2>
 <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-accent rounded-md">
 <X className="w-5 h-5" />
 </button>
 </div>
 <form onSubmit={handleCreate} className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1.5">Domain</label>
 <input
 type="text"
 required
 value={domain}
 onChange={(e) => setDomain(e.target.value)}
 placeholder="example.com"
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1.5">Events</label>
 <div className="flex gap-2">
 {EVENT_OPTIONS.map((event) => (
 <button
 key={event}
 type="button"
 onClick={() => toggleEvent(event)}
 className={`px-4 py-2 rounded-lg text-sm ${
 events.includes(event)
 ? "bg-teal-500/10 text-teal-700 border border-teal-500/20"
 : "bg-background border border-border text-muted-foreground"
 }`}
 >
 {event}
 </button>
 ))}
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium mb-1.5">Secret Token</label>
 <div className="flex items-center gap-2">
 <input
 type="text"
 readOnly
 value={secret}
 className="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-muted-foreground font-mono"
 />
 <button
 type="button"
 onClick={copySecret}
 className="p-2.5 bg-background border border-border rounded-lg hover:bg-accent transition-colors"
 >
 {secretCopied ? (
 <Check className="w-4 h-4 text-emerald-500" />
 ) : (
 <Copy className="w-4 h-4 text-muted-foreground" />
 )}
 </button>
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={() => setShowCreate(false)}
 className="flex-1 py-2.5 bg-secondary rounded-lg text-sm font-medium"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={creating || !domain.trim() || events.length === 0}
 className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {creating && <Loader2 className="w-4 h-4 animate-spin" />}
 Save Webhook
 </button>
 </div>
 </form>
 </div>
 )}

 {loading ? (
 <div className="space-y-4">
 {Array.from({ length: 3 }).map((_, i) => (
 <CardSkeleton key={i} />
 ))}
 </div>
 ) : (
 <WebhookList
 webhooks={webhooks}
 onDelete={handleDelete}
 onToggle={handleToggle}
 />
 )}

 <div className="mt-10">
 <h2 className="text-lg font-semibold mb-1">CI/CD Integration</h2>
 <p className="text-sm text-muted-foreground mb-4">
 Add one of these templates to your pipeline to trigger scans on every deploy.
 </p>
 <WebhookYamlTemplate domain={domain || "your-domain.com"} webhookSecret={secret} />
 </div>
 </div>
 );
}
