import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { PublicNav } from "@/components/layout/public-nav";
import { cn } from "@/lib/utils";

type SummaryItem = {
  label: string;
  value: string;
  href?: string;
};

type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  summaryTitle?: string;
  summaryItems?: SummaryItem[];
  summaryNote?: string;
  children: ReactNode;
};

type PublicPageSectionProps = {
  id?: string;
  title: string;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
};

export function PublicPageShell({
  eyebrow,
  title,
  description,
  summaryTitle,
  summaryItems,
  summaryNote,
  children,
}: PublicPageShellProps) {
  return (
    <div className="relative min-h-screen bg-background bg-dot-grid text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.15),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.05),_transparent_35%),linear-gradient(180deg,rgba(10,10,10,0),rgba(10,10,10,1))]" />
      <PublicNav />

      <main className="relative page-fade">
        <section className="mx-auto max-w-[1320px] px-4 pb-8 pt-10 sm:px-6 lg:px-10 lg:pb-12 lg:pt-16">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="relative z-10">
              <div className="section-kicker text-teal-300">{eyebrow}</div>
              <h1 className="mt-4 max-w-4xl font-heading text-[2.6rem] font-semibold tracking-[-0.06em] text-white sm:text-[4.4rem]">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/60 sm:text-[1.08rem]">
                {description}
              </p>
            </div>

            {summaryItems && summaryItems.length > 0 ? (
              <aside className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 relative z-10 card-lift">
                {summaryTitle ? <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60 mb-4">{summaryTitle}</div> : null}
                <div className="mt-4 space-y-3">
                  {summaryItems.map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{item.label}</div>
                      {item.href ? (
                        <Link href={item.href} className="mt-3 block text-base font-semibold text-white hover:text-teal-400 transition-colors">
                          {item.value}
                        </Link>
                      ) : (
                        <div className="mt-3 text-base font-semibold text-white">{item.value}</div>
                      )}
                    </div>
                  ))}
                </div>
                {summaryNote ? (
                  <p className="mt-4 text-sm leading-7 text-white/50">{summaryNote}</p>
                ) : null}
              </aside>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-4 pb-16 sm:px-6 lg:px-10 lg:pb-24 relative z-10">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-7 sm:p-8 lg:p-10 shadow-[0_0_30px_rgba(20,184,166,0.05)]">
            <div className="space-y-10">{children}</div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export function PublicPageSection({ id, title, eyebrow, className, children }: PublicPageSectionProps) {
  return (
    <section id={id} className={cn("border-t border-white/10 pt-8 first:border-t-0 first:pt-0", className)}>
      {eyebrow ? <div className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-400 mb-3">{eyebrow}</div> : null}
      <h2 className="mt-4 text-[1.55rem] font-semibold tracking-[-0.05em] text-white sm:text-[2rem]">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-white/60 sm:text-[0.98rem]">
        {children}
      </div>
    </section>
  );
}
