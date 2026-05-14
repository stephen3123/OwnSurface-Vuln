import Link from "next/link";
import { PublicPageSection, PublicPageShell } from "@/components/public/public-page-shell";
import { buildPageMetadata, siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Developers — API & MCP Server",
  description: "Integrate OwnSurface into your stack via REST API or connect it to Claude, Cursor, and Windsurf via the MCP server. Website intelligence for developers and AI agents.",
  path: siteConfig.publicRoutes.developers,
});

const exampleRequest = `curl -X POST https://api.ownsurface.com/api/v1/scan \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`;

const enrichExample = `# Get full company enrichment
curl https://api.ownsurface.com/api/v1/enrich/stripe.com \\
  -H "X-Api-Key: YOUR_API_KEY"

# Company info only
curl https://api.ownsurface.com/api/v1/enrich/stripe.com/company \\
  -H "X-Api-Key: YOUR_API_KEY"

# Tech stack only
curl https://api.ownsurface.com/api/v1/enrich/stripe.com/tech \\
  -H "X-Api-Key: YOUR_API_KEY"

# Security posture only
curl https://api.ownsurface.com/api/v1/enrich/stripe.com/security \\
  -H "X-Api-Key: YOUR_API_KEY"`;

const pythonExample = `import requests

API_KEY = "your-api-key"
headers = {"X-Api-Key": API_KEY}

# Scan a website
res = requests.post(
    "https://api.ownsurface.com/api/v1/scan",
    json={"url": "https://stripe.com"},
    headers=headers,
)
data = res.json()
print(f"Tech stack: {len(data['tech_stack'])} technologies")
print(f"Security grade: {data['security']['grade']}")
print(f"Carbon: {data['carbon']['co2_grams_per_visit']}g CO2/visit")`;

const jsExample = `const response = await fetch("https://api.ownsurface.com/api/v1/enrich/stripe.com", {
  headers: { "X-Api-Key": "your-api-key" },
});
const data = await response.json();
console.log(data.company);       // { name, industry, location, ... }
console.log(data.tech_stack);    // [{ name: "React", category: "Frontend", ... }]
console.log(data.email_patterns); // { pattern: "firstname@stripe.com", ... }`;

const mcpConfig = `{
  "mcpServers": {
    "ownsurface": {
      "command": "npx",
      "args": ["@ownsurface/mcp-server"],
      "env": {
        "OWNSURFACE_API_KEY": "your-api-key"
      }
    }
  }
}`;

