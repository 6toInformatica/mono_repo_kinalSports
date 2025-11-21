import { useState } from "react";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

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
            {isLogin ? "Bienvenido de Nuevo" : "Crear Cuenta"}
          </h1>
          <p className="text-gray-600 text-base max-w-md mx-auto">
            {isLogin
              ? "Ingresa a tu cuenta de administrador de Kinal Sports"
              : "Regístrate como administrador de Kinal Sports"}
          </p>
        </div>

        {isLogin ? (
          <LoginForm onSwitch={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitch={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
