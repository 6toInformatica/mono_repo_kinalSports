import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { FieldWrapper } from '../../../shared/components/ui/fields.jsx';
import { CONTROL, borderFor } from '../../../shared/components/ui/uiConstants.js';

const CARD =
  'flex w-full max-w-[400px] flex-col gap-[18px] rounded-[18px] border border-line bg-white p-9';
const LINK = 'self-center text-sm font-semibold text-brand hover:text-brand-dark';

function Alert({ tone = 'error', children }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-[10px] px-3.5 py-3 text-sm ${
        tone === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
      }`}
    >
      <svg
        aria-hidden='true'
        width='18'
        height='18'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        className='mt-px shrink-0'
      >
        <circle cx='12' cy='12' r='10' />
        <line x1='12' y1='8' x2='12' y2='12' />
        <line x1='12' y1='16' x2='12.01' y2='16' />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export const ForgotPasswordForm = ({ onSwitch }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const [sentMessage, setSentMessage] = useState(null);

  const onSubmit = async (data) => {
    setSentMessage(null);
    const res = await forgotPassword(data.email);
    if (res.success) {
      setSentMessage('Si el correo existe, te enviamos un enlace para restablecer tu contraseña.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={CARD}>
      <div className='flex flex-col gap-1.5'>
        <h2 className='font-display text-[26px] font-bold text-brand'>Recuperar contraseña</h2>
        <p className='text-sm text-ink-soft'>Te enviaremos un enlace a tu correo.</p>
      </div>

      <FieldWrapper label='Correo' error={errors.email?.message}>
        {({ id, describedBy }) => (
          <input
            id={id}
            type='email'
            autoComplete='email'
            aria-invalid={Boolean(errors.email) || undefined}
            aria-describedby={describedBy}
            className={`${CONTROL} ${borderFor(errors.email?.message)}`}
            {...register('email', {
              required: 'Ingresa tu correo.',
            })}
          />
        )}
      </FieldWrapper>

      {error && <Alert tone='error'>{error}</Alert>}
      {sentMessage && <Alert tone='success'>{sentMessage}</Alert>}

      <Button type='submit' loading={loading} className='min-h-12'>
        Enviar enlace
      </Button>

      <button type='button' onClick={onSwitch} className={LINK}>
        Volver a iniciar sesión
      </button>
    </form>
  );
};
