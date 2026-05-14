"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Mail, MessageSquare, Webhook, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AlertPreferences {
 enabled: boolean;
 channels: { email: boolean; slack: boolean; webhook: boolean };
 thresholds: {
 security_score_drop: number;
 performance_score_drop: number;
 seo_score_drop: number;
 new_vulnerability: boolean;
 ssl_expiry_days: number;
 uptime_threshold: number;
 };
 slack_webhook_url?: string;
 webhook_url?: string;
}

interface AlertPreferencesFormProps {
 domain: string;
 onSave?: (prefs: AlertPreferences) => void;
}

const DEFAULT_PREFS: AlertPreferences = {
 enabled: true,
 channels: { email: true, slack: false, webhook: false },
 thresholds: {
 security_score_drop: 10,
 performance_score_drop: 15,
 seo_score_drop: 10,
 new_vulnerability: true,
 ssl_expiry_days: 14,
 uptime_threshold: 99,
 },
};

function getStorageKey(domain: string) {
 return `alert_prefs_${domain}`;
}

function Toggle({
 checked,
 onChange,
 label,
 icon: Icon,
}: {
 checked: boolean;
 onChange: (v: boolean) => void;
 label: string;
 icon?: React.ComponentType<{ className?: string }>;
}) {
 return (
 <button
 type="button"
 onClick={() => onChange(!checked)}
 className="flex items-center justify-between w-full py-2"
 >
 <span className="flex items-center gap-2 text-sm">
 {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
 {label}
 </span>
 <div
 className={cn(
 "relative h-5 w-9 rounded-full transition-colors",
 checked ? "bg-teal-500" : "bg-secondary",
 )}
 >
 <div
 className={cn(
 "absolute top-0.5 h-4 w-4 rounded-full bg-card transition-transform",
 checked ? "translate-x-4.5" : "translate-x-0.5",
 )}
 />
 </div>
 </button>
 );
}

export function AlertPreferencesForm({ domain, onSave }: AlertPreferencesFormProps) {
 const [prefs, setPrefs] = useState<AlertPreferences>(DEFAULT_PREFS);

 useEffect(() => {
 try {
 const stored = localStorage.getItem(getStorageKey(domain));
 if (stored) setPrefs(JSON.parse(stored));
 } catch {}
 }, [domain]);

 function update(partial: Partial<AlertPreferences>) {
 setPrefs((prev) => ({ ...prev, ...partial }));
 }

 function updateThreshold(key: keyof AlertPreferences["thresholds"], value: number | boolean) {
 setPrefs((prev) => ({
 ...prev,
 thresholds: { ...prev.thresholds, [key]: value },
 }));
 }

 function updateChannel(key: keyof AlertPreferences["channels"], value: boolean) {
 setPrefs((prev) => ({
 ...prev,
 channels: { ...prev.channels, [key]: value },
 }));
 }

 function handleSave() {
 localStorage.setItem(getStorageKey(domain), JSON.stringify(prefs));
 toast.success("Alert preferences saved");
 onSave?.(prefs);
 }

 return (
 <div className="shell-panel rounded-[1.7rem] p-6 space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-sm font-semibold">Alert Preferences</h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Configure regression alerts for {domain}
 </p>
 </div>
 {prefs.enabled ? (
 <Bell className="w-5 h-5 text-teal-400" />
 ) : (
 <BellOff className="w-5 h-5 text-muted-foreground" />
 )}
 </div>

 <Toggle
 checked={prefs.enabled}
 onChange={(v) => update({ enabled: v })}
 label="Enable alerts"
 />

 {prefs.enabled && (
 <>
 <div className="space-y-1">
 <p className="section-kicker">Channels</p>
 <div className="space-y-1">
 <Toggle checked={prefs.channels.email} onChange={(v) => updateChannel("email", v)} label="Email" icon={Mail} />
 <Toggle checked={prefs.channels.slack} onChange={(v) => updateChannel("slack", v)} label="Slack" icon={MessageSquare} />
 <Toggle checked={prefs.channels.webhook} onChange={(v) => updateChannel("webhook", v)} label="Webhook" icon={Webhook} />
 </div>
 </div>

 {prefs.channels.slack && (
 <div>
 <label className="block text-xs font-medium mb-1.5">Slack Webhook URL</label>
 <input
 type="url"
 value={prefs.slack_webhook_url || ""}
 onChange={(e) => update({ slack_webhook_url: e.target.value })}
 placeholder="https://hooks.slack.com/services/..."
 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 )}

 {prefs.channels.webhook && (
 <div>
 <label className="block text-xs font-medium mb-1.5">Webhook URL</label>
 <input
 type="url"
 value={prefs.webhook_url || ""}
 onChange={(e) => update({ webhook_url: e.target.value })}
 placeholder="https://api.yourservice.com/webhooks/..."
 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 )}

 <div className="space-y-4">
 <p className="section-kicker">Thresholds</p>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium mb-1.5">Security score drop (pts)</label>
 <input
 type="number"
 min={1}
 max={100}
 value={prefs.thresholds.security_score_drop}
 onChange={(e) => updateThreshold("security_score_drop", Number(e.target.value))}
 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 <div>
 <label className="block text-xs font-medium mb-1.5">Performance score drop (pts)</label>
 <input
 type="number"
 min={1}
 max={100}
 value={prefs.thresholds.performance_score_drop}
 onChange={(e) => updateThreshold("performance_score_drop", Number(e.target.value))}
 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 <div>
 <label className="block text-xs font-medium mb-1.5">SEO score drop (pts)</label>
 <input
 type="number"
 min={1}
 max={100}
 value={prefs.thresholds.seo_score_drop}
 onChange={(e) => updateThreshold("seo_score_drop", Number(e.target.value))}
 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 <div>
 <label className="block text-xs font-medium mb-1.5">SSL expiry warning (days)</label>
 <input
 type="number"
 min={1}
 max={90}
 value={prefs.thresholds.ssl_expiry_days}
 onChange={(e) => updateThreshold("ssl_expiry_days", Number(e.target.value))}
 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-medium mb-1.5">Uptime threshold (%)</label>
 <input
 type="number"
 min={50}
 max={100}
 step={0.1}
 value={prefs.thresholds.uptime_threshold}
 onChange={(e) => updateThreshold("uptime_threshold", Number(e.target.value))}
 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>

 <Toggle
 checked={prefs.thresholds.new_vulnerability}
 onChange={(v) => updateThreshold("new_vulnerability", v)}
 label="Alert on new vulnerabilities"
 />
 </div>
 </>
 )}

 <button
 onClick={handleSave}
 className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
 >
 <Save className="w-4 h-4" />
 Save Preferences
 </button>
 </div>
 );
}
