import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";
import { Footer } from "@/components/layout/footer";

export const revalidate = 300;

// This is a server component for SSR public reports
export default async function PublicReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // In production this would be a server-side fetch
  // For now we render a client-shell that fetches
  return <PublicReportShell slug={id} />;
}

// Client component that fetches the report
import { PublicReportClient } from "./client";

function PublicReportShell({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background bg-dot-grid text-foreground">
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="shell-panel rounded-[2rem] p-6 sm:p-8">
          <PublicReportClient slug={slug} />
        </div>
      </div>
      <div className="border-t border-black/8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Want to scan your own websites?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          OwnSurface gives you complete website intelligence in seconds. Tech stacks, security, SEO, and more.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition-colors"
        >
          Get Started Free
        </Link>
      </div>
      <Footer />
    </div>
  );
}
