"use client";

import { useState, useEffect } from "react";
import { api, type ScanResult } from "@/lib/api-client";
import { ScanResultCard } from "@/components/scan/scan-result-card";
import { ScanResultSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-boundary";

export function PublicReportClient({ slug }: { slug: string }) {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadReport() {
    setLoading(true);
    const res = await api.getPublicReport(slug);
    if (res.data) {
      // Backend returns a Report object with scan_result as raw JSON
      // We need to map scan_result through our standard mapper
      const report = res.data;
      if (report.scan_result) {
        // Use the raw scan result from the report
        const mapped = mapRawScanResult(report.scan_result);
        setScan(mapped);
      } else {
        setError("No scan data in report");
      }
    } else {
      setError(res.error || "Report not found");
    }
    setLoading(false);
  }

  function mapRawScanResult(r: any): ScanResult {
    const toPercent = (v: number) => v <= 1 ? Math.round(v * 100) : Math.round(v);
    return {
      hash: r.url_hash || "",
      url: r.url || "",
      status: "complete",
      scanned_at: r.scanned_at || new Date().toISOString(),
      technologies: (r.tech_stack || []).map((t: any) => ({
        name: t.name, category: t.category, version: t.version, confidence: toPercent(t.confidence), icon: t.icon,
      })),
      security: {
        score: r.security?.score || 0, grade: r.security?.grade || "F",
        headers: (r.security?.headers || []).map((h: any) => ({ name: h.name, present: h.present, value: h.value })),
        issues: (r.security?.issues || []).map((i: string) => ({ severity: "medium" as const, title: i, description: i })),
      },
      seo: {
        score: r.seo?.score || 0, title: r.seo?.meta_title || "", description: r.seo?.meta_description || "",
        has_sitemap: r.seo?.has_sitemap || false, has_robots_txt: r.seo?.has_robots || false,
        has_structured_data: r.seo?.has_structured_data || false, has_canonical: !!r.seo?.canonical_url,
        h1_count: r.seo?.heading_structure?.h1 || 0, meta_issues: [],
      },
      company: r.company?.name ? {
        name: r.company.name, description: r.company.description || "", industry: r.company.industry || "",
        logo_url: r.company.logo, founded: r.company.founded, employee_range: r.company.employees_range, location: r.company.location,
      } : null,
      social_links: (r.social_links || []).map((s: any) => ({ platform: s.platform, url: s.url, followers: s.followers })),
      business_signals: [
        ...(r.business_signals?.has_pricing ? [{ type: "pricing", label: "Pricing Page", detail: "Has a pricing page", confidence: 100 }] : []),
        ...(r.business_signals?.has_careers ? [{ type: "careers", label: "Careers Page", detail: "Currently hiring", confidence: 100 }] : []),
        ...(r.business_signals?.ad_pixels || []).map((p: string) => ({ type: "ads", label: p, detail: `Uses ${p}`, confidence: 90 })),
        ...(r.business_signals?.chat_widgets || []).map((w: string) => ({ type: "chat", label: w, detail: `Uses ${w} for support`, confidence: 90 })),
        ...(r.business_signals?.payment_processors || []).map((p: string) => ({ type: "payment", label: p, detail: `Accepts payments via ${p}`, confidence: 90 })),
      ],
      traffic: r.traffic ? { tranco_rank: r.traffic.tranco_rank, traffic_tier: r.traffic.traffic_tier, estimated_monthly_visits: r.traffic.estimated_monthly_visits } : null,
      competitors: (r.competitors || []).map((c: any) => ({
        url: c.url, name: c.name || c.url, similarity_score: c.similarity_score <= 1 ? Math.round(c.similarity_score * 100) : Math.round(c.similarity_score), shared_tech: c.shared_technologies || [],
      })),
      cost_estimate: r.cost_estimate ? {
        total_min: r.cost_estimate.total_monthly_min, total_max: r.cost_estimate.total_monthly_max,
        breakdown: (r.cost_estimate.breakdown || []).map((b: any) => ({ category: b.category, min: b.min_monthly, max: b.max_monthly, detail: b.service })),
      } : null,
      ai_summary: r.ai_summary || "",
    };
  }

  if (loading) return <ScanResultSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!scan) return null;

  return <ScanResultCard scan={scan} />;
}
