import { PublicPageSection, PublicPageShell } from "@/components/public/public-page-shell";
import { buildPageMetadata, siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Security",
  description: "Security and responsible-disclosure overview for OwnSurface by AeonovX.",
  path: siteConfig.publicRoutes.security,
});

export default function SecurityPage() {
  return (
    <PublicPageShell
      eyebrow="Security"
      title="Security posture and responsible disclosure."
      description="OwnSurface is built for website intelligence and owned-domain monitoring, so trust and responsible handling matter. This page explains the service posture at a high level without overstating controls or certifications."
      summaryTitle="Security contact"
      summaryItems={[
        { label: "Disclosure channel", value: siteConfig.contactEmail, href: `mailto:${siteConfig.contactEmail}?subject=OwnSurface%20security%20report` },
        { label: "Operator", value: siteConfig.companyName },
        { label: "Scope", value: "Public web scanning and SaaS platform operations" },
        { label: "Approach", value: "Report responsibly and include reproducible detail" },
      ]}
    >
      <PublicPageSection title="Responsible disclosure" eyebrow="01">
        <p>
          If you believe you have identified a security issue affecting OwnSurface, contact{" "}
          <a className="font-semibold text-white hover:text-teal-400" href={`mailto:${siteConfig.contactEmail}?subject=OwnSurface%20security%20report`}>
            {siteConfig.contactEmail}
          </a>{" "}
          with a clear description, affected URLs or components, and reproducible details.
        </p>
        <p>
          Please do not exploit issues beyond what is reasonably necessary to demonstrate the problem, do not access data that is not yours,
          and do not take actions that impair service availability.
        </p>
      </PublicPageSection>

      <PublicPageSection title="How OwnSurface approaches public-site scanning" eyebrow="02">
        <p>
          OwnSurface is designed to inspect public-facing surfaces such as technology choices, headers, SEO signals, public endpoints,
          and externally visible security posture. It is not presented as a substitute for a formal penetration test or a guarantee of complete risk coverage.
        </p>
        <p>
          Users are responsible for ensuring their use of the service is lawful and appropriate for the targets they analyze. Where authorization is required,
          users must obtain it before running investigative workflows.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Account and platform safeguards" eyebrow="03">
        <p>
          OwnSurface uses account authentication, API keys, plan controls, and operational guardrails to protect access to workspaces and service resources.
          We also maintain logging and service controls intended to detect misuse, abuse, and operational instability.
        </p>
        <p>
          Because the product evolves over time, this page intentionally describes principles and practices at a high level rather than claiming a formal certification set that may not be independently verified.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Reporting expectations" eyebrow="04">
        <p>
          To help us respond efficiently, include affected pages or routes, steps to reproduce, the impact you believe exists, and any timing or environmental conditions required to observe the issue.
        </p>
        <p>
          If your report involves privacy or legal implications, note that clearly in the subject line so it can be routed appropriately.
        </p>
      </PublicPageSection>
    </PublicPageShell>
  );
}
