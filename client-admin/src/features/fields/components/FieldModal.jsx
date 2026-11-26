import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFieldsStore } from '../../users/store/adminStore';
import { useSaveField } from '../../fields/hooks/useSaveField';
import { showSuccess, showError } from '../../../shared/utils/toast.js';
import { resolveCloudinaryUrl } from '../../../shared/utils/cloudinary.js';
import {
  imageFileError,
  readImageFilePreview,
  sanitizeImageSrc,
} from '../../../shared/utils/imagePreview.js';
import { CAPACITY_LABELS, FIELD_TYPE_LABELS } from '../../../shared/utils/formatters.js';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { Modal } from '../../../shared/components/ui/Modal.jsx';
import { FieldWrapper } from '../../../shared/components/ui/fields.jsx';
import { CONTROL, borderFor } from '../../../shared/components/ui/uiConstants.js';

export const FieldModal = ({ isOpen, onClose, field }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    trigger,
    formState: { errors },
  } = useForm();

  const { saveField } = useSaveField();
  const loading = useFieldsStore((state) => state.loading);

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (field) {
        reset({
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          capacity: field.capacity,
          pricePerHour: field.pricePerHour,
          description: field.description,
        });
        setPreview(resolveCloudinaryUrl(field.photo));
      } else {
        reset({
          fieldName: '',
          fieldType: '',
          capacity: '',
          pricePerHour: '',
          description: '',
          photo: null,
        });
        setPreview(null);
      }
    }
  }, [isOpen, field, reset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((value, { name }) => {
      if (name === 'photo' && value.photo && value.photo.length > 0) {
        const file = value.photo[0];
        if (imageFileError(file)) setPreview(field ? resolveCloudinaryUrl(field.photo) : null);
        else readImageFilePreview(file, setPreview);
        void trigger('photo');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, trigger, field]);

  const safePreview = sanitizeImageSrc(preview);

  const onSubmit = async (data) => {
    try {
      await saveField(data, field?._id);
      showSuccess(field ? 'Cancha actualizada' : 'Cancha creada');
      reset();
      setPreview(null);
      onClose();
    } catch {
      showError('Error al guardar el campo');
    }
  };

  const handleCancel = () => {
    reset();
    setPreview(null);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      title={field ? 'Editar cancha' : 'Nueva cancha'}
      onClose={handleCancel}
      size='lg'
      footer={
        <>
          <Button variant='secondary' onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type='submit' form='field-form' loading={loading}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id='field-form'
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className='grid gap-4 sm:grid-cols-2'
      >
        <FieldWrapper label='Nombre' error={errors.fieldName?.message} className='sm:col-span-2'>
          {({ id, describedBy }) => (
            <input
              id={id}
              aria-invalid={Boolean(errors.fieldName) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.fieldName?.message)}`}
              {...register('fieldName', {
                required: 'El nombre es obligatorio',
                minLength: {
                  value: 3,
                  message: 'Debe tener al menos 3 caracteres',
                },
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper label='Tipo de superficie' error={errors.fieldType?.message}>
          {({ id, describedBy }) => (
            <select
              id={id}
              aria-invalid={Boolean(errors.fieldType) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.fieldType?.message)}`}
              {...register('fieldType', {
                required: 'El tipo es obligatorio',
              })}
            >
              <option value=''>Seleccione un tipo</option>
              {Object.entries(FIELD_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </FieldWrapper>

        <FieldWrapper label='Capacidad' error={errors.capacity?.message}>
          {({ id, describedBy }) => (
            <select
              id={id}
              aria-invalid={Boolean(errors.capacity) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.capacity?.message)}`}
              {...register('capacity', {
                required: 'La capacidad es obligatoria',
              })}
            >
              <option value=''>Seleccione capacidad</option>
              {Object.entries(CAPACITY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </FieldWrapper>

        <FieldWrapper label='Precio por hora (Q)' error={errors.pricePerHour?.message}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type='number'
              step='0.01'
              aria-invalid={Boolean(errors.pricePerHour) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.pricePerHour?.message)}`}
              {...register('pricePerHour', {
                required: 'El precio es obligatorio',
                min: { value: 1, message: 'Debe ser mayor a 0' },
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper
          label='Descripción'
          error={errors.description?.message}
          className='sm:col-span-2'
        >
          {({ id, describedBy }) => (
            <textarea
              id={id}
              rows={3}
              aria-invalid={Boolean(errors.description) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} py-2.5 ${borderFor(errors.description?.message)}`}
              {...register('description', {
                required: 'La descripción es obligatoria',
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper
          label='Foto'
          hint='JPG, PNG, WEBP o AVIF, hasta 10 MB'
          error={errors.photo?.message}
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
                {...register('photo', {
                  validate: (files) => imageFileError(files?.[0]) ?? true,
                })}
              />
            </div>
          )}
        </FieldWrapper>
      </form>
    </Modal>
  );
};
