import { useState, useEffect } from "react";
import { verifyEmail as verifyEmailRequest } from "../../../service";

export const useVerifyEmail = (token, onSuccess) => {
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const res = await verifyEmailRequest(token);

                if (res.status === 200) {
                    setStatus("success");
                    setMessage("Tu correo ha sido verificado correctamente. Seras redirigido al login...");
                    onSuccess && onSuccess();
                }
            } catch (error) {
                setStatus("error");
                setMessage("El enlace ha expirado o no es válido.");
            }
        };

        if (!token) {
            setStatus("error");
            setMessage("Token inválido.");
            return;
        }

        verifyEmail();
    }, [token, onSuccess]);

    return { status, message };
}
