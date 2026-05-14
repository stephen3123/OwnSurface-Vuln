"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBreadcrumbLabel } from "@/lib/dashboard-route-metadata";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
 const pathname = usePathname();

 // Only show on dashboard routes
 if (!pathname.startsWith("/dashboard")) return null;

 const segments = pathname.split("/").filter(Boolean);
 // Don't show breadcrumbs on the dashboard home itself
 if (segments.length <= 1) return null;

 const crumbs = segments.map((segment, index) => {
 const href = "/" + segments.slice(0, index + 1).join("/");
 const label = getBreadcrumbLabel(segment);
 const isLast = index === segments.length - 1;
 return { href, label, isLast };
 });

 return (
 <nav
 aria-label="Breadcrumb"
 className="flex items-center gap-1 overflow-x-auto text-sm"
 >
 {crumbs.map((crumb, index) => (
 <span key={crumb.href} className="flex items-center gap-1 shrink-0">
 {index > 0 && (
 <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
 )}
 {index === 0 ? (
 <Link
 href={crumb.href}
 className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
 >
 <Home className="h-3.5 w-3.5" />
 <span className="hidden sm:inline">{crumb.label}</span>
 </Link>
 ) : crumb.isLast ? (
 <span className="font-medium text-foreground truncate max-w-48">
 {crumb.label}
 </span>
 ) : (
 <Link
 href={crumb.href}
 className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-32"
 >
 {crumb.label}
 </Link>
 )}
 </span>
 ))}
 </nav>
 );
}
