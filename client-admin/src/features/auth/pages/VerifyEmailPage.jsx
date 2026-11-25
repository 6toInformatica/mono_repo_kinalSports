import { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useVerifyEmail } from '../hooks/useVerifyEmail';

export const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const token = new URLSearchParams(location.search).get('token');

  const handleFinish = useCallback(() => {
    setTimeout(() => navigate('/'), 2000);
  }, [navigate]);

  const { status, message } = useVerifyEmail(token, handleFinish);

  const displayMessage = status === 'loading' ? 'Verificando tu correo...' : message;

  return (
    <main className='flex min-h-screen items-center justify-center p-6'>
      <div className='w-full max-w-sm rounded-2xl bg-white p-8 shadow-md'>
        <h1 className='mb-6 text-center text-xl font-bold text-brand'>Verificación de correo</h1>
        <div className='flex flex-col items-center gap-4 text-center'>
          <p className={status === 'error' ? 'text-red-600' : 'text-gray-700'} aria-live='polite'>
            {displayMessage}
          </p>
          {status !== 'loading' && (
            <Link to='/' className='font-semibold text-brand underline'>
              Ir al inicio de sesión
            </Link>
          )}
        </div>
      </div>
    </main>
  );
};
