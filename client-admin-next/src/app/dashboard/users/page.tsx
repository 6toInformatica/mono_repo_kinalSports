import { UsersSection } from "@/features/users/UsersSection";
import { getCurrentUser } from "@/server/current-user";

export const metadata = { title: "Usuarios · Kinal Sports Admin" };

export default async function Page() {
  const user = await getCurrentUser();
  return <UsersSection currentUserId={user?.id} />;
}
