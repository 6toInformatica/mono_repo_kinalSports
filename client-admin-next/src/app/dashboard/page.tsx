import { redirect } from "next/navigation";

// /dashboard abre la primera sección, igual que client-admin
export default function DashboardIndex() {
  redirect("/dashboard/fields");
}
