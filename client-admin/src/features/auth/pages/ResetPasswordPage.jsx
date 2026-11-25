import { ResetPasswordForm } from '../components/ResetPasswordReset.jsx';

export const ResetPasswordPage = () => {
  return (
    <main className='flex min-h-screen items-center justify-center p-6'>
      <div className='w-full max-w-sm rounded-2xl bg-white p-8 shadow-md'>
        <h1 className='mb-6 text-center text-xl font-bold text-brand'>Restablecer contraseña</h1>
        <ResetPasswordForm />
      </div>
    </main>
  );
};
