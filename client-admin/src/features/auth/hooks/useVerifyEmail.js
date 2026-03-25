import { useState, useEffect } from "react";
import { verifyEmail as verifyEmailRequest } from "../../../shared/api";
import { showSuccess, showError } from "../../../shared/utils/toast.js";

export const useVerifyEmail = (token, onSuccess) => {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await verifyEmailRequest(token);

        if (res.status === 200) {
          setStatus("success");
          setMessage(
            "Tu correo ha sido verificado correctamente. Serás redirigido al login...",
          );
          showSuccess(
            "Tu correo ha sido verificado correctamente. Serás redirigido al login...",
          );
          onSuccess && onSuccess();
        }
      } catch {
        setStatus("error");
        setMessage("El enlace ha expirado o no es válido.");
        showError("El enlace ha expirado o no es válido.");
      }
    };

    if (!token) {
      setTimeout(() => {
        setStatus("error");
        setMessage("Token inválido.");
        showError("Token inválido.");
      }, 0);
      return;
    }

    verifyEmail();
  }, [token, onSuccess]);

  return { status, message };
};
