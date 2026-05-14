import { redirect } from "next/navigation";

export default function GeoMentionsRedirect() {
  redirect("/dashboard/geo?tab=mentions");
}
