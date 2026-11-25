import { useState } from 'react';
import { ROLE_LABELS, fullName } from '../../../shared/utils/formatters.js';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { SelectField } from '../../../shared/components/ui/fields.jsx';
import { Modal } from '../../../shared/components/ui/Modal.jsx';
import { Avatar } from '../../../shared/components/ui/table.jsx';

const ROLE_OPTIONS = [
  { value: 'ADMIN_ROLE', label: ROLE_LABELS.ADMIN_ROLE },
  { value: 'USER_ROLE', label: ROLE_LABELS.USER_ROLE },
];

export const UserDetailModal = ({ isOpen, onClose, user, currentUserId, onSaveRole, loading }) => {
  const [role, setRole] = useState(user?.role || 'USER_ROLE');

  if (!isOpen || !user) return null;

  const isSelf = currentUserId === user.id;
  const rows = [
    ['Usuario', user.username && `@${user.username}`],
    ['Correo', user.email],
    ['Teléfono', user.phone],
  ];

  const handleSave = async () => {
    if (isSelf || role === user.role) {
      onClose();
      return;
    }
    await onSaveRole(user, role);
  };

  return (
    <Modal
      open={isOpen}
      title={fullName(user) || user.username || 'Usuario'}
      onClose={onClose}
      footer={
        <>
          <Button variant='secondary' onClick={onClose}>
            Cerrar
          </Button>
          <Button
            onClick={() => void handleSave()}
            loading={loading}
            disabled={isSelf || role === user.role}
          >
            Guardar rol
          </Button>
        </>
      }
    >
      <div className='flex flex-col gap-5'>
        <div className='flex items-center gap-4'>
          <Avatar src={user.profilePicture} size={64} />
          <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm'>
            {rows.map(([label, value]) => (
              <div key={label} className='contents'>
                <dt className='text-ink-soft'>{label}</dt>
                <dd className='break-all text-ink'>{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
        <SelectField
          label='Rol'
          value={role}
          options={ROLE_OPTIONS}
          onChange={(event) => setRole(event.target.value)}
          disabled={isSelf}
          hint={isSelf ? 'No puedes cambiar tu propio rol' : undefined}
        />
      </div>
    </Modal>
  );
};
