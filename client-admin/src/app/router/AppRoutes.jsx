import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../layouts/DashboardPage.jsx";
import { AuthPage } from "../../features/auth/pages/AuthPage.jsx";
import { VerifyEmailPage } from "../../features/auth/pages/VerifyEmailPage.jsx";
import { Fields } from "../../features/userAdmin/components/Fields.jsx";
import { Reservations } from "../../features/userAdmin/components/Reservations.jsx";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleGuard } from "./RoleGuard.jsx";
import { UnauthorizedPage } from "../../features/auth/pages/UnauthorizedPage.jsx";
import { Settings } from "../../features/userManagement/components/Settings.jsx";
import { ResetPasswordPage } from "../../features/auth/pages/ResetPasswordPage.jsx";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* PROTECTED + ROLE */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["ADMIN_ROLE"]}>
              <DashboardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route path="fields" element={<Fields />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
