import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { readImageFilePreview, sanitizeImageSrc } from '../../../shared/utils/imagePreview.js';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { Modal } from '../../../shared/components/ui/Modal.jsx';
import { FieldWrapper } from '../../../shared/components/ui/fields.jsx';
import { CONTROL, borderFor } from '../../../shared/components/ui/uiConstants.js';

export const CreateUserModal = ({ isOpen, onClose, onCreate, loading }) => {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm();
  const [preview, setPreview] = useState(null);
  const safePreview = sanitizeImageSrc(preview);

  const handleCancel = () => {
    reset();
    setPreview(null);
    onClose();
  };

  const submit = async (values) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('surname', values.surname);
    formData.append('username', values.username);
    formData.append('email', values.email);
    formData.append('password', values.password);
    formData.append('phone', values.phone);
    if (values.profilePicture?.[0]) {
      formData.append('profilePicture', values.profilePicture[0]);
    }

    const ok = await onCreate(formData);
    if (ok) {
      handleCancel();
    }
  };

  return (
    <Modal
      open={isOpen}
      title='Nuevo usuario'
      description='Recibirá un correo para verificar su cuenta'
      onClose={handleCancel}
      size='lg'
      footer={
        <>
          <Button variant='secondary' onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type='submit' form='user-form' loading={loading}>
            Crear usuario
          </Button>
        </>
      }
    >
      <form
        id='user-form'
        noValidate
        onSubmit={handleSubmit(submit)}
        className='grid gap-4 sm:grid-cols-2'
      >
        <FieldWrapper label='Nombre' error={errors.name?.message}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type='text'
              aria-invalid={Boolean(errors.name) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.name?.message)}`}
              {...register('name', { required: 'El nombre es obligatorio' })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper label='Apellido' error={errors.surname?.message}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type='text'
              aria-invalid={Boolean(errors.surname) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.surname?.message)}`}
              {...register('surname', { required: 'El apellido es obligatorio' })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper label='Usuario' error={errors.username?.message}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type='text'
              autoComplete='off'
              aria-invalid={Boolean(errors.username) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.username?.message)}`}
              {...register('username', {
                required: 'El nombre de usuario es obligatorio',
                minLength: {
                  value: 3,
                  message: 'Debe tener al menos 3 caracteres',
                },
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper label='Teléfono' error={errors.phone?.message}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type='tel'
              inputMode='numeric'
              aria-invalid={Boolean(errors.phone) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.phone?.message)}`}
              {...register('phone', {
                required: 'El teléfono es obligatorio',
                pattern: {
                  value: /^[0-9]{8}$/,
                  message: 'Debe ser un número de 8 dígitos',
                },
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper label='Correo' error={errors.email?.message} className='sm:col-span-2'>
          {({ id, describedBy }) => (
            <input
              id={id}
              type='email'
              aria-invalid={Boolean(errors.email) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.email?.message)}`}
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Formato de email inválido',
                },
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper label='Contraseña' error={errors.password?.message}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type='password'
              autoComplete='new-password'
              aria-invalid={Boolean(errors.password) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.password?.message)}`}
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: {
                  value: 8,
                  message: 'Debe tener al menos 8 caracteres',
                },
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper label='Confirmar contraseña' error={errors.confirmPassword?.message}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type='password'
              autoComplete='new-password'
              aria-invalid={Boolean(errors.confirmPassword) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.confirmPassword?.message)}`}
              {...register('confirmPassword', {
                required: 'Debe confirmar su contraseña',
                validate: {
                  matchesPassword: (value) =>
                    value === getValues('password') || 'Las contraseñas no coinciden',
                },
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper
          label='Foto de perfil'
          hint='JPG, PNG o WEBP, hasta 10 MB'
          className='sm:col-span-2'
        >
          {({ id, describedBy }) => (
            <div className='flex items-center gap-4'>
              <div className='flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface'>
                {safePreview ? (
                  <img src={safePreview} alt='' className='size-full object-cover' />
                ) : (
                  <span className='text-xs text-ink-soft'>Sin imagen</span>
                )}
              </div>
              <input
                id={id}
                type='file'
                accept='image/jpeg,image/png,image/webp,image/avif'
                aria-describedby={describedBy}
                className='min-h-11 w-full cursor-pointer rounded-[10px] border border-dashed border-[#9aa9c2] bg-white px-3 py-2 text-sm text-brand file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand'
                {...register('profilePicture', {
                  onChange: (e) => {
                    readImageFilePreview(e.target.files?.[0], setPreview);
                  },
                })}
              />
            </div>
          )}
        </FieldWrapper>
      </form>
    </Modal>
  );
};
