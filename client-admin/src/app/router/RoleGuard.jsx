import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";

export const RoleGuard = ({ children, allowedRoles = [] }) => {
    const user = useAuthStore((state) => state.user);

    const hasAccess = allowedRoles.includes(user?.role);

    if (!hasAccess) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}