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
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Acceso denegado</h2>
      <p>Solo los administradores pueden acceder a esta sección.</p>
      <button
        type='button'
        onClick={handleBackToLogin}
        className='mt-6 px-5 py-2 rounded-lg bg-main-blue text-white font-medium hover:opacity-90 transition'
      >
        Volver al inicio de sesión
      </button>
    </div>
  );
};
