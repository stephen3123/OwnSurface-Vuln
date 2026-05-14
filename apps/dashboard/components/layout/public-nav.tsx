import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { OfferBanner } from "@/components/public/offer-banner";

export function PublicNav() {
 return (
 <header className="sticky top-0 z-50">
 <OfferBanner />
 <nav className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
 <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
 <Link href={siteConfig.publicRoutes.home} className="transition-opacity hover:opacity-90">
 <span className="block text-[1.45rem] font-black tracking-[-0.06em] leading-none [background-image:linear-gradient(90deg,hsl(var(--foreground))_0%,hsl(var(--foreground))_82%,rgba(94,234,212,0.92)_100%)] bg-clip-text text-transparent">
 OwnSurface
 </span>
 </Link>

 <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/60 sm:gap-6">
 <Link href={siteConfig.publicRoutes.pricing} className="hover:text-white transition-colors">
 Pricing
 </Link>
 <Link href={siteConfig.publicRoutes.developers} className="hover:text-white transition-colors">
 Developers
 </Link>
 <Link href={siteConfig.publicRoutes.security} className="hover:text-white transition-colors">
 Security
 </Link>
 <Link href={siteConfig.publicRoutes.blog} className="hover:text-white transition-colors">
 Blog
 </Link>
 <Link href={siteConfig.publicRoutes.contact} className="hover:text-white transition-colors">
 Contact
 </Link>
 <Link href="/login" className="hover:text-white transition-colors">
 Log in
 </Link>
 <Link
 href="/register"
 className="rounded-full bg-white px-5 py-2.5 text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/90 hover:scale-[1.02] transition-transform"
 >
 Start free
 </Link>
 </div>
 </div>
 </nav>
 </header>
 );
}
