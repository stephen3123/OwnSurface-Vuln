import { PublicPageSection, PublicPageShell } from "@/components/public/public-page-shell";
import { buildPageMetadata, siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Legal Notice",
  description: "Corporate and legal notice for OwnSurface, operated by AeonovX SIA.",
  path: siteConfig.publicRoutes.legal,
});

export default function LegalPage() {
  return (
    <PublicPageShell
      eyebrow="Legal notice"
      title="Corporate notice for OwnSurface by AeonovX."
      description="This page identifies the legal operator of OwnSurface and provides company and contact information for corporate, legal, and compliance inquiries."
      summaryTitle="Registered operator"
      summaryItems={[
        { label: "Company", value: siteConfig.companyName },
        { label: "Registration", value: siteConfig.registrationNumber },
        { label: "Location", value: siteConfig.location },
        { label: "Contact", value: siteConfig.contactEmail, href: `mailto:${siteConfig.contactEmail}` },
      ]}
    >
      <PublicPageSection title="Operator statement" eyebrow="01">
        <p>
          OwnSurface is a website intelligence product legally operated by {siteConfig.companyName}. The public marketing site and the
          OwnSurface product experience are provided under that operating entity.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Company information" eyebrow="02">
        <p><strong className="text-foreground">Legal entity:</strong> {siteConfig.companyName}</p>
        <p><strong className="text-foreground">Registration number:</strong> {siteConfig.registrationNumber}</p>
        <p><strong className="text-foreground">Operations base:</strong> {siteConfig.location}</p>
        <p><strong className="text-foreground">Company site:</strong> <a className="font-semibold text-foreground hover:text-teal-700" href={siteConfig.operatorUrl}>{siteConfig.operatorUrl}</a></p>
      </PublicPageSection>

      <PublicPageSection title="Contact channels" eyebrow="03">
        <p>
          Legal, compliance, privacy, partnership, and company communications can be directed to{" "}
          <a className="font-semibold text-foreground hover:text-teal-700" href={`mailto:${siteConfig.contactEmail}`}>
            {siteConfig.contactEmail}
          </a>.
        </p>
      </PublicPageSection>
    </PublicPageShell>
  );
}
