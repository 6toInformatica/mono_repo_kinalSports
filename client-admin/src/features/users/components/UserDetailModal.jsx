import { useState } from 'react';
import { ROLE_LABELS, fullName } from '../../../shared/utils/formatters.js';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { SelectField, TextField } from '../../../shared/components/ui/fields.jsx';
import { Modal } from '../../../shared/components/ui/Modal.jsx';
import { Avatar } from '../../../shared/components/ui/table.jsx';
import { useUIStore } from '../../auth/store/uiStore.js';

const ROLE_OPTIONS = [
  { value: 'ADMIN_ROLE', label: ROLE_LABELS.ADMIN_ROLE },
  { value: 'USER_ROLE', label: ROLE_LABELS.USER_ROLE },
];

const validate = (form) => {
  const errors = {};
  const name = String(form.get('name') ?? '').trim();
  const surname = String(form.get('surname') ?? '').trim();
  const username = String(form.get('username') ?? '').trim();
  const phone = String(form.get('phone') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  if (!name) errors.name = 'El nombre es obligatorio';
  if (!surname) errors.surname = 'El apellido es obligatorio';
  if (!username) errors.username = 'El nombre de usuario es obligatorio';
  else if (username.length < 3) errors.username = 'Debe tener al menos 3 caracteres';
  if (!/^[0-9]{8}$/.test(phone)) errors.phone = 'Debe ser un número de 8 dígitos';
  if (!email) errors.email = 'El email es obligatorio';
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Formato de email inválido';
  return errors;
};

export const UserDetailModal = ({
  isOpen,
  onClose,
  user,
  currentUserId,
  onSave,
  onDeactivate,
  loading,
}) => {
  const { openConfirm } = useUIStore();
  const [role, setRole] = useState(user?.role || 'USER_ROLE');
  const [errors, setErrors] = useState({});

  if (!isOpen || !user) return null;

  const isSelf = currentUserId === user.id;

  const handleSave = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    void onSave(user, {
      name: String(form.get('name')).trim(),
      surname: String(form.get('surname')).trim(),
      username: String(form.get('username')).trim(),
      email: String(form.get('email')).trim(),
      phone: String(form.get('phone')).trim(),
      role,
    });
  };

  const handleDeactivate = () => {
    openConfirm({
      title: 'Desactivar usuario',
      message: `¿Desactivar a ${fullName(user) || user.username}? La cuenta deja de poder entrar, pero el registro se conserva.`,
      onConfirm: () => onDeactivate(user),
    });
  };

  return (
    <Modal
      open={isOpen}
      title={fullName(user) || user.username || 'Usuario'}
      onClose={onClose}
      footer={
        <>
          <Button variant='danger-outline' onClick={handleDeactivate} disabled={isSelf}>
            Desactivar
          </Button>
          <Button variant='secondary' onClick={onClose}>
            Cerrar
          </Button>
          <Button type='submit' form='user-detail-form' loading={loading}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id='user-detail-form'
        noValidate
        onSubmit={handleSave}
        className='grid gap-4 sm:grid-cols-2'
      >
        <div className='sm:col-span-2'>
          <Avatar src={user.profilePicture} size={64} />
        </div>
        <TextField label='Nombre' name='name' defaultValue={user.name} error={errors.name} />
        <TextField
          label='Apellido'
          name='surname'
          defaultValue={user.surname}
          error={errors.surname}
        />
        <TextField
          label='Usuario'
          name='username'
          defaultValue={user.username}
          error={errors.username}
        />
        <TextField label='Teléfono' name='phone' defaultValue={user.phone} error={errors.phone} />
        <TextField
          label='Correo'
          name='email'
          type='email'
          defaultValue={user.email}
          error={errors.email}
          className='sm:col-span-2'
        />
        <SelectField
          label='Rol'
          value={role}
          options={ROLE_OPTIONS}
          onChange={(event) => setRole(event.target.value)}
          disabled={isSelf}
          hint={isSelf ? 'No puedes cambiar tu propio rol ni desactivar tu cuenta' : undefined}
          className='sm:col-span-2'
        />
      </form>
    </Modal>
  );
};
