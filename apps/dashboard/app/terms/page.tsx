import { PublicPageSection, PublicPageShell } from "@/components/public/public-page-shell";
import { buildPageMetadata, siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description: "Terms governing access to and use of OwnSurface, including accounts, API usage, subscriptions, and acceptable use.",
  path: siteConfig.publicRoutes.terms,
});

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Terms of service"
      title="Terms governing the use of OwnSurface."
      description="These terms explain the rules that apply when you access OwnSurface, create an account, use the API, or purchase a paid plan. OwnSurface is legally operated by AeonovX SIA."
      summaryTitle="Service terms"
      summaryItems={[
        { label: "Operator", value: siteConfig.companyName },
        { label: "Product", value: siteConfig.name },
        { label: "Contact", value: siteConfig.contactEmail, href: `mailto:${siteConfig.contactEmail}` },
        { label: "Effective date", value: siteConfig.lastUpdated },
      ]}
    >
      <PublicPageSection title="Acceptance and accounts" eyebrow="01">
        <p>
          By accessing or using OwnSurface, you agree to these Terms of Service. If you use OwnSurface on behalf of a company or organization,
          you represent that you have authority to bind that entity.
        </p>
        <p>
          You are responsible for keeping your account credentials and API keys secure, for activity under your account, and for ensuring that
          account information remains accurate.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Acceptable use and service boundaries" eyebrow="02">
        <p>OwnSurface is designed for lawful website intelligence, monitoring, and analysis of publicly accessible surfaces.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Do not use the service for unlawful access, unauthorized intrusion, or abusive automated activity.</li>
          <li>Do not attempt to interfere with the platform, bypass limits, or use the API in a way that harms availability or security.</li>
          <li>Do not submit content or targets that you are not permitted to inspect where authorization is required by law or contract.</li>
          <li>Do not misuse reports, exports, or scan output in ways that violate applicable law, third-party rights, or these terms.</li>
        </ul>
      </PublicPageSection>

      <PublicPageSection title="Plans, billing, and API usage" eyebrow="03">
        <p>
          Free and paid plans may include different usage limits, history windows, feature access, team capacity, and API allowances.
          Paid subscriptions renew according to the plan you select unless cancelled in accordance with the billing terms presented at checkout.
        </p>
        <p>
          If you receive API access, you must keep keys confidential and use them only for your authorized workflows. We may suspend or rotate API credentials
          if we detect abuse, compromise, or usage that threatens service stability.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Intellectual property, availability, and termination" eyebrow="04">
        <p>
          OwnSurface, its design, software, and service materials are owned by AeonovX SIA or its licensors. These terms do not transfer ownership of the platform.
        </p>
        <p>
          We may improve, change, suspend, or discontinue parts of the service at any time. We may suspend or terminate access if we reasonably believe these terms
          have been violated, if required by law, or if continued access creates security or operational risk.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Disclaimers, liability, and governing framework" eyebrow="05">
        <p>
          OwnSurface is provided on an "as is" and "as available" basis to the fullest extent permitted by law. Scan output is informational in nature and
          should be reviewed before operational or legal reliance.
        </p>
        <p>
          To the extent permitted by law, AeonovX SIA is not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits,
          data, goodwill, or business opportunity arising from use of the service.
        </p>
        <p>
          These terms are governed by the laws applicable to the legal operator of the service. Questions about these terms can be sent to{" "}
          <a className="font-semibold text-foreground hover:text-teal-700" href={`mailto:${siteConfig.contactEmail}`}>
            {siteConfig.contactEmail}
          </a>.
        </p>
      </PublicPageSection>
    </PublicPageShell>
  );
}
