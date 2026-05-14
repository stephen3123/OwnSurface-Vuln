import Link from "next/link";
import { PublicPageSection, PublicPageShell } from "@/components/public/public-page-shell";
import { buildPageMetadata, siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Chrome Extension",
  description: "Public overview of the OwnSurface Chrome extension and how it fits into the website intelligence workflow.",
  path: siteConfig.publicRoutes.chromeExtension,
});

export default function ChromeExtensionPage() {
  return (
    <PublicPageShell
      eyebrow="Chrome extension"
      title="Run OwnSurface where the work already happens."
      description="The OwnSurface Chrome extension is built for operators who want to inspect a live page without leaving the browser. It complements the dashboard and API by making scans easier to trigger in context."
      summaryTitle="Extension overview"
      summaryItems={[
        { label: "Best for", value: "Page-in-context website intelligence" },
        { label: "Primary flow", value: "Open a page, trigger a scan, sync results to the workspace" },
        { label: "Availability", value: "Public install link not published in this pass" },
        { label: "Next step", value: "Create a workspace", href: "/register" },
      ]}
      summaryNote="This pass intentionally avoids a fake Chrome Web Store destination. Until a verified public listing exists, the extension is presented honestly as an access path tied to product onboarding."
    >
      <PublicPageSection title="What the extension does" eyebrow="01">
        <p>
          The extension lets users inspect a page they are already viewing and pull OwnSurface intelligence into the broader workspace workflow.
          It is designed to reduce context switching when reviewing competitors, pricing pages, docs portals, or owned properties.
        </p>
      </PublicPageSection>

      <PublicPageSection title="How it fits into the workflow" eyebrow="02">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Open the live page", "Stay on the page you are already researching instead of copying URLs into a separate flow."],
            ["Trigger the scan", "Collect website intelligence in context and send the result into the OwnSurface workspace."],
            ["Continue in the product", "Use the resulting scan for reports, watchlists, domain workflows, or team collaboration."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-[1.35rem] border border-border bg-card/50 p-5">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </PublicPageSection>

      <PublicPageSection title="Access and rollout" eyebrow="03">
        <p>
          A public Chrome Web Store listing is not linked from this page until a verified public release is available. In the meantime, the honest path is to create a workspace,
          evaluate product fit, and request extension access through the product onboarding flow.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ink))] px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Create workspace
          </Link>
          <Link
            href={siteConfig.publicRoutes.contact}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-foreground hover:border-teal-600/30 hover:text-teal-700"
          >
            Contact us
          </Link>
        </div>
      </PublicPageSection>
    </PublicPageShell>
  );
}
