"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface WebhookYamlTemplateProps {
 domain: string;
 webhookSecret?: string;
}

const TABS = ["GitHub Actions", "GitLab CI", "Bitbucket Pipelines"] as const;
type Tab = (typeof TABS)[number];

function getTemplate(tab: Tab, domain: string, secret: string): string {
 switch (tab) {
 case "GitHub Actions":
 return `name: OwnSurface Deploy Scan
on:
 push:
 branches: [main]
jobs:
 scan:
 runs-on: ubuntu-latest
 steps:
 - name: Trigger OwnSurface scan
 run: |
 curl -X POST https://api.ownsurface.com/api/v1/webhooks/trigger \\
 -H "Content-Type: application/json" \\
 -H "X-Webhook-Secret: \${{ secrets.OWNSURFACE_SECRET }}" \\
 -d '{"domain": "${domain}", "event": "deploy"}'`;

 case "GitLab CI":
 return `ownsurface-scan:
 stage: deploy
 script:
 - |
 curl -X POST https://api.ownsurface.com/api/v1/webhooks/trigger \\
 -H "Content-Type: application/json" \\
 -H "X-Webhook-Secret: $OWNSURFACE_SECRET" \\
 -d '{"domain": "${domain}", "event": "deploy"}'
 only:
 - main`;

 case "Bitbucket Pipelines":
 return `pipelines:
 branches:
 main:
 - step:
 name: Trigger OwnSurface Scan
 script:
 - |
 curl -X POST https://api.ownsurface.com/api/v1/webhooks/trigger \\
 -H "Content-Type: application/json" \\
 -H "X-Webhook-Secret: $OWNSURFACE_SECRET" \\
 -d '{"domain": "${domain}", "event": "deploy"}'`;
 }
}

export function WebhookYamlTemplate({ domain, webhookSecret }: WebhookYamlTemplateProps) {
 const [tab, setTab] = useState<Tab>("GitHub Actions");
 const [copied, setCopied] = useState(false);

 const template = getTemplate(tab, domain || "YOUR_DOMAIN", webhookSecret || "YOUR_SECRET");

 async function handleCopy() {
 try {
 await navigator.clipboard.writeText(template);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 } catch {
 // clipboard not available
 }
 }

 return (
 <div className="bg-card border border-border rounded-xl overflow-hidden">
 <div className="flex items-center gap-1 px-4 pt-4 pb-2">
 {TABS.map((t) => (
 <button
 key={t}
 onClick={() => setTab(t)}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
 tab === t
 ? "bg-teal-500/10 text-teal-700 border border-teal-500/20"
 : "text-muted-foreground hover:bg-accent"
 }`}
 >
 {t}
 </button>
 ))}
 </div>
 <div className="relative">
 <button
 onClick={handleCopy}
 className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 border border-border hover:bg-accent transition-colors"
 >
 {copied ? (
 <Check className="w-3.5 h-3.5 text-emerald-500" />
 ) : (
 <Copy className="w-3.5 h-3.5 text-muted-foreground" />
 )}
 </button>
 <pre className="px-4 pb-4 pt-2 text-xs leading-relaxed overflow-x-auto text-muted-foreground">
 <code>{template}</code>
 </pre>
 </div>
 </div>
 );
}
