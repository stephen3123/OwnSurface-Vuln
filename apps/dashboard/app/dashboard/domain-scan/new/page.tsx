import { redirect } from "next/navigation";

export default async function DomainScanNewRedirect({
 searchParams,
}: {
 searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
 const params = searchParams ? await searchParams : {};
 const mode = typeof params.mode === "string" ? params.mode : "security";
 const domain = typeof params.domain === "string" ? params.domain : undefined;
 const qs = domain ? `?domain=${encodeURIComponent(domain)}` : "";

 redirect(`/dashboard/domain-scan/new/${mode}${qs}`);
}