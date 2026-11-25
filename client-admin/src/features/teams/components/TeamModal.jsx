import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTeamsStore } from '../../teams/store/teamStore';
import { useSaveTeam } from '../../teams/hooks/useSaveTeam';
import { useUserManagementStore } from '../../users/store/useUserManagementStore';
import { resolveCloudinaryUrl } from '../../../shared/utils/cloudinary.js';
import { readImageFilePreview, sanitizeImageSrc } from '../../../shared/utils/imagePreview.js';
import { fullName } from '../../../shared/utils/formatters.js';
import { showSuccess } from '../../../shared/utils/toast.js';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { Modal } from '../../../shared/components/ui/Modal.jsx';
import { FieldWrapper, TextField } from '../../../shared/components/ui/fields.jsx';
import { CONTROL, borderFor } from '../../../shared/components/ui/uiConstants.js';

const userLabel = (user) => `${fullName(user) || user.username} (@${user.username})`;

export const TeamModal = ({ isOpen, onClose, team }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const { saveTeam } = useSaveTeam();
  const loading = useTeamsStore((state) => state.loading);
  const { users, fetchUsers } = useUserManagementStore();

  const [filePreview, setFilePreview] = useState(null);
  const [namedMembers, setNamedMembers] = useState([]);
  const [memberName, setMemberName] = useState('');

  const displayPreview = sanitizeImageSrc(filePreview || resolveCloudinaryUrl(team?.logo, null));

  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [prevTeam, setPrevTeam] = useState(team);
  if (isOpen !== prevOpen || team !== prevTeam) {
    if (isOpen !== prevOpen) {
      setFilePreview(null);
    }
    setPrevOpen(isOpen);
    setPrevTeam(team);
    if (isOpen) {
      setNamedMembers(team?.namedMembers?.map((m) => m.name) ?? []);
      setMemberName('');
    }
  }

  useEffect(() => {
    if (isOpen && (!users || users.length === 0)) {
      fetchUsers();
    }
  }, [isOpen, users, fetchUsers]);

  useEffect(() => {
    if (isOpen) {
      if (team) {
        reset({
          teamName: team.teamName,
          managerId: team.managerId,
          category: team.category,
        });
      } else {
        reset({
          teamName: '',
          managerId: '',
          category: '',
          logo: null,
        });
      }
    }
  }, [isOpen, reset, team]);

  const onSubmit = async (data) => {
    try {
      await saveTeam(
        { ...data, managerId: team ? team.managerId : data.managerId, namedMembers },
        team?._id
      );
      showSuccess(team ? 'Equipo actualizado' : 'Equipo creado');
      reset();
      setFilePreview(null);
      setNamedMembers([]);
      setMemberName('');
      onClose();
    } catch {
      // El store registra el error y la vista lo muestra por toast
    }
  };

  const handleAddMember = () => {
    const trimmed = memberName.trim();
    if (!trimmed) return;
    setNamedMembers((prev) => [...prev, trimmed]);
    setMemberName('');
  };

  const handleRemoveMember = (index) => {
    setNamedMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    reset();
    setFilePreview(null);
    onClose();
  };

  const manager = team ? users?.find((u) => u.id === team.managerId) : undefined;

  return (
    <Modal
      open={isOpen}
      title={team ? 'Editar equipo' : 'Nuevo equipo'}
      onClose={handleCancel}
      size='lg'
      footer={
        <>
          <Button variant='secondary' onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type='submit' form='team-form' loading={loading}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id='team-form'
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className='grid gap-4 sm:grid-cols-2'
      >
        <FieldWrapper
          label='Nombre del equipo'
          error={errors.teamName?.message}
          className='sm:col-span-2'
        >
          {({ id, describedBy }) => (
            <input
              id={id}
              aria-invalid={Boolean(errors.teamName) || undefined}
              aria-describedby={describedBy}
              className={`${CONTROL} ${borderFor(errors.teamName?.message)}`}
              {...register('teamName', {
                required: 'El nombre es obligatorio',
                minLength: {
                  value: 3,
                  message: 'Debe tener al menos 3 caracteres',
                },
              })}
            />
          )}
        </FieldWrapper>

        {team ? (
          <TextField
            label='Manager'
            value={manager ? userLabel(manager) : team.managerId}
            disabled
            hint='El manager no se puede cambiar'
          />
        ) : (
          <FieldWrapper label='Manager' error={errors.managerId?.message}>
            {({ id, describedBy }) => (
              <select
                id={id}
                aria-invalid={Boolean(errors.managerId) || undefined}
                aria-describedby={describedBy}
                className={`${CONTROL} ${borderFor(errors.managerId?.message)}`}
                {...register('managerId', {
                  required: 'El manager es obligatorio',
                })}
              >
                <option value=''>Seleccione un usuario</option>
                {(users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {userLabel(u)}
                  </option>
                ))}
              </select>
            )}
          </FieldWrapper>
        )}

        <FieldWrapper label='Categoría' error={errors.category?.message}>
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
              <option value=''>Seleccione categoría</option>
              <option value='FUTBOL_7'>Fútbol 7</option>
              <option value='FUTBOL_11'>Fútbol 11</option>
            </select>
          )}
        </FieldWrapper>

        <div className='flex flex-col gap-2 sm:col-span-2'>
          <div className='flex items-end gap-2'>
            <TextField
              label='Integrantes por nombre'
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMember();
                }
              }}
              className='flex-1'
            />
            <Button variant='secondary' onClick={handleAddMember}>
              Agregar
            </Button>
          </div>
          {namedMembers.length > 0 && (
            <ul className='flex flex-wrap gap-2'>
              {namedMembers.map((name, index) => (
                <li
                  key={`${name}-${index}`}
                  className='flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-3 pr-1 text-sm text-brand'
                >
                  {name}
                  <button
                    type='button'
                    aria-label={`Quitar a ${name}`}
                    onClick={() => handleRemoveMember(index)}
                    className='flex size-7 items-center justify-center rounded-full hover:bg-white'
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <FieldWrapper label='Logo' hint='JPG, PNG o WEBP, hasta 10 MB' className='sm:col-span-2'>
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
                  onChange: (e) => {
                    readImageFilePreview(e.target.files?.[0], setFilePreview);
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
