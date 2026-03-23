import { useAuthStore } from "../../features/auth/store/authStore.js";
import { DashboardContainer } from "../../shared/components/layout/DashboardContainer.jsx";
import { Outlet } from "react-router-dom";

export function DashboardPage() {
  const { user, logout } = useAuthStore();

  return (
    <DashboardContainer user={user} onLogout={logout}>
      <Outlet />
    </DashboardContainer>
  );
}
