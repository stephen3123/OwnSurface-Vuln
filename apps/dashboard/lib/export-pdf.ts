"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ScanResult, WatchlistChange } from "@/lib/api-client";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function severityColor(s: string): [number, number, number] {
  switch (s) {
    case "critical":
      return [220, 38, 38];
    case "high":
      return [234, 88, 12];
    case "medium":
      return [202, 138, 4];
    case "low":
      return [22, 163, 74];
    default:
      return [107, 114, 128];
  }
}

function scoreColor(score: number): [number, number, number] {
  if (score >= 80) return [16, 185, 129];
  if (score >= 50) return [245, 158, 11];
  return [239, 68, 68];
}

function bytes(n: number) {
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

function changeTypeLabel(ct: string) {
  return ct.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ------------------------------------------------------------------ */
/*  Brand watermark on every page                                     */
/* ------------------------------------------------------------------ */

const BRAND = "OwnSurface";
const BRAND_TAGLINE = "ownsurface.com";
const ACCENT: [number, number, number] = [13, 148, 136]; // teal-600

function addBrandHeader(doc: jsPDF, isFree: boolean) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const pages = (doc as any).getNumberOfPages() as number;

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);

    // Brand name — top right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...ACCENT);
    doc.text(BRAND, pw - 14, 12, { align: "right" });

    // Subtle tagline below
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(BRAND_TAGLINE, pw - 14, 16.5, { align: "right" });

    // Thin accent line across top
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.6);
    doc.line(14, 20, pw - 14, 20);

    // Page number bottom center
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Page ${i} of ${pages}`, pw / 2, ph - 8, { align: "center" });

    // Free plan diagonal watermark
    if (isFree) {
      const d = doc as any;
      d.saveGraphicsState();
      const gState = new d.GState({ opacity: 0.06 });
      d.setGState(gState);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(54);
      doc.setTextColor(107, 114, 128);

      // Rotate text diagonally across page center
      const cx = pw / 2;
      const cy = ph / 2;
      const angle = -35;
      const rad = (angle * Math.PI) / 180;

      doc.text("OwnSurface Free", cx, cy, {
        align: "center",
        angle,
      });

      // Smaller upsell line below
      doc.setFontSize(14);
      const offsetX = Math.sin(-rad) * 18;
      const offsetY = Math.cos(-rad) * 18;
      doc.text("Upgrade to Pro for clean exports \u2014 ownsurface.com/pricing", cx + offsetX, cy + offsetY, {
        align: "center",
        angle,
      });

      d.restoreGraphicsState();
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Section helpers                                                   */
/* ------------------------------------------------------------------ */

function sectionTitle(doc: jsPDF, y: number, label: string): number {
  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    y = 30;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text(label, 14, y);
  return y + 7;
}

function kv(
  doc: jsPDF,
  y: number,
  key: string,
  value: string,
  maxWidth = 170,
): number {
  if (y > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    y = 30;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(`${key}:`, 16, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(17, 24, 39);
  const lines = doc.splitTextToSize(value || "\u2014", maxWidth);
  doc.text(lines, 60, y);
  return y + lines.length * 4.5 + 2;
}

function bodyText(doc: jsPDF, y: number, text: string, indent = 16): number {
  if (y > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    y = 30;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  const pw = doc.internal.pageSize.getWidth();
  const lines: string[] = doc.splitTextToSize(text, pw - indent - 14);
  doc.text(lines, indent, y);
  return y + lines.length * 4.2 + 3;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 16) {
    doc.addPage();
    return 30;
  }
  return y;
}

/* ------------------------------------------------------------------ */
/*  Screenshot helper — load image as data URL                        */
/* ------------------------------------------------------------------ */

async function loadImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main scan PDF export                                              */
/* ------------------------------------------------------------------ */

export interface PdfExportOptions {
  /** User plan — "free" adds diagonal watermark, "pro" is clean */
  plan?: "free" | "pro";
}

export async function exportScanPdf(scan: ScanResult, options: PdfExportOptions = {}) {
  const isFree = options.plan !== "pro";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  let y = 28;

  /* ---- Cover header ---- */
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pw, 54, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(BRAND, 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text("Website Intelligence Report", 14, 25);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(hostname(scan.url), 14, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text(scan.url, 14, 44);
  doc.text(`Scanned ${fmtDate(scan.scanned_at)}`, 14, 50);

  y = 64;

  /* ---- Screenshot thumbnail (if available) ---- */
  if (scan.screenshot) {
    const imgData = await loadImageAsDataUrl(scan.screenshot);
    if (imgData) {
      try {
        const imgW = pw - 28;
        const imgH = imgW * 0.5625; // 16:9 aspect
        const availH = doc.internal.pageSize.getHeight() - y - 20;
        const finalH = Math.min(imgH, availH, 80);
        const finalW = finalH / 0.5625;
        const imgX = (pw - finalW) / 2;

        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.4);
        doc.roundedRect(imgX - 1, y - 1, finalW + 2, finalH + 2, 2, 2, "S");
        doc.addImage(imgData, "PNG", imgX, y, finalW, finalH);
        y += finalH + 8;
      } catch {
        // Image failed, skip
      }
    }
  }

  /* ---- Score cards row ---- */
  y = ensureSpace(doc, y, 30);
  const cards = [
    { label: "Security", value: `${scan.security.score}/100`, color: scoreColor(scan.security.score) },
    { label: "SEO", value: `${scan.seo.score}/100`, color: scoreColor(scan.seo.score) },
    { label: "Technologies", value: String(scan.technologies.length), color: ACCENT },
    { label: "Competitors", value: String(scan.competitors.length), color: ACCENT },
  ];

  const cardW = (pw - 28 - 12) / 4;
  cards.forEach((c, i) => {
    const x = 14 + i * (cardW + 4);
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(x, y, cardW, 22, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(c.label.toUpperCase(), x + cardW / 2, y + 7, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...c.color);
    doc.text(c.value, x + cardW / 2, y + 17, { align: "center" });
  });

  y += 30;

  /* ---- Executive summary ---- */
  if (scan.ai_summary) {
    y = sectionTitle(doc, y, "Executive Summary");
    y = bodyText(doc, y, scan.ai_summary);
    y += 3;
  }

  /* ---- Company info ---- */
  if (scan.company) {
    y = sectionTitle(doc, y, "Company");
    y = kv(doc, y, "Name", scan.company.name);
    if (scan.company.industry) y = kv(doc, y, "Industry", scan.company.industry);
    if (scan.company.description) y = kv(doc, y, "Description", scan.company.description);
    if (scan.company.employee_range) y = kv(doc, y, "Employees", scan.company.employee_range);
    if (scan.company.location) y = kv(doc, y, "Location", scan.company.location);
    y += 3;
  }

  /* ---- Technology stack ---- */
  if (scan.technologies.length > 0) {
    y = sectionTitle(doc, y, "Technology Stack");
    const techRows = scan.technologies.map((t) => [
      t.name,
      t.category || "\u2014",
      t.version || "\u2014",
      `${t.confidence}%`,
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Technology", "Category", "Version", "Confidence"]],
      body: techRows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---- Security headers ---- */
  y = sectionTitle(doc, y, "Security Headers");
  const headerRows = scan.security.headers.map((h) => [
    h.name,
    h.present ? "Present" : "Missing",
    h.value || "\u2014",
  ]);
  autoTable(doc, {
    startY: y,
    head: [["Header", "Status", "Value"]],
    body: headerRows,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
    headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell(data: any) {
      if (data.column.index === 1 && data.section === "body") {
        data.cell.styles.textColor =
          data.cell.raw === "Present" ? [22, 163, 74] : [220, 38, 38];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  /* ---- Security issues ---- */
  if (scan.security.issues.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "Security Issues");
    const issueRows = scan.security.issues.map((iss) => [
      iss.severity.toUpperCase(),
      iss.title,
      iss.description,
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Severity", "Title", "Description"]],
      body: issueRows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 45 } },
      didParseCell(data: any) {
        if (data.column.index === 0 && data.section === "body") {
          const sev = (data.cell.raw as string).toLowerCase();
          data.cell.styles.textColor = [...severityColor(sev)];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---- SEO analysis ---- */
  y = ensureSpace(doc, y, 30);
  y = sectionTitle(doc, y, "SEO Analysis");
  y = kv(doc, y, "Score", `${scan.seo.score}/100`);
  y = kv(doc, y, "Title", scan.seo.title || "\u2014");
  y = kv(doc, y, "Description", scan.seo.description || "\u2014");
  const seoChecks = [
    ["Sitemap", scan.seo.has_sitemap],
    ["robots.txt", scan.seo.has_robots_txt],
    ["Structured data", scan.seo.has_structured_data],
    ["Canonical", scan.seo.has_canonical],
  ] as const;
  seoChecks.forEach(([label, ok]) => {
    y = kv(doc, y, label, ok ? "Yes" : "No");
  });
  if (scan.seo.meta_issues.length > 0) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text("Meta issues:", 16, y);
    y += 5;
    scan.seo.meta_issues.forEach((issue) => {
      y = bodyText(doc, y, `- ${issue}`, 20);
    });
  }
  y += 4;

  /* ---- Social links ---- */
  if (scan.social_links.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "Social Links");
    const socialRows = scan.social_links.map((s) => [
      s.platform,
      s.url,
      s.followers != null ? String(s.followers) : "\u2014",
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Platform", "URL", "Followers"]],
      body: socialRows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---- Business signals ---- */
  if (scan.business_signals.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "Business Signals");
    const sigRows = scan.business_signals.map((s) => [
      s.type,
      s.label,
      s.detail,
      `${s.confidence}%`,
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Type", "Signal", "Detail", "Confidence"]],
      body: sigRows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---- Traffic ---- */
  if (scan.traffic) {
    y = ensureSpace(doc, y, 25);
    y = sectionTitle(doc, y, "Traffic");
    y = kv(doc, y, "Tier", scan.traffic.traffic_tier || "Unknown");
    if (scan.traffic.tranco_rank) y = kv(doc, y, "Tranco rank", String(scan.traffic.tranco_rank));
    if (scan.traffic.estimated_monthly_visits) y = kv(doc, y, "Est. monthly visits", scan.traffic.estimated_monthly_visits);
    y += 4;
  }

  /* ---- Competitors ---- */
  if (scan.competitors.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "Competitors");
    const compRows = scan.competitors.map((c) => [
      c.name,
      c.url,
      `${Math.round(c.similarity_score * 100)}%`,
      c.shared_tech.join(", ") || "\u2014",
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Name", "URL", "Similarity", "Shared Tech"]],
      body: compRows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---- Cost estimate ---- */
  if (scan.cost_estimate) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "Estimated Build Cost");
    y = kv(doc, y, "Total range", `$${scan.cost_estimate.total_min.toLocaleString()} \u2013 $${scan.cost_estimate.total_max.toLocaleString()}`);
    if (scan.cost_estimate.breakdown.length > 0) {
      const costRows = scan.cost_estimate.breakdown.map((b) => [
        b.category,
        `$${b.min.toLocaleString()} \u2013 $${b.max.toLocaleString()}`,
        b.detail,
      ]);
      autoTable(doc, {
        startY: y + 2,
        head: [["Category", "Range", "Detail"]],
        body: costRows,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
        headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  /* ---- Vulnerability ---- */
  if (scan.vulnerability) {
    const vuln = scan.vulnerability;

    if (vuln.cve_matches && vuln.cve_matches.cves.length > 0) {
      y = ensureSpace(doc, y, 20);
      y = sectionTitle(doc, y, "CVE Matches");
      const cveRows = vuln.cve_matches.cves.map((c) => [
        c.id,
        c.severity.toUpperCase(),
        String(c.score),
        c.technology,
        c.description.slice(0, 80) + (c.description.length > 80 ? "..." : ""),
      ]);
      autoTable(doc, {
        startY: y,
        head: [["CVE ID", "Severity", "Score", "Technology", "Description"]],
        body: cveRows,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [17, 24, 39] },
        headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        didParseCell(data: any) {
          if (data.column.index === 1 && data.section === "body") {
            const sev = (data.cell.raw as string).toLowerCase();
            data.cell.styles.textColor = [...severityColor(sev)];
            data.cell.styles.fontStyle = "bold";
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (vuln.sensitive_files && vuln.sensitive_files.exposed_files.length > 0) {
      y = ensureSpace(doc, y, 20);
      y = sectionTitle(doc, y, "Exposed Sensitive Files");
      const fileRows = vuln.sensitive_files.exposed_files.map((f) => [
        f.path,
        String(f.status),
        bytes(f.size),
        f.risk_level,
      ]);
      autoTable(doc, {
        startY: y,
        head: [["Path", "Status", "Size", "Risk"]],
        body: fileRows,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
        headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (vuln.dns_security) {
      y = ensureSpace(doc, y, 25);
      y = sectionTitle(doc, y, "DNS Security");
      y = kv(doc, y, "SPF", vuln.dns_security.spf.found ? `Found \u2014 ${vuln.dns_security.spf.policy}` : "Not found");
      y = kv(doc, y, "DMARC", vuln.dns_security.dmarc.found ? `Found \u2014 ${vuln.dns_security.dmarc.policy}` : "Not found");
      y = kv(doc, y, "DKIM", vuln.dns_security.dkim.found ? "Found" : "Not found");
      y = kv(doc, y, "DNSSEC", vuln.dns_security.dnssec.enabled ? "Enabled" : "Not enabled");
      y = kv(doc, y, "Score", `${vuln.dns_security.score}/100`);
      y += 4;
    }
  }

  /* ---- Privacy ---- */
  if (scan.privacy) {
    y = ensureSpace(doc, y, 25);
    y = sectionTitle(doc, y, "Privacy & Compliance");
    y = kv(doc, y, "Compliance score", `${scan.privacy.compliance_score}/100`);
    y = kv(doc, y, "Cookie banner", scan.privacy.has_cookie_banner ? "Yes" : "No");
    if (scan.privacy.banner_provider) y = kv(doc, y, "Banner provider", scan.privacy.banner_provider);
    y = kv(doc, y, "Tracking before consent", scan.privacy.tracking_before_consent ? "Yes" : "No");
    y = kv(doc, y, "Privacy policy", scan.privacy.has_privacy_policy ? "Found" : "Missing");
    y = kv(doc, y, "Terms of service", scan.privacy.has_terms ? "Found" : "Missing");
    if (scan.privacy.issues.length > 0) {
      y += 2;
      scan.privacy.issues.forEach((iss) => {
        y = bodyText(doc, y, `- ${iss}`, 20);
      });
    }
    y += 4;
  }

  /* ---- Carbon ---- */
  if (scan.carbon) {
    y = ensureSpace(doc, y, 25);
    y = sectionTitle(doc, y, "Carbon Footprint");
    y = kv(doc, y, "CO2 per visit", `${scan.carbon.co2_grams_per_visit.toFixed(3)} g`);
    y = kv(doc, y, "Grade", scan.carbon.sustainability_grade);
    y = kv(doc, y, "Green hosted", scan.carbon.is_green_hosted ? "Yes" : "No");
    if (scan.carbon.hosting_provider) y = kv(doc, y, "Host", scan.carbon.hosting_provider);
    y = kv(doc, y, "Cleaner than", `${scan.carbon.cleaner_than_percent}% of sites`);
    y = kv(doc, y, "Page weight", bytes(scan.carbon.page_weight_bytes));
    y = kv(doc, y, "Annual CO2", `${scan.carbon.annual_co2_kg.toFixed(2)} kg`);
    y += 4;
  }

  /* ---- Security findings / remediation ---- */
  if (scan.security_findings && scan.security_findings.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "Security Fixes & Remediation");
    const fixRows = scan.security_findings.map((f) => [
      f.severity.toUpperCase(),
      f.title,
      f.impact.slice(0, 70) + (f.impact.length > 70 ? "..." : ""),
      f.effort,
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Severity", "Finding", "Impact", "Effort"]],
      body: fixRows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      didParseCell(data: any) {
        if (data.column.index === 0 && data.section === "body") {
          const sev = (data.cell.raw as string).toLowerCase();
          data.cell.styles.textColor = [...severityColor(sev)];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---- Email patterns ---- */
  if (scan.email_patterns) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "Email Patterns");
    if (scan.email_patterns.pattern) y = kv(doc, y, "Pattern", scan.email_patterns.pattern);
    y = kv(doc, y, "Confidence", `${scan.email_patterns.confidence}%`);
    if (scan.email_patterns.found_emails.length > 0) {
      y = kv(doc, y, "Emails found", scan.email_patterns.found_emails.join(", "));
    }
    y += 4;
  }

  /* ---- Supply chain ---- */
  if (scan.supply_chain && scan.supply_chain.external_domains.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "Supply Chain");
    y = kv(doc, y, "Score", `${scan.supply_chain.score}/100`);
    y = kv(doc, y, "Total external", String(scan.supply_chain.total_external));
    y = kv(doc, y, "High risk", String(scan.supply_chain.high_risk_count));
    const chainRows = scan.supply_chain.external_domains.slice(0, 20).map((d) => [
      d.domain,
      d.type,
      d.risk_level,
      d.is_cdn ? "Yes" : "No",
      String(d.count),
    ]);
    autoTable(doc, {
      startY: y + 2,
      head: [["Domain", "Type", "Risk", "CDN", "Refs"]],
      body: chainRows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---- JS bundles ---- */
  if (scan.js_bundles && scan.js_bundles.scripts.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "JavaScript Bundles");
    y = kv(doc, y, "Total scripts", String(scan.js_bundles.total_scripts));
    y = kv(doc, y, "Total size", bytes(scan.js_bundles.total_size_bytes));
    const jsRows = scan.js_bundles.scripts.slice(0, 15).map((s) => {
      const name = s.url.split("/").pop() || s.url;
      return [name, bytes(s.size_bytes), s.has_source_map ? "Yes" : "No"];
    });
    autoTable(doc, {
      startY: y + 2,
      head: [["Script", "Size", "Source map"]],
      body: jsRows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---- API endpoints ---- */
  if (scan.api_endpoints && scan.api_endpoints.endpoints.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "API Endpoints Discovered");
    const apiRows = scan.api_endpoints.endpoints.slice(0, 20).map((e) => [
      e.path,
      e.type,
      String(e.status),
      e.accessible ? "Accessible" : "Blocked",
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Path", "Type", "Status", "Access"]],
      body: apiRows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---- Wayback ---- */
  if (scan.wayback && scan.wayback.available) {
    y = ensureSpace(doc, y, 25);
    y = sectionTitle(doc, y, "Wayback Machine History");
    if (scan.wayback.first_seen) y = kv(doc, y, "First seen", scan.wayback.first_seen);
    if (scan.wayback.last_seen) y = kv(doc, y, "Last seen", scan.wayback.last_seen);
    y = kv(doc, y, "Total captures", String(scan.wayback.total_captures));
    y += 4;
  }

  /* ---- Footer disclaimer ---- */
  y = ensureSpace(doc, y, 20);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(14, y, pw - 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Generated by ${BRAND} (${BRAND_TAGLINE}) on ${fmtDate(new Date().toISOString())}. Data reflects publicly visible information at scan time.`,
    14,
    y,
  );

  /* ---- Apply brand watermark to all pages ---- */
  addBrandHeader(doc, isFree);

  /* ---- Download ---- */
  doc.save(`${hostname(scan.url)}-ownsurface-report.pdf`);
}

