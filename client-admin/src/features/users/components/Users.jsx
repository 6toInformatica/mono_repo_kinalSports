import { useEffect, useMemo, useState } from 'react';
import { useUserManagementStore } from '../store/useUserManagementStore.js';
import { useAuthStore } from '../../auth/store/authStore.js';
import { CreateUserModal } from './CreateUserModal.jsx';
import { UserDetailModal } from './UserDetailModal.jsx';
import { deactivateUser, updateUser } from '../../../shared/api/auth.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { ROLE_LABELS, fullName } from '../../../shared/utils/formatters.js';
import { Button } from '../../../shared/components/ui/Button.jsx';
import {
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from '../../../shared/components/ui/feedback.jsx';
import { SelectField, TextField } from '../../../shared/components/ui/fields.jsx';
import { PlusIcon } from '../../../shared/components/ui/icons.jsx';
import { Avatar, FilterBar, Pagination, TableCard } from '../../../shared/components/ui/table.jsx';
import { TD, TH, paginate } from '../../../shared/components/ui/uiConstants.js';

const PAGE_SIZE = 8;
const ROLE_OPTIONS = [
  { value: 'ADMIN_ROLE', label: ROLE_LABELS.ADMIN_ROLE },
  { value: 'USER_ROLE', label: ROLE_LABELS.USER_ROLE },
];

export const Users = () => {
  const { users, loading, error, fetchUsers, updateUserRole } = useUserManagementStore();
  const registerUser = useAuthStore((state) => state.register);
  const currentUser = useAuthStore((state) => state.user);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !term ||
        fullName(user).toLowerCase().includes(term) ||
        (user.username ?? '').toLowerCase().includes(term);
      const matchesRole = !role || (user.role ?? '').toUpperCase() === role;
      return matchesSearch && matchesRole;
    });
  }, [users, search, role]);

  const view = paginate(filtered, page, PAGE_SIZE);

  const handleOpenDetail = (user) => {
    setSelectedUser(user);
    setOpenDetailModal(true);
  };

  const handleSave = async (user, values) => {
    try {
      await updateUser(user.id, {
        name: values.name,
        surname: values.surname,
        username: values.username,
        email: values.email,
        phone: values.phone,
      });
      if (values.role !== user.role && user.id !== currentUser?.id) {
        const res = await updateUserRole(user.id, values.role);
        if (!res.success) {
          showError(res.error || 'Los datos se guardaron, pero el rol no cambió');
          await fetchUsers(undefined, { force: true });
          return;
        }
      }
      showSuccess('Usuario actualizado');
      setOpenDetailModal(false);
      setSelectedUser(null);
      await fetchUsers(undefined, { force: true });
    } catch (error) {
      showError(error.response?.data?.message || 'No se pudo actualizar el usuario');
    }
  };

  const handleDeactivate = async (user) => {
    try {
      await deactivateUser(user.id);
      showSuccess('Usuario desactivado');
      setOpenDetailModal(false);
      setSelectedUser(null);
      await fetchUsers(undefined, { force: true });
    } catch (error) {
      showError(error.response?.data?.message || 'No se pudo desactivar el usuario');
    }
  };

  const handleCreate = async (formData) => {
    const res = await registerUser(formData);
    if (res.success) {
      showSuccess('Usuario creado. Se envió correo de verificación.');
      await fetchUsers(undefined, { force: true });
      return true;
    }
    showError(res.error || 'No se pudo crear el usuario');
    return false;
  };

  return (
    <section className='flex flex-col gap-6'>
      <PageHeader
        title='Usuarios'
        description='Administra usuarios: edita sus datos, cambia su rol o desactiva la cuenta'
        action={
          <Button onClick={() => setOpenCreateModal(true)}>
            <PlusIcon /> Nuevo usuario
          </Button>
        }
      />

      <FilterBar>
        <TextField
          label='Buscar'
          type='search'
          placeholder='Nombre o usuario'
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className='w-full sm:w-72'
        />
        <SelectField
          label='Rol'
          value={role}
          placeholder='Todos los roles'
          options={ROLE_OPTIONS}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(1);
          }}
          className='w-full sm:w-52'
        />
      </FilterBar>

      {error && (
        <ErrorState message={error} onRetry={() => void fetchUsers(undefined, { force: true })} />
      )}

      {loading && users.length === 0 ? (
        <TableCard>
          <TableSkeleton columns={4} />
        </TableCard>
      ) : filtered.length === 0 && !error ? (
        <EmptyState title='Sin usuarios' message='Ningún usuario coincide con los filtros.' />
      ) : (
        <TableCard
          footer={
            <Pagination
              page={view.current}
              totalPages={view.totalPages}
              total={filtered.length}
              onChange={setPage}
            />
          }
        >
          <table className='w-full min-w-[640px]'>
            <thead className='bg-surface'>
              <tr>
                <th className={TH}>Usuario</th>
                <th className={TH}>Correo</th>
                <th className={TH}>Rol</th>
                <th className={`${TH} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {view.items.map((user) => (
                <tr key={user.id} className='border-t border-line'>
                  <td className={TD}>
                    <div className='flex items-center gap-3'>
                      <Avatar src={user.profilePicture} />
                      <div className='min-w-0'>
                        <p className='truncate font-semibold'>
                          {fullName(user) || user.username}
                          {user.id === currentUser?.id && (
                            <span className='ml-2 text-xs font-normal text-ink-soft'>(tú)</span>
                          )}
                        </p>
                        <p className='truncate text-xs text-ink-soft'>@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`${TD} break-all`}>{user.email}</td>
                  <td className={TD}>
                    <Badge tone={user.role === 'ADMIN_ROLE' ? 'info' : 'neutral'}>
                      {ROLE_LABELS[user.role ?? ''] ?? user.role}
                    </Badge>
                  </td>
                  <td className={`${TD} text-right`}>
                    <Button size='sm' variant='secondary' onClick={() => handleOpenDetail(user)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      <CreateUserModal
        isOpen={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onCreate={handleCreate}
        loading={loading}
      />

      <UserDetailModal
        key={selectedUser?.id || 'no-user'}
        isOpen={openDetailModal}
        onClose={() => {
          setOpenDetailModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        currentUserId={currentUser?.id}
        onSave={handleSave}
        onDeactivate={handleDeactivate}
        loading={loading}
      />
    </section>
  );
};
