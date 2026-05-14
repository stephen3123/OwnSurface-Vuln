import { redirect } from "next/navigation";

export default function GeoThreadsRedirect() {
  redirect("/dashboard/geo?tab=threads");
}