/* ------------------------------------------------------------------ */
/*  Watchlist Diff PDF                                                */
/* ------------------------------------------------------------------ */

export interface DiffPdfOptions {
  domain: string;
  changes: WatchlistChange[];
  beforeScan?: ScanResult | null;
  afterScan?: ScanResult | null;
  plan?: "free" | "pro";
}

export function exportDiffPdf(opts: DiffPdfOptions) {
  const { domain, changes, beforeScan, afterScan, plan } = opts;
  const isFree = plan !== "pro";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();

  /* ---- Cover header ---- */
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pw, 50, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(BRAND, 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text("Change Detection Report", 14, 25);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(domain, 14, 37);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text(`Generated ${fmtDate(new Date().toISOString())}`, 14, 45);

  let y = 60;

  /* ---- Score comparison ---- */
  if (beforeScan && afterScan) {
    y = sectionTitle(doc, y, "Score Comparison");

    const metrics = [
      { label: "Security", before: beforeScan.security.score, after: afterScan.security.score },
      { label: "SEO", before: beforeScan.seo.score, after: afterScan.seo.score },
      { label: "Technologies", before: beforeScan.technologies.length, after: afterScan.technologies.length },
    ];

    if (beforeScan.privacy && afterScan.privacy) {
      metrics.push({ label: "Privacy", before: beforeScan.privacy.compliance_score, after: afterScan.privacy.compliance_score });
    }

    autoTable(doc, {
      startY: y,
      head: [["Metric", "Before", "After", "Change"]],
      body: metrics.map((m) => {
        const diff = m.after - m.before;
        const sign = diff > 0 ? "+" : "";
        return [m.label, String(m.before), String(m.after), `${sign}${diff}`];
      }),
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 3, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      didParseCell(data: any) {
        if (data.column.index === 3 && data.section === "body") {
          const raw = String(data.cell.raw);
          if (raw.startsWith("+")) {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = "bold";
          } else if (raw.startsWith("-")) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    /* ---- Tech diff ---- */
    const beforeTech = new Set(beforeScan.technologies.map((t) => t.name));
    const afterTech = new Set(afterScan.technologies.map((t) => t.name));
    const added = afterScan.technologies.filter((t) => !beforeTech.has(t.name));
    const removed = beforeScan.technologies.filter((t) => !afterTech.has(t.name));

    if (added.length > 0 || removed.length > 0) {
      y = sectionTitle(doc, y, "Technology Changes");
      const techDiffRows: string[][] = [];
      added.forEach((t) => techDiffRows.push(["+ ADDED", t.name, t.category || "\u2014", t.version || "\u2014"]));
      removed.forEach((t) => techDiffRows.push(["- REMOVED", t.name, t.category || "\u2014", t.version || "\u2014"]));

      autoTable(doc, {
        startY: y,
        head: [["Status", "Technology", "Category", "Version"]],
        body: techDiffRows,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
        headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
        didParseCell(data: any) {
          if (data.column.index === 0 && data.section === "body") {
            const raw = String(data.cell.raw);
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = raw.startsWith("+") ? [22, 163, 74] : [220, 38, 38];
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    /* ---- Security header diff ---- */
    const beforeHeaders = new Map(beforeScan.security.headers.map((h) => [h.name, h.present]));
    const headerChanges: string[][] = [];
    afterScan.security.headers.forEach((h) => {
      const was = beforeHeaders.get(h.name);
      if (was !== undefined && was !== h.present) {
        headerChanges.push([
          h.name,
          was ? "Present" : "Missing",
          h.present ? "Present" : "Missing",
          h.present ? "Fixed" : "Regressed",
        ]);
      }
    });

    if (headerChanges.length > 0) {
      y = ensureSpace(doc, y, 20);
      y = sectionTitle(doc, y, "Security Header Changes");
      autoTable(doc, {
        startY: y,
        head: [["Header", "Before", "After", "Status"]],
        body: headerChanges,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
        headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
        didParseCell(data: any) {
          if (data.column.index === 3 && data.section === "body") {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor =
              data.cell.raw === "Fixed" ? [22, 163, 74] : [220, 38, 38];
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  /* ---- Raw change log ---- */
  if (changes.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, y, "Change Log");
    const changeRows = changes.map((c) => [
      fmtDate(c.detected_at),
      changeTypeLabel(c.change_type),
      c.description,
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Date", "Type", "Description"]],
      body: changeRows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [17, 24, 39] },
      headStyles: { fillColor: [...ACCENT], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---- Footer ---- */
  y = ensureSpace(doc, y, 15);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(14, y, pw - 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Generated by ${BRAND} (${BRAND_TAGLINE}). Reflects changes detected between monitored scans.`,
    14,
    y,
  );

  addBrandHeader(doc, isFree);
  doc.save(`${domain}-ownsurface-diff-report.pdf`);
}
