import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSaveTournament } from '../hooks/useSaveTournament';
import { useTournamentsStore } from '../store/tournamentStore';
import { resolveCloudinaryUrl } from '../../../shared/utils/cloudinary.js';
import {
  imageFileError,
  readImageFilePreview,
  sanitizeImageSrc,
} from '../../../shared/utils/imagePreview.js';
import { showSuccess } from '../../../shared/utils/toast.js';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { Modal } from '../../../shared/components/ui/Modal.jsx';
import { FieldWrapper } from '../../../shared/components/ui/fields.jsx';
import { CONTROL, borderFor } from '../../../shared/components/ui/uiConstants.js';

export const TournamentModal = ({ isOpen, onClose, tournament }) => {
  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm();

  const { saveTournament } = useSaveTournament();
  const loading = useTournamentsStore((state) => state.loading);

  const [preview, setPreview] = useState(null);

  const displayPreview = sanitizeImageSrc(
    preview || resolveCloudinaryUrl(tournament?.logo, null) || null
  );

  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    setPreview(null);
  }

  useEffect(() => {
    if (isOpen) {
      if (tournament) {
        reset({
          tournamentsName: tournament.tournamentsName || '',
          category: tournament.category || '',
          startDate: tournament.startDate ? tournament.startDate.slice(0, 10) : '',
          endDate: tournament.endDate ? tournament.endDate.slice(0, 10) : '',
          description: tournament.description || '',
          logo: null,
        });
      } else {
        reset({
          tournamentsName: '',
          category: '',
          startDate: '',
          endDate: '',
          description: '',
          logo: null,
        });
      }
    }
  }, [isOpen, reset, tournament]);

  const onSubmit = async (data) => {
    try {
      await saveTournament(data, tournament?._id);
      showSuccess(tournament ? 'Torneo actualizado' : 'Torneo creado');
      reset();
      setPreview(null);
      onClose();
    } catch {
      // El error se muestra desde el store
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
      title={tournament ? 'Editar torneo' : 'Nuevo torneo'}
      onClose={handleCancel}
      size='lg'
      footer={
        <>
          <Button variant='secondary' onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type='submit' form='tournament-form' loading={loading}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id='tournament-form'
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className='grid gap-4 sm:grid-cols-2'
      >
        <FieldWrapper
          label='Nombre'
          error={errors.tournamentsName?.message}
          className='sm:col-span-2'
        >
          {({ id, describedBy }) => (
            <input
              id={id}
              aria-invalid={Boolean(errors.tournamentsName) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.tournamentsName?.message)}`}
              {...register('tournamentsName', {
                required: 'El nombre es obligatorio',
                minLength: {
                  value: 3,
                  message: 'Debe tener al menos 3 caracteres',
                },
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper label='Fecha de inicio' error={errors.startDate?.message}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type='date'
              aria-invalid={Boolean(errors.startDate) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.startDate?.message)}`}
              {...register('startDate', {
                required: 'La fecha de inicio es obligatoria',
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper label='Fecha de fin' error={errors.endDate?.message}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type='date'
              aria-invalid={Boolean(errors.endDate) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.endDate?.message)}`}
              {...register('endDate', {
                required: 'La fecha de fin es obligatoria',
              })}
            />
          )}
        </FieldWrapper>

        <FieldWrapper label='Categoría' error={errors.category?.message} className='sm:col-span-2'>
          {({ id, describedBy }) => (
            <select
              id={id}
              aria-invalid={Boolean(errors.category) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.category?.message)}`}
              {...register('category', {
                required: 'La categoría es obligatoria',
              })}
            >
              <option value=''>Seleccione una categoría</option>
              <option value='FUTBOL_7'>Fútbol 7</option>
              <option value='FUTBOL_11'>Fútbol 11</option>
            </select>
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
          label='Logo'
          hint='JPG, PNG, WEBP o AVIF, hasta 10 MB'
          error={errors.logo?.message}
          className='sm:col-span-2'
        >
          {({ id, describedBy }) => (
            <div className='flex items-center gap-4'>
              <div className='flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface'>
                {displayPreview ? (
                  <img src={displayPreview} alt='' className='size-full object-cover' />
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
                {...register('logo', {
                  validate: (files) => imageFileError(files?.[0]) ?? true,
                  onChange: (e) => {
                    const file = e.target.files?.[0];
                    if (imageFileError(file)) setPreview(null);
                    else readImageFilePreview(file, setPreview);
                    void trigger('logo');
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
