import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../../features/auth/store/authStore';
import { getMyProfile, updateMyProfilePicture } from '../../api';
import { ROLE_LABELS, fullName } from '../../utils/formatters';
import { readImageFilePreview } from '../../utils/imagePreview';
import { showError, showSuccess } from '../../utils/toast';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/feedback.jsx';
import { Modal } from '../ui/Modal.jsx';
import { Avatar } from '../ui/table.jsx';
import {
  CalendarIcon,
  FieldIcon,
  LogoutIcon,
  OverviewIcon,
  TeamIcon,
  TrophyIcon,
  UserIcon,
} from '../ui/icons.jsx';
import logoImg from '../../../assets/img/kinal_sports.png';

const SECTIONS = [
  { href: '/dashboard', label: 'Vista general', icon: OverviewIcon },
  { href: '/dashboard/reservations', label: 'Reservas', icon: CalendarIcon },
  { href: '/dashboard/fields', label: 'Canchas', icon: FieldIcon },
  { href: '/dashboard/teams', label: 'Equipos', icon: TeamIcon },
  { href: '/dashboard/tournaments', label: 'Torneos', icon: TrophyIcon },
  { href: '/dashboard/users', label: 'Usuarios', icon: UserIcon },
];

const isActive = (pathname, href) =>
  href === '/dashboard' ? pathname === href : pathname.startsWith(href);

function ProfileModal({ user, onClose, onUserUpdated }) {
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(user);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getMyProfile()
      .then((fresh) => {
        if (active && fresh) {
          setProfile((prev) => ({ ...prev, ...fresh }));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const displayName = fullName(profile) || profile?.username || 'Administrador';
  const rows = [
    ['Nombre completo', displayName],
    ['Usuario', profile?.username ? `@${profile.username}` : undefined],
    ['Correo', profile?.email],
    ['Teléfono', profile?.phone],
  ];

  const handleSave = async () => {
    if (!selectedFile) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMyProfilePicture(selectedFile);
      const nextUser = { ...profile, ...updated };
      onUserUpdated?.(nextUser);
      showSuccess('Foto de perfil actualizada');
      onClose();
    } catch (err) {
      showError(err?.response?.data?.message || 'No se pudo actualizar la foto de perfil');
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title='Mi perfil'
      description='Información de tu cuenta de administrador'
      onClose={onClose}
      size='md'
      footer={
        <>
          <Button variant='secondary' onClick={onClose}>
            Cerrar
          </Button>
          {selectedFile && (
            <Button onClick={() => void handleSave()} loading={saving}>
              Guardar foto
            </Button>
          )}
        </>
      }
    >
      <div className='flex flex-col gap-5'>
        <div className='flex items-center gap-4'>
          <Avatar src={preview ?? profile?.profilePicture} size={64} />
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <p className='truncate font-display text-base font-bold text-ink'>{displayName}</p>
              <Badge tone='info'>{ROLE_LABELS[profile?.role] ?? profile?.role}</Badge>
            </div>
            <p className='mt-0.5 truncate text-xs text-ink-soft'>@{profile?.username}</p>
            <input
              ref={fileRef}
              type='file'
              accept='image/jpeg,image/png,image/webp,image/avif'
              className='hidden'
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  setSelectedFile(null);
                  setPreview(null);
                  return;
                }
                setSelectedFile(file);
                readImageFilePreview(file, setPreview);
              }}
            />
            <button
              type='button'
              onClick={() => fileRef.current?.click()}
              className='mt-2 text-xs font-semibold text-brand hover:underline'
            >
              {selectedFile ? 'Elegir otra imagen' : 'Cambiar foto de perfil'}
            </button>
          </div>
        </div>

        <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line pt-4 text-sm'>
          {rows.map(([label, value]) => (
            <div key={label} className='contents'>
              <dt className='text-ink-soft'>{label}</dt>
              <dd className='break-all font-medium text-ink'>{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}

export const Sidebar = ({ user, onLogout }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const name = user
    ? [user.name, user.surname].filter(Boolean).join(' ') || user.username || 'Administrador'
    : 'Administrador';
  const username = user?.username || 'admin';

  const runLogout = () => {
    setLoading(true);
    onLogout?.();
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* Escritorio */}
      <aside className='sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col bg-brand text-white lg:flex'>
        <div className='flex items-center gap-3 px-5 py-6'>
          <img
            src={logoImg}
            alt=''
            width={40}
            height={40}
            className='size-10 rounded-lg bg-white p-1 object-contain'
          />
          <div className='leading-tight'>
            <p className='font-display text-lg font-bold'>Kinal Sports</p>
            <p className='text-xs text-white/70'>Panel de administración</p>
          </div>
        </div>
        <nav aria-label='Secciones' className='flex-1 px-3'>
          <ul className='flex flex-col gap-1'>
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition ${
                      active
                        ? 'bg-white text-brand'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className='m-3 flex items-center gap-2 rounded-xl bg-white/10 p-2'>
          <button
            type='button'
            onClick={() => user && setProfileOpen(true)}
            aria-label='Ver mi perfil'
            title='Ver mi perfil'
            className='flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left transition hover:bg-white/10'
          >
            <Avatar src={user?.profilePicture} />
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold'>{name}</p>
              <p className='truncate text-xs text-white/70'>@{username}</p>
            </div>
          </button>
          <button
            type='button'
            onClick={runLogout}
            disabled={loading}
            aria-label='Cerrar sesión'
            title='Cerrar sesión'
            className='flex size-11 shrink-0 items-center justify-center rounded-[10px] text-white/85 hover:bg-white/10 disabled:opacity-50'
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* Móvil: barra superior y navegación inferior */}
      <header className='sticky top-0 z-20 flex items-center gap-3 bg-brand px-4 py-3 text-white lg:hidden'>
        <img
          src={logoImg}
          alt=''
          width={32}
          height={32}
          className='size-8 rounded-md bg-white p-0.5 object-contain'
        />
        <p className='font-display font-bold'>Kinal Sports</p>
        <button
          type='button'
          onClick={() => user && setProfileOpen(true)}
          aria-label='Ver mi perfil'
          className='ml-auto flex items-center gap-2 rounded-lg p-1 hover:bg-white/10'
        >
          <Avatar src={user?.profilePicture} size={32} />
        </button>
        <button
          type='button'
          onClick={runLogout}
          disabled={loading}
          aria-label='Cerrar sesión'
          className='flex size-11 items-center justify-center rounded-[10px] hover:bg-white/10'
        >
          <LogoutIcon />
        </button>
      </header>
      <nav
        aria-label='Secciones'
        className='fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden'
      >
        <ul className='grid grid-cols-6'>
          {SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                    active ? 'text-brand' : 'text-ink-soft'
                  }`}
                >
                  <Icon />
                  <span className='max-w-full truncate px-0.5'>
                    {item.label.replace('Vista general', 'Inicio')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {profileOpen && user && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onUserUpdated={updateUser}
        />
      )}
    </>
  );
};
