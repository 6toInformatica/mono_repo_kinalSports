import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { FieldWrapper } from '../../../shared/components/ui/fields.jsx';
import { CONTROL, borderFor } from '../../../shared/components/ui/uiConstants.js';
import logoImg from '../../../assets/img/kinal_sports.png';

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

export const LoginForm = ({ onForgot }) => {
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const sessionMessage = useAuthStore((state) => state.sessionMessage);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const res = await login(data);
    if (res.success) {
      navigate('/dashboard');
      toast.success('¡Bienvenido de nuevo!', { duration: 4000 });
    }
  };

  const activeError = error || sessionMessage;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={CARD}>
      <img
        src={logoImg}
        alt='Logo de Kinal Sports'
        width={72}
        height={72}
        className='size-[72px] self-center object-contain'
      />
      <div className='flex flex-col gap-1.5'>
        <h2 className='font-display text-[26px] font-bold text-brand'>Iniciar sesión</h2>
        <p className='text-sm text-ink-soft'>Usa tu correo o tu nombre de usuario.</p>
      </div>

      <FieldWrapper label='Correo o usuario' error={errors.emailOrUsername?.message}>
        {({ id, describedBy }) => (
          <input
            id={id}
            type='text'
            autoComplete='username'
            aria-invalid={Boolean(errors.emailOrUsername) || undefined}
            aria-describedby={describedBy}
            className={`${CONTROL} ${borderFor(errors.emailOrUsername?.message)}`}
            {...register('emailOrUsername', {
              required: 'Este campo es obligatorio',
            })}
          />
        )}
      </FieldWrapper>

      <FieldWrapper label='Contraseña' error={errors.password?.message}>
        {({ id, describedBy }) => (
          <input
            id={id}
            type='password'
            autoComplete='current-password'
            aria-invalid={Boolean(errors.password) || undefined}
            aria-describedby={describedBy}
            className={`${CONTROL} ${borderFor(errors.password?.message)}`}
            {...register('password', {
              required: 'La contraseña es obligatoria',
            })}
          />
        )}
      </FieldWrapper>

      {activeError && <Alert tone='error'>{activeError}</Alert>}

      <Button type='submit' loading={loading} className='min-h-12'>
        Iniciar sesión
      </Button>

      <button type='button' onClick={onForgot} className={LINK}>
        ¿Olvidaste tu contraseña?
      </button>
    </form>
  );
};
