import { PublicPageSection, PublicPageShell } from "@/components/public/public-page-shell";
import { buildPageMetadata, siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Contact",
  description: "Contact OwnSurface by AeonovX for product, partnerships, commercial, press, legal, or privacy inquiries.",
  path: siteConfig.publicRoutes.contact,
});

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "OwnSurface Contact",
  url: `${siteConfig.url}${siteConfig.publicRoutes.contact}`,
  publisher: {
    "@type": "Organization",
    name: siteConfig.companyName,
    email: siteConfig.contactEmail,
  },
};

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Contact"
      title="Reach the team behind OwnSurface."
      description="OwnSurface is operated by AeonovX SIA. Use this page for product questions, strategic partnerships, enterprise conversations, press, or legal and privacy notices."
      summaryTitle="Primary contact"
      summaryItems={[
        { label: "Email", value: siteConfig.contactEmail, href: `mailto:${siteConfig.contactEmail}` },
        { label: "Operator", value: siteConfig.companyName },
        { label: "Location", value: siteConfig.location },
        { label: "Best for", value: "Product, partnerships, legal, privacy" },
      ]}
      summaryNote="This pass intentionally uses direct email contact instead of a public form so every route is real and trustworthy."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }} />

      <PublicPageSection title="Inquiry types" eyebrow="01">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Product and onboarding",
              body: "Questions about using OwnSurface, evaluating fit, or getting started with scans, reports, and workspace setup.",
              subject: "OwnSurface%20product%20inquiry",
            },
            {
              title: "Partnerships and commercial",
              body: "Strategic partnerships, enterprise interest, agency rollouts, reseller conversations, or platform collaborations.",
              subject: "OwnSurface%20commercial%20inquiry",
            },
            {
              title: "Press and general company",
              body: "General AeonovX or OwnSurface inquiries, introductions, media conversations, or company-level coordination.",
              subject: "OwnSurface%20general%20inquiry",
            },
            {
              title: "Legal and privacy",
              body: "Privacy requests, compliance notices, legal correspondence, or policy-related questions.",
              subject: "OwnSurface%20legal%20or%20privacy%20request",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-black/40 backdrop-blur-md border border-white/10 card-lift p-5">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/60">{item.body}</p>
              <a
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/90 hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                href={`mailto:${siteConfig.contactEmail}?subject=${item.subject}`}
              >
                Email this inquiry
              </a>
            </div>
          ))}
        </div>
      </PublicPageSection>

      <PublicPageSection title="What to include" eyebrow="02">
        <p>For faster routing, include the following in your message where relevant:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Your name, company, and the best reply address.</li>
          <li>Whether the inquiry is product, commercial, partnership, press, legal, or privacy related.</li>
          <li>Relevant URLs, workspace context, and whether the note concerns public-site scanning, API usage, or subscriptions.</li>
          <li>Any timeline or urgency if the request needs a response window.</li>
        </ul>
      </PublicPageSection>
    </PublicPageShell>
  );
}
