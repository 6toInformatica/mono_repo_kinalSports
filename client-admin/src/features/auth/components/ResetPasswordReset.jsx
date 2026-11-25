import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const resetPassword = useAuthStore((state) => state.resetPassword);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const onSubmit = async (data) => {
    const res = await resetPassword({
      token,
      newPassword: data.password,
    });

    if (res.success) {
      toast.success('Ahora puedes iniciar sesión con tu nueva contraseña', {
        duration: 5000,
      });
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <label className='flex flex-col gap-1 text-sm font-medium'>
        Nueva contraseña
        <input
          id='password'
          type='password'
          autoComplete='new-password'
          className='rounded-lg border border-gray-300 px-3 py-2'
          {...register('password', {
            required: 'La contraseña es obligatoria',
            minLength: {
              value: 8,
              message: 'Debe tener al menos 8 caracteres',
            },
          })}
        />
        {errors.password && <span className='text-xs text-red-600'>{errors.password.message}</span>}
      </label>

      <label className='flex flex-col gap-1 text-sm font-medium'>
        Confirmar contraseña
        <input
          id='confirmPassword'
          type='password'
          autoComplete='new-password'
          className='rounded-lg border border-gray-300 px-3 py-2'
          {...register('confirmPassword', {
            required: 'Debe confirmar la contraseña',
            validate: {
              matchesPassword: (value) => {
                const passwordValue = getValues('password');
                return value === passwordValue || 'Las contraseñas no coinciden';
              },
            },
          })}
        />
        {errors.confirmPassword && (
          <span className='text-xs text-red-600'>{errors.confirmPassword.message}</span>
        )}
      </label>

      {error && <p className='text-sm text-red-600'>{error}</p>}

      <button
        type='submit'
        disabled={loading || !token}
        className='rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60'
      >
        {loading ? 'Guardando...' : 'Restablecer contraseña'}
      </button>
    </form>
  );
};
