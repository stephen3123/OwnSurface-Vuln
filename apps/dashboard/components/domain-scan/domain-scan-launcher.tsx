"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { ScopeContractForm } from "@/components/offensive/scope-contract-form";
import {
 AlertTriangle,
 ArrowLeft,
 FileCode2,
 Loader2,
 Play,
 Shield,
 Swords,
 Upload,
} from "lucide-react";

export type DomainScanMode = "security" | "pentest" | "api";
type SpecInputMode = "paste" | "file" | "url";

const DEFAULT_PENTEST_SCOPE = {
 sqli_testing: true,
 xss_testing: true,
 csrf_testing: true,
 ssrf_testing: true,
 jwt_testing: true,
 auth_bypass_testing: true,
 deep_subdomain_enum: true,
 port_scan: true,
 deep_directory_bruteforce: true,
 cloud_bucket_check: true,
 secret_scanning: true,
 active_waf_detection: true,
 path_traversal: true,
 open_redirect_deep: true,
 idor_testing: true,
 rate_limit_testing: true,
 user_enumeration: true,
 session_testing: true,
 graphql_testing: true,
 api_fuzzing: true,
 xss_browser_verify: true,
 stored_xss_testing: true,
 content_type_manipulation: true,
 cross_page_scanning: true,
 csrf_xss_combo: true,
} as const;

const DEFAULT_API_SCOPE = {
 auth_bypass_testing: true,
 jwt_testing: true,
 ssrf_testing: true,
 idor_testing: true,
 rate_limit_testing: true,
 graphql_testing: true,
 api_fuzzing: true,
 content_type_manipulation: true,
} as const;

interface Domain {
 id: string;
 domain: string;
 verified: boolean;
}

interface ScopeContract {
 id: string;
 domain: string;
 expires_at: string;
}

const MODE_META: Record<DomainScanMode, { label: string; icon: typeof Shield; description: string }> = {
 security: {
  label: "Security Scan",
  icon: Shield,
  description: "Deep scan plus attack-surface findings for a verified domain.",
 },
 pentest: {
  label: "Pentest",
  icon: Swords,
  description: "Runs the full web-security stack with offensive testing enabled.",
 },
 api: {
  label: "API Security",
  icon: FileCode2,
  description: "Tests an OpenAPI or Swagger spec with the unified API-security flow.",
 },
};

const MODE_INTRO: Record<DomainScanMode, string> = {
 security: "Launch a verified-domain security scan with deep scan and attack-surface coverage.",
 pentest: "Launch the unified pentest workflow with offensive testing for a verified domain.",
 api: "Launch API Security against an OpenAPI or Swagger specification under the shared web workflow.",
};

const RATE_LIMITS = [
 { value: "conservative", label: "Conservative" },
 { value: "moderate", label: "Moderate" },
 { value: "aggressive", label: "Aggressive" },
] as const;