export default function DevelopersPage() {
  return (
    <PublicPageShell
      eyebrow="Developers"
      title="REST API and MCP Server for website intelligence."
      description="Two ways to integrate. Call the REST API from any language to scan websites, enrich domains, and pull structured data. Or install the MCP server so Claude, Cursor, and Windsurf can query website intelligence natively inside conversations."
      summaryTitle="Quick start"
      summaryItems={[
        { label: "REST API", value: "https://api.ownsurface.com/api/v1" },
        { label: "MCP Server", value: "npx @ownsurface/mcp-server" },
        { label: "Authentication", value: "X-Api-Key header or Bearer token" },
        { label: "Get your key", value: "Create a free account", href: "/register" },
      ]}
      summaryNote="Both the REST API and MCP server use the same API key. Create a free account to get started — no credit card required."
    >
      <PublicPageSection title="What you can build" eyebrow="01">
        <p>
          OwnSurface gives you structured website intelligence through two interfaces.
          The <strong>REST API</strong> returns JSON from any HTTP client — use it in scripts, CI/CD pipelines, internal dashboards, and backend services.
          The <strong>MCP server</strong> lets AI assistants call the same intelligence natively — your Claude, Cursor, or Windsurf session can scan sites, look up companies, and check security without you writing any integration code.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "REST API", items: "CI/CD security checks, competitor monitoring, CRM enrichment, bulk research pipelines" },
            { label: "MCP Server", items: "Ask Claude to scan a site, get security fixes mid-conversation, enrich prospects in Cursor" },
            { label: "Enrichment API", items: "Clearbit alternative — company data, tech stack, email patterns from any domain" },
            { label: "Webhooks", items: "Get notified on Slack or Discord when monitored sites change" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-black/40 backdrop-blur-md border border-white/10 card-lift px-4 py-3">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-white/60">{item.items}</p>
            </div>
          ))}
        </div>
      </PublicPageSection>

      <PublicPageSection id="mcp" title="MCP Server — connect to AI tools" eyebrow="02">
        <p>
          Install the MCP server once and every MCP-compatible AI tool gains access to OwnSurface.
          Claude Desktop, Cursor, Windsurf, and any agent that speaks MCP can scan websites, check security, get company data, and compare tech stacks — directly inside conversations.
        </p>
        <h4 className="text-sm font-semibold text-white">Install</h4>
        <div className="rounded-xl bg-[hsl(var(--ink))] p-5 text-sm text-teal-200">
          <pre className="overflow-x-auto leading-7"><code>{mcpConfig}</code></pre>
        </div>
        <p className="text-sm text-white/60">
          Add this to your Claude Desktop config (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code> on macOS)
          or your Cursor / Windsurf MCP settings. Same config works everywhere.
        </p>
        <h4 className="mt-6 text-sm font-semibold text-white">Available tools</h4>
        <div className="grid gap-2">
          {[
            { tool: "scan_website", desc: "Full 26-module scan — tech stack, security, SEO, carbon footprint, AI summary" },
            { tool: "get_tech_stack", desc: "Frameworks, CDNs, payments, hosting, and infrastructure cost estimate" },
            { tool: "check_security", desc: "Security grade, missing headers, vulnerabilities, copy-paste fix configs" },
            { tool: "get_company_info", desc: "Company name, industry, social links, email patterns (Clearbit alternative)" },
            { tool: "compare_websites", desc: "Side-by-side comparison — tech, security, SEO, traffic, business signals" },
            { tool: "get_scan_history", desc: "Track changes over time — tech additions, security score changes" },
            { tool: "check_carbon", desc: "CO\u2082 per visit, sustainability grade, green hosting, recommendations" },
          ].map((t) => (
            <div key={t.tool} className="flex items-start gap-3 rounded-[1rem] border border-border bg-black/40 backdrop-blur-md border border-white/10 card-lift p-3">
              <code className="shrink-0 rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-bold text-teal-400">{t.tool}</code>
              <span className="text-sm text-white/60">{t.desc}</span>
            </div>
          ))}
        </div>
        <h4 className="mt-6 text-sm font-semibold text-white">Example conversation</h4>
        <div className="space-y-3">
          {[
            { q: "What technologies does stripe.com use?", a: "Calls get_tech_stack — returns React, Next.js, Ruby, Cloudflare, Stripe.js, and 18 more with versions" },
            { q: "Is this site secure? Show me what to fix.", a: "Calls check_security — returns grade, missing headers, and nginx/Apache/Cloudflare/Vercel fix configs you can copy-paste" },
            { q: "Get me company info for notion.so", a: "Calls get_company_info — returns company data, social links, email pattern (firstname@notion.so), team page URL" },
          ].map((example) => (
            <div key={example.q} className="rounded-[1rem] border border-border bg-black/40 backdrop-blur-md border border-white/10 card-lift p-4">
              <p className="text-sm font-medium text-white">&ldquo;{example.q}&rdquo;</p>
              <p className="mt-1 text-xs leading-5 text-white/60">{example.a}</p>
            </div>
          ))}
        </div>
      </PublicPageSection>

      <PublicPageSection id="authentication" title="Authentication" eyebrow="03">
        <p>
          The product currently supports account-backed authentication and API access through product-managed credentials. Public onboarding starts with account creation,
          after which API keys can be managed inside the product experience.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Dashboard users can manage API keys from the product workspace.</li>
          <li>Requests should include authorization headers as documented in the product examples.</li>
          <li>Usage limits depend on plan tier and are enforced at the product level.</li>
        </ul>
      </PublicPageSection>

      <PublicPageSection title="Response surface" eyebrow="04">
        <p>
          A typical response can include technology detection, security scoring, SEO findings, business and traffic signals, social links,
          company data, and deeper modules such as privacy, JavaScript bundle analysis, API discovery, supply chain, and owned-domain workflows depending on plan and feature availability.
        </p>
        <p>
          That model is designed so the same scan can later feed reports, collections, monitoring, and internal systems without re-running disconnected tools.
        </p>
      </PublicPageSection>

      <PublicPageSection id="example" title="Example request" eyebrow="05">
        <div className="rounded-xl bg-[hsl(var(--ink))] p-5 text-sm text-teal-200">
          <pre className="overflow-x-auto leading-7"><code>{exampleRequest}</code></pre>
        </div>
      </PublicPageSection>

      <PublicPageSection id="enrichment" title="Enrichment API (Clearbit alternative)" eyebrow="06">
        <p>
          Get company data, tech stack, security posture, email patterns, and more from any domain.
          RESTful GET endpoints return filtered views of our full intelligence — no scan wait needed for cached domains.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { method: "GET", path: "/enrich/{domain}", desc: "Full enrichment (company + tech + security + signals)" },
            { method: "GET", path: "/enrich/{domain}/company", desc: "Company info, social links, email patterns" },
            { method: "GET", path: "/enrich/{domain}/tech", desc: "Technology stack and infrastructure costs" },
            { method: "GET", path: "/enrich/{domain}/security", desc: "Security score, findings with fix code" },
          ].map((ep) => (
            <div key={ep.path} className="rounded-xl border border-border bg-black/40 backdrop-blur-md border border-white/10 card-lift p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-bold text-teal-400">{ep.method}</span>
                <code className="text-sm font-mono text-white">{ep.path}</code>
              </div>
              <p className="mt-2 text-xs text-white/60">{ep.desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-[hsl(var(--ink))] p-5 text-sm text-teal-200">
          <pre className="overflow-x-auto leading-7"><code>{enrichExample}</code></pre>
        </div>
      </PublicPageSection>

      <PublicPageSection id="code-examples" title="Code examples" eyebrow="07">
        <p>Use any HTTP client. Here are examples in Python and JavaScript.</p>
        <h4 className="text-sm font-semibold text-white">Python</h4>
        <div className="rounded-xl bg-[hsl(var(--ink))] p-5 text-sm text-teal-200">
          <pre className="overflow-x-auto leading-7"><code>{pythonExample}</code></pre>
        </div>
        <h4 className="mt-6 text-sm font-semibold text-white">JavaScript / TypeScript</h4>
        <div className="rounded-xl bg-[hsl(var(--ink))] p-5 text-sm text-teal-200">
          <pre className="overflow-x-auto leading-7"><code>{jsExample}</code></pre>
        </div>
      </PublicPageSection>

      <PublicPageSection id="get-started" title="Get started" eyebrow="08">
        <p>
          For implementation support, commercial questions, or larger rollout discussions, start with{" "}
          <Link href={siteConfig.publicRoutes.contact} className="font-semibold text-white hover:text-teal-400">
            the contact page
          </Link>{" "}
          or create a workspace to access product-managed credentials.
        </p>
      </PublicPageSection>
    </PublicPageShell>
  );
}
