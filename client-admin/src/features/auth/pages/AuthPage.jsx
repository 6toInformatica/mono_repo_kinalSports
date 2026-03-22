import { useState } from "react";
import { LoginForm } from "../components/LoginForm";
import { RegisterForm } from "../components/RegisterForm";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-10">
        <div className="flex justify-center mb-6">
          <img
            src="/src/assets/img/kinal_sports.png"
            alt="Kinal Sports"
            className="h-20 w-auto"
          />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {isForgot
              ? "Recuperar Contraseña"
              : isLogin
                ? "Bienvenido de Nuevo"
                : "Crear Cuenta"}
          </h1>

          <p className="text-gray-600 text-base max-w-md mx-auto">
            {isForgot
              ? "Ingresa tu correo para recuperar tu contraseña"
              : isLogin
                ? "Ingresa a tu cuenta de administrador de Kinal Sports"
                : "Regístrate como administrador de Kinal Sports"}
          </p>
        </div>

        {isForgot ? (
          <ForgotPasswordForm
            onSwitch={() => {
              setIsForgot(false);
              setIsLogin(true);
            }}
          />
        ) : isLogin ? (
          <LoginForm
            onSwitch={() => setIsLogin(false)}
            onForgot={() => setIsForgot(true)}
          />
        ) : (
          <RegisterForm onSwitch={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
