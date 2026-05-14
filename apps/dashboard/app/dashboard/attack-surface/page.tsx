import { redirect } from "next/navigation";

export default async function AttackSurfaceLauncherRedirect({
 searchParams,
}: {
 searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
 const params = searchParams ? await searchParams : {};
 const domain = typeof params.domain === "string" ? params.domain : undefined;
 const nextUrl = domain
  ? `/dashboard/domain-scan/new/security?domain=${encodeURIComponent(domain)}`
  : "/dashboard/domain-scan/new/security";

 redirect(nextUrl);
}
