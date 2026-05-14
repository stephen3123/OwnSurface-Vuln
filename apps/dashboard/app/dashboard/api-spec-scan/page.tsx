import { redirect } from "next/navigation";

export default function ApiSpecLauncherRedirect() {
 redirect("/dashboard/domain-scan/new/api");
}
