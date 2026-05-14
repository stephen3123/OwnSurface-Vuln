import { redirect } from "next/navigation";

export default function OffensiveScanLauncherRedirect() {
 redirect("/dashboard/domain-scan/new/pentest");
}