export function DomainScanLauncher({ initialMode }: { initialMode: DomainScanMode }) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const requestedDomain = searchParams.get("domain");
 const mode = initialMode;
 const modeMeta = MODE_META[mode];
 const ModeIcon = modeMeta.icon;

 const [domains, setDomains] = useState<Domain[]>([]);
 const [contracts, setContracts] = useState<ScopeContract[]>([]);
 const [selectedDomain, setSelectedDomain] = useState("");
 const [rateLimit, setRateLimit] = useState("moderate");
 const [loading, setLoading] = useState(true);
 const [starting, setStarting] = useState(false);
 const [showContractForm, setShowContractForm] = useState(false);
 const [specInputMode, setSpecInputMode] = useState<SpecInputMode>("paste");
 const [specContent, setSpecContent] = useState("");
 const [specUrl, setSpecUrl] = useState("");
 const [specFile, setSpecFile] = useState<File | null>(null);

 const loadData = useCallback(async () => {
  const [domainsRes, contractsRes] = await Promise.all([
   api.getDomains(),
   api.request<{ contracts: ScopeContract[] }>("/offensive-scan/scope-contracts"),
  ]);

  const verifiedDomains = (domainsRes.data || []).filter((domain) => domain.verified);
  setDomains(verifiedDomains);
  setContracts(contractsRes.data?.contracts || []);

  if (verifiedDomains.length > 0) {
   const matchingDomain = requestedDomain
    ? verifiedDomains.find((domain) => domain.domain === requestedDomain)
    : null;
   setSelectedDomain(matchingDomain?.domain || verifiedDomains[0].domain);
  }

  setLoading(false);
 }, [requestedDomain]);

 useEffect(() => {
  loadData().catch(() => {
   toast.error("Failed to load verified domains");
   setLoading(false);
  });
 }, [loadData]);

 const activeContract = useMemo(
  () =>
   contracts.find(
    (contract) =>
     contract.domain === selectedDomain && new Date(contract.expires_at).getTime() > Date.now(),
   ),
  [contracts, selectedDomain],
 );

 const getSpecValue = useCallback(async () => {
  if (specInputMode === "paste") return specContent.trim();
  if (specInputMode === "url") return specUrl.trim();
  if (specInputMode === "file" && specFile) return (await specFile.text()).trim();
  return "";
 }, [specContent, specFile, specInputMode, specUrl]);

 async function handleStart() {
  if (!selectedDomain) {
   toast.error("Select a verified domain first");
   return;
  }

  if (mode === "pentest" && !activeContract) {
   setShowContractForm(true);
   return;
  }

  setStarting(true);

  try {
   const payload: {
    domain: string;
    mode: DomainScanMode;
    rate_limit: string;
    scope?: Record<string, boolean>;
    scope_contract_id?: string;
    spec_content?: string;
   } = {
    domain: selectedDomain,
    mode,
    rate_limit: rateLimit,
   };

   if (mode === "pentest" && activeContract) {
    payload.scope = { ...DEFAULT_PENTEST_SCOPE };
    payload.scope_contract_id = activeContract.id;
   }

   if (mode === "api") {
    const spec = await getSpecValue();
    if (!spec) {
      toast.error("Add an API specification before starting API Security");
      setStarting(false);
      return;
    }
    payload.scope = { ...DEFAULT_API_SCOPE };
    payload.spec_content = spec;
   }

   const res = await api.startDomainScan(payload);
   const scanId = res.data?.scan?.id;

   if (!scanId) {
    toast.error(res.error || "Failed to start Web Security scan");
    setStarting(false);
    return;
   }

   router.push(`/dashboard/domain-scan/${scanId}/scanning`);
  } catch {
   toast.error("Failed to start Web Security scan");
  } finally {
   setStarting(false);
  }
 }

 if (loading) {
  return (
   <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
   </div>
  );
 }

 return (
  <div className="dashboard-page mx-auto max-w-5xl space-y-8">
   <div className="space-y-3">
   <Link
     href="/dashboard/domain-scan"
     className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
     <ArrowLeft className="h-4 w-4" />
     Back to Web Security
    </Link>
    <p className="max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground font-medium">
     {MODE_INTRO[mode]}
    </p>
   </div>

   <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-5">
    <div className="flex items-start gap-4">
     <div className="rounded-xl bg-background/80 p-3">
      <ModeIcon className="h-5 w-5 text-teal-600" />
     </div>
     <div className="space-y-1">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Selected Workflow</p>
      <h2 className="text-xl font-semibold text-foreground">{modeMeta.label}</h2>
      <p className="max-w-2xl text-sm text-muted-foreground">{modeMeta.description}</p>
     </div>
    </div>
   </div>

   <div className="rounded-xl border border-border/40 bg-card/50 p-6">
    {domains.length === 0 ? (
     <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
      <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-amber-500" />
      <h2 className="text-lg font-medium text-foreground">No verified domains</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
       Web Security requires a verified domain. Verify one in the Domains section, then come back here to launch the unified flow.
      </p>
      <Link
       href="/dashboard/domains"
       className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-foreground/90"
      >
       Go to Domains
      </Link>
     </div>
    ) : (
     <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
       <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Verified Domain</label>
        <select
         value={selectedDomain}
         onChange={(event) => setSelectedDomain(event.target.value)}
         className="w-full rounded-xl border border-border/40 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20"
        >
         {domains.map((domain) => (
          <option key={domain.id} value={domain.domain}>
           {domain.domain}
          </option>
         ))}
        </select>
       </div>

       <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Rate Limit</label>
        <select
         value={rateLimit}
         onChange={(event) => setRateLimit(event.target.value)}
         className="w-full rounded-xl border border-border/40 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20"
        >
         {RATE_LIMITS.map((option) => (
          <option key={option.value} value={option.value}>
           {option.label}
          </option>
         ))}
        </select>
       </div>
      </div>

      {mode === "pentest" && (
       <div className="rounded-xl border border-border/40 bg-background/60 p-5">
        {showContractForm ? (
         <ScopeContractForm
          domain={selectedDomain}
          onContractSigned={(contractId) => {
           setContracts((current) => [
            {
             id: contractId,
             domain: selectedDomain,
             expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            ...current,
           ]);
           setShowContractForm(false);
          }}
          onCancel={() => setShowContractForm(false)}
         />
        ) : (
         <div className="space-y-3">
          <div>
           <h3 className="text-sm font-medium text-foreground">Scope Contract</h3>
           <p className="mt-1 text-sm text-muted-foreground">
            Pentest mode requires an active scope contract for the selected domain.
           </p>
          </div>
          {activeContract ? (
           <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700">
            Active contract on file until {new Date(activeContract.expires_at).toLocaleDateString()}.
           </div>
          ) : (
           <button
            onClick={() => setShowContractForm(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border/50 px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
           >
            Set scope contract
           </button>
          )}
         </div>
        )}
       </div>
      )}

      {mode === "api" && (
       <div className="space-y-3 rounded-xl border border-border/40 bg-background/60 p-5">
        <div>
         <h3 className="text-sm font-medium text-foreground">API Specification</h3>
         <p className="mt-1 text-sm text-muted-foreground">
          Paste a spec, upload a file, or point to a URL. The unified API Security flow will use it as the source of truth.
         </p>
        </div>

        <div className="flex flex-wrap gap-2">
         {(["paste", "file", "url"] as const).map((value) => (
          <button
           key={value}
           onClick={() => setSpecInputMode(value)}
           className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            specInputMode === value
             ? "bg-teal-500/10 text-teal-700"
             : "bg-background text-muted-foreground hover:text-foreground"
           }`}
          >
           {value === "paste" ? "Paste" : value === "file" ? "Upload file" : "URL"}
          </button>
         ))}
        </div>

        {specInputMode === "paste" && (
         <textarea
          value={specContent}
          onChange={(event) => setSpecContent(event.target.value)}
          placeholder="Paste your OpenAPI or Swagger YAML/JSON here..."
          className="h-44 w-full rounded-xl border border-border/40 bg-background px-4 py-3 font-mono text-xs text-foreground outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20"
         />
        )}

        {specInputMode === "url" && (
         <input
          type="url"
          value={specUrl}
          onChange={(event) => setSpecUrl(event.target.value)}
          placeholder="https://api.example.com/openapi.yaml"
          className="w-full rounded-xl border border-border/40 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20"
         />
        )}

        {specInputMode === "file" && (
         <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border/50 px-6 py-8 text-center">
          <Upload className="mb-3 h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground">
           {specFile ? specFile.name : "Drop a YAML or JSON file here or click to browse"}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">Accepted: `.yaml`, `.yml`, `.json`</span>
          <input
           type="file"
           accept=".yaml,.yml,.json"
           onChange={(event) => setSpecFile(event.target.files?.[0] || null)}
           className="hidden"
          />
         </label>
        )}
       </div>
      )}

      <button
       onClick={handleStart}
       disabled={starting || !selectedDomain}
       className="inline-flex items-center gap-3 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
      >
       {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
       {starting ? "Starting..." : `Start ${modeMeta.label}`}
      </button>
     </div>
    )}
   </div>
  </div>
 );
}
