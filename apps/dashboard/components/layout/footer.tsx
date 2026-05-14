import Link from "next/link";
import { OwnSurfaceLogo } from "@/components/branding/ownsurface-logo";
import { publicFooterSections, siteConfig } from "@/lib/site";

type FooterProps = {
 className?: string;
};

export function Footer({ className }: FooterProps) {
 return (
 <footer className={className || "border-t border-white/10 bg-[#050505] text-white"}>
 <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 lg:px-10">
 <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
 <div>
 <OwnSurfaceLogo
 markStyle="bare"
 wordmarkStyle="inline-domain"
 showWordmark
 subtitle={null}
 markClassName="h-8 w-8 rounded-[0.8rem]"
 nameClassName="text-[0.98rem] font-semibold tracking-[-0.05em] text-white"
 subtitleClassName="text-[0.92rem] tracking-[-0.03em] text-white/60"
 />
 <p className="mt-4 text-sm leading-6 text-white/60">
 Website intelligence platform for operators, security teams, and agencies. {siteConfig.operatorLabel}
 {" "}is legally operated by {siteConfig.companyName}.
 </p>
 </div>

 {publicFooterSections.map((section) => (
 <div key={section.title}>
 <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{section.title}</p>
 <div className="mt-4 flex flex-col gap-3 text-sm">
 {section.links.map((link) => (
 <Link key={link.label} href={link.href} className="text-white/70 hover:text-white">
 {link.label}
 </Link>
 ))}
 </div>
 </div>
 ))}
 </div>

 <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
 <div>
 &copy; {new Date().getFullYear()} OwnSurface. All rights reserved. Operated by {siteConfig.companyName}.
 </div>
 <div className="flex flex-col gap-1 sm:items-end">
 <Link href={`mailto:${siteConfig.contactEmail}`} className="hover:text-white">
 {siteConfig.contactEmail}
 </Link>
 <div>{siteConfig.companyName} · Reg. No. {siteConfig.registrationNumber} · {siteConfig.location}</div>
 </div>
 </div>
 </div>
 </footer>
 );
}
