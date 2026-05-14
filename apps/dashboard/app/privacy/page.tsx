import { PublicPageSection, PublicPageShell } from "@/components/public/public-page-shell";
import { buildPageMetadata, siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "How OwnSurface by AeonovX collects, uses, stores, and protects personal data and scan-related information.",
  path: siteConfig.publicRoutes.privacy,
});

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy policy"
      title="Privacy and data handling for OwnSurface."
      description="OwnSurface is a website intelligence platform operated by AeonovX SIA. This policy explains what data we process, why we process it, how long we retain it, and how to reach us about privacy-related questions."
      summaryTitle="Controller details"
      summaryItems={[
        { label: "Service", value: siteConfig.operatorLabel },
        { label: "Legal operator", value: siteConfig.companyName },
        { label: "Registration", value: `Reg. No. ${siteConfig.registrationNumber}` },
        { label: "Contact", value: siteConfig.contactEmail, href: `mailto:${siteConfig.contactEmail}` },
      ]}
      summaryNote={`Last updated ${siteConfig.lastUpdated}. This page should be reviewed by counsel before a production legal sign-off.`}
    >
      <PublicPageSection title="Overview" eyebrow="01">
        <p>
          AeonovX SIA operates OwnSurface and acts as the legal operator for the service. When this policy refers to
          {" "}“we”, “us”, or “OwnSurface”, it means the OwnSurface product and AeonovX SIA acting as its legal operator.
        </p>
        <p>
          OwnSurface is designed to help users scan and monitor publicly accessible websites. In providing that service,
          we may process account information, billing information, scan inputs, scan outputs, and support communications.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Data we collect" eyebrow="02">
        <p>Depending on how you use the service, we may collect and process the following categories of information:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account and identity data such as name, email address, authentication details, and team membership.</li>
          <li>Usage and operational data such as scan requests, submitted URLs, watchlists, reports, API key metadata, and audit events.</li>
          <li>Billing and commercial data needed to manage subscriptions, invoices, and payment-related events.</li>
          <li>Support and communications data when you contact us, request help, or discuss partnerships or enterprise use.</li>
          <li>Website analytics and device data on the public marketing site, including analytics technologies such as Google Analytics when enabled.</li>
        </ul>
      </PublicPageSection>

      <PublicPageSection title="How we use information" eyebrow="03">
        <p>We use personal and operational data to provide and improve OwnSurface, including to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and secure accounts, authenticate users, and manage workspace access.</li>
          <li>Run scans, render results, maintain history, create reports, and power monitoring or watchlist workflows.</li>
          <li>Operate subscriptions, plan limits, and service communications.</li>
          <li>Detect abuse, secure the platform, investigate incidents, and enforce our Terms of Service.</li>
          <li>Measure product performance and improve the public website and product experience.</li>
        </ul>
      </PublicPageSection>

      <PublicPageSection title="Sharing, processors, and retention" eyebrow="04">
        <p>
          We may use third-party service providers for hosting, analytics, authentication, payments, infrastructure monitoring,
          and operational communications. These providers only receive the information needed to perform their role for OwnSurface.
        </p>
        <p>
          We do not sell personal information. We may disclose information when required by law, to protect the service, to
          investigate misuse, or as part of a legitimate corporate transaction involving the service or operator.
        </p>
        <p>
          We retain information for as long as needed to operate the service, honor contractual obligations, maintain product history,
          resolve disputes, and meet legal or security obligations. Retention periods vary based on the type of information and how the service is used.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Rights, cookies, and contact" eyebrow="05">
        <p>
          Depending on applicable law, you may have rights to access, correct, delete, restrict, or object to the processing of your data.
          You may also have the right to request a copy of certain information.
        </p>
        <p>
          OwnSurface uses functional technologies necessary for authentication and core product operation. The public website may also use
          analytics technologies, including Google Analytics, but only after consent is provided through the banner on public pages. Consent choices are stored in a cookie so the site can remember your selection.
        </p>
        <p>
          For privacy requests, legal notices, or questions about this policy, contact us at{" "}
          <a className="font-semibold text-foreground hover:text-teal-700" href={`mailto:${siteConfig.contactEmail}`}>
            {siteConfig.contactEmail}
          </a>.
        </p>
      </PublicPageSection>
    </PublicPageShell>
  );
}
