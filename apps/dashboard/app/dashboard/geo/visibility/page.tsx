import { redirect } from "next/navigation";

export default function GeoVisibilityRedirect() {
  redirect("/dashboard/geo?tab=visibility");
}
