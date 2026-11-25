import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  // Cierra la sesión actual para poder entrar con una cuenta de administrador
  const handleBackToLogin = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center'>
      <h1 className='text-2xl font-bold text-brand'>Acceso no autorizado</h1>
      <p>No tienes permisos para acceder como administrador.</p>
      <button
        type='button'
        onClick={handleBackToLogin}
        className='font-semibold text-brand underline'
      >
        Volver al inicio
      </button>
    </main>
  );
};
