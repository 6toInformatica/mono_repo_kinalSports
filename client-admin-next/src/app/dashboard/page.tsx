import { OverviewSection } from "@/features/overview/OverviewSection";
import { getCurrentUser } from "@/server/current-user";

export const metadata = { title: "Vista general · Kinal Sports Admin" };

export default async function Page() {
  const user = await getCurrentUser();
  return <OverviewSection firstName={user?.name?.split(" ")[0]} />;
}
