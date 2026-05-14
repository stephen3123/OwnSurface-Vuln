import { PublicPageSection, PublicPageShell } from "@/components/public/public-page-shell";
import { buildPageMetadata, siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export const metadata = buildPageMetadata({
  title: "Cookie Notice",
  description: "Cookie and analytics notice for the OwnSurface marketing site and product surface.",
  path: siteConfig.publicRoutes.cookies,
});

export default function CookiesPage() {
  return (
    <PublicPageShell
      eyebrow="Cookie notice"
      title="How OwnSurface uses cookies and analytics technologies."
      description="This notice explains the limited use of cookies, local storage, and analytics technologies across the OwnSurface marketing site and product experience."
      summaryTitle="At a glance"
      summaryItems={[
        { label: "Core use", value: "Authentication and product operation" },
        { label: "Analytics", value: "Google Analytics only after consent" },
        { label: "Preference center", value: "Banner on public pages" },
        { label: "Questions", value: siteConfig.contactEmail, href: `mailto:${siteConfig.contactEmail}` },
      ]}
    >
      <PublicPageSection title="Categories of technologies" eyebrow="01">
        <p>OwnSurface may use browser storage and similar technologies for a small set of practical purposes:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Essential technologies used to authenticate users and keep product sessions working.</li>
          <li>Functional storage used to preserve product state and improve usability.</li>
          <li>Analytics technologies used on the public site to understand product traffic and page usage patterns.</li>
        </ul>
      </PublicPageSection>

      <PublicPageSection title="Google Analytics and public-site measurement" eyebrow="02">
        <p>
          The public marketing site loads Google Analytics only after a visitor opts in through the consent banner. When enabled, it may collect
          information such as page views, navigation paths, general device details, and approximate usage patterns.
        </p>
        <p>
          We use this information to understand how the public site is used and to improve messaging, structure, and performance.
        </p>
      </PublicPageSection>

      <PublicPageSection title="How to control cookies" eyebrow="03">
        <p>
          OwnSurface provides a cookie banner on public pages where you can accept analytics cookies, reject non-essential cookies, or manage preferences.
          You can also manage cookies and similar technologies using your browser controls, device settings, or supported browser extensions.
        </p>
        <p>
          Disabling essential technologies may affect sign-in and other core product functionality.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Updates and contact" eyebrow="04">
        <p>
          We may update this notice as the platform evolves, including when we introduce new public-site tooling or customer-facing controls.
          Material changes will be reflected on this page.
        </p>
        <p>
          For questions about cookies, analytics, or browser-storage behavior, contact{" "}
          <a className="font-semibold text-foreground hover:text-teal-700" href={`mailto:${siteConfig.contactEmail}`}>
            {siteConfig.contactEmail}
          </a>.
        </p>
      </PublicPageSection>
    </PublicPageShell>
  );
}
