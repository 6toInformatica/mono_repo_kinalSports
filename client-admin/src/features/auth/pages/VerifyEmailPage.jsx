import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useVerifyEmail } from "../hooks/useVerifyEmail";
import { useUIStore } from "../store/uiStore";
import { Modal } from "../components/Modal";

export const VerifyEmailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const openModal = useUIStore((state) => state.openModal);

    const token = new URLSearchParams(location.search).get("token");

    const { status, message } = useVerifyEmail(token, () => {
        setTimeout(() => navigate("/"), 3000);
    });

    useEffect(() => {
        if (status === "success") {
            openModal("¡Verificación exitosa!", message);
        }

        if (status === "error") {
            openModal("Error", message);
        }
    }, [status, message, openModal]);

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            {status === "loading" && (
                <p className="text-lg font-semibold text-gray-700">
                    Verificando correo, por favor espera...
                </p>
            )}
            <Modal />
        </div>
    );
}
