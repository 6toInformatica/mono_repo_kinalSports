import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTeamsStore } from '../../teams/store/teamStore';
import { Spinner } from '../../auth/components/Spinner.jsx';
import { useSaveTeam } from '../../teams/hooks/useSaveTeam';
import { UserComboBox } from '../../users/components/UserComboBox.jsx';
import { resolveCloudinaryUrl } from '../../../shared/utils/cloudinary.js';
import defaultTeamImg from '../../../assets/img/avatarDefault-1749508519496.png';

export const TeamModal = ({ isOpen, onClose, team }) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm();

  const { saveTeam } = useSaveTeam();
  const loading = useTeamsStore((state) => state.loading);

  const [filePreview, setFilePreview] = useState(null);
  const [namedMembers, setNamedMembers] = useState([]);
  const [memberName, setMemberName] = useState('');

  const displayPreview = filePreview || resolveCloudinaryUrl(team?.logo, defaultTeamImg);

  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  }

  useEffect(() => {
    if (isOpen) {
      if (team) {
        reset({
          teamName: team.teamName,
          managerId: team.managerId,
          category: team.category,
        });
        setNamedMembers(team.namedMembers?.map((m) => m.name) ?? []);
      } else {
        reset({
          teamName: '',
          managerId: '',
          category: '',
          logo: null,
        });
        setNamedMembers([]);
      }
      setMemberName('');
    }
  }, [isOpen, reset, team]);

  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const onSubmit = async (data) => {
    try {
      await saveTeam({ ...data, namedMembers }, team?._id);
      reset();
      setFilePreview(null);
      setNamedMembers([]);
      setMemberName('');
      onClose();
    } catch (_) {}
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

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 px-3 sm:px-4'>
      {/* CONTENEDOR */}
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden'>
        {/* HEADER */}
        <div
          className='p-4 sm:p-5 text-white sticky top-0 z-10'
          style={{
            background: 'linear-gradient(90deg, var(--main-blue) 0%, #1956a3 100%)',
          }}
        >
          <h2 className='text-xl sm:text-2xl font-bold'>
            {team ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h2>
          <p className='text-xs sm:text-sm opacity-80'>Completa la información del equipo</p>
        </div>

        {/* FORM SCROLL */}
        <form onSubmit={handleSubmit(onSubmit)} className='p-4 sm:p-6 space-y-5 overflow-y-auto'>
          {/* PREVIEW */}
          <div className='flex justify-center'>
            <div className='w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl bg-gray-100 border flex items-center justify-center overflow-hidden shadow-inner'>
              {displayPreview ? (
                <img
                  src={displayPreview}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultTeamImg;
                  }}
                />
              ) : (
                <span className='text-gray-400 text-xs sm:text-sm'>Sin imagen</span>
              )}
            </div>
          </div>

          {/* INPUTS */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Nombre */}
            <div className='flex flex-col md:col-span-2'>
              <label className='text-sm font-semibold text-gray-700 mb-1'>Nombre del equipo</label>
              <input
                className='w-full px-3 py-2 rounded-lg border-2 bg-gray-50 shadow-sm transition'
                style={{ borderColor: 'var(--main-blue)', outline: 'none' }}
                placeholder='Ej. Barcelona FC'
                {...register('teamName', {
                  required: 'El nombre es obligatorio',
                  minLength: {
                    value: 3,
                    message: 'Debe tener al menos 3 caracteres',
                  },
                })}
              />
              {errors.teamName && (
                <p className='text-red-600 text-xs mt-1'>{errors.teamName.message}</p>
              )}
            </div>

            {/* Manager */}
            <div className='flex flex-col'>
              <Controller
                name='managerId'
                control={control}
                rules={{
                  required: !team ? 'El manager es obligatorio' : false,
                }}
                render={({ field }) => (
                  <UserComboBox
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.managerId}
                    disabled={!!team}
                  />
                )}
              />
            </div>

            {/* Categoría */}
            <div className='flex flex-col'>
              <label className='text-sm font-semibold text-gray-700 mb-1'>Categoría</label>
              <select
                className='w-full px-3 py-2 rounded-lg border-2 bg-gray-50 shadow-sm transition'
                style={{ borderColor: 'var(--main-blue)', outline: 'none' }}
                {...register('category', {
                  required: 'La categoría es obligatoria',
                })}
              >
                <option value=''>Seleccione categoría</option>
                <option value='FUTBOL_7'>Fútbol 7</option>
                <option value='FUTBOL_11'>Fútbol 11</option>
              </select>
              {errors.category && (
                <p className='text-red-600 text-xs mt-1'>{errors.category.message}</p>
              )}
            </div>

            {/* Roster por nombre */}
            <div className='flex flex-col md:col-span-2'>
              <label className='text-sm font-semibold text-gray-700 mb-1'>
                Miembros del roster (nombre)
              </label>
              <div className='flex gap-2'>
                <input
                  className='flex-1 px-3 py-2 rounded-lg border-2 bg-gray-50 shadow-sm transition'
                  style={{ borderColor: 'var(--main-blue)', outline: 'none' }}
                  placeholder='Nombre del jugador'
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMember();
                    }
                  }}
                />
                <button
                  type='button'
                  onClick={handleAddMember}
                  className='px-4 py-2 rounded-lg text-white font-medium'
                  style={{ background: 'var(--main-blue)' }}
                >
                  Agregar
                </button>
              </div>
              {namedMembers.length > 0 ? (
                <ul className='mt-2 space-y-1'>
                  {namedMembers.map((name, index) => (
                    <li
                      key={`${name}-${index}`}
                      className='flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm'
                    >
                      <span>{name}</span>
                      <button
                        type='button'
                        onClick={() => handleRemoveMember(index)}
                        className='text-red-600 hover:text-red-800'
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-xs text-gray-500 mt-2'>
                  Puedes agregar jugadores sin cuenta en la app.
                </p>
              )}
            </div>

            {/* Imagen */}
            <div className='flex flex-col md:col-span-2'>
              <label className='text-sm font-semibold text-gray-700 mb-1'>Logo del equipo</label>
              <input
                type='file'
                className='w-full px-3 py-2 rounded-lg border-2 border-dashed bg-gray-50 transition cursor-pointer'
                style={{ borderColor: 'var(--main-blue)', outline: 'none' }}
                accept='image/*'
                {...register('logo', {
                  onChange: (e) => {
                    if (filePreview) URL.revokeObjectURL(filePreview);
                    const file = e.target.files?.[0];
                    setFilePreview(file ? URL.createObjectURL(file) : null);
                  },
                })}
              />
            </div>
          </div>

          {/* BOTONES */}
          <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t'>
            <button
              type='button'
              onClick={() => {
                reset();
                setFilePreview(null);
                onClose();
              }}
              className='w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition'
            >
              Cancelar
            </button>

            <button
              type='submit'
              className='w-full sm:w-auto px-5 py-2 rounded-lg text-white font-medium transition shadow'
              style={{
                background: 'linear-gradient(90deg, var(--main-blue) 0%, #1956a3 100%)',
                border: 'none',
              }}
            >
              {loading ? <Spinner small /> : team ? 'Guardar cambios' : 'Crear equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
