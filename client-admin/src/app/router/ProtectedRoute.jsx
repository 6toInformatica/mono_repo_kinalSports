import { Navigate } from "react-router-dom";
import { Spinner } from "../../features/auth/components/Spinner.jsx";
import { useAuthStore } from "../../features/auth/store/authStore.js";

export function ProtectedRoute({ children }) {
    const token = useAuthStore((state) => state.token);
    const isLoadingAuth = useAuthStore((state) => state.isLoadingAuth);

    if (isLoadingAuth) return <Spinner />;

    if (!token) return <Navigate to="/" replace />;

    return children;
}
