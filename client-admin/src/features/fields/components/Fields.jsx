import { useEffect, useState } from 'react';
import { useFieldsStore } from '../../users/store/adminStore';
import { FieldModal } from './FieldModal.jsx';
import { useUIStore } from '../../auth/store/uiStore.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { resolveCloudinaryUrl } from '../../../shared/utils/cloudinary.js';
import { CAPACITY_LABELS, FIELD_TYPE_LABELS } from '../../../shared/utils/formatters.js';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { EntityCard } from '../../../shared/components/ui/EntityCard.jsx';
import {
  Badge,
  CardGridSkeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from '../../../shared/components/ui/feedback.jsx';
import { PlusIcon } from '../../../shared/components/ui/icons.jsx';
import defaultFieldImg from '../../../assets/img/kinal_sports.png';

export const Fields = () => {
  const { fields, loading, error, getFields, deleteField } = useFieldsStore();
  const [openModal, setOpenModal] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const { openConfirm } = useUIStore();

  useEffect(() => {
    getFields();
  }, [getFields]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  const handleDeactivate = (field) => {
    openConfirm({
      title: 'Desactivar cancha',
      message: `¿Desactivar ${field.fieldName}? Ya no se podrá reservar.`,
      confirmLabel: 'Desactivar',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteField(field._id);
          showSuccess('Cancha desactivada');
        } catch {
          // El store ya establece el error
        }
      },
    });
  };

  return (
    <section className='flex flex-col gap-6'>
      <PageHeader
        title='Canchas'
        description='Administra las canchas disponibles para reservar'
        action={
          <Button
            onClick={() => {
              setSelectedField(null);
              setOpenModal(true);
            }}
          >
            <PlusIcon /> Nueva cancha
          </Button>
        }
      />

      {error && <ErrorState message={error} onRetry={getFields} />}

      {loading && !openModal && fields.length === 0 ? (
        <CardGridSkeleton />
      ) : fields.length === 0 && !error ? (
        <EmptyState
          title='Sin canchas'
          message='Crea la primera cancha para empezar a recibir reservas.'
        />
      ) : (
        <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
          {fields.map((field) => (
            <EntityCard
              key={field._id}
              image={resolveCloudinaryUrl(field.photo, null)}
              imageFallback={defaultFieldImg}
              title={field.fieldName}
              badges={
                <>
                  <Badge>{CAPACITY_LABELS[field.capacity] ?? field.capacity}</Badge>
                  <Badge tone='neutral'>
                    {FIELD_TYPE_LABELS[field.fieldType] ?? field.fieldType}
                  </Badge>
                </>
              }
              onEdit={() => {
                setSelectedField(field);
                setOpenModal(true);
              }}
              onDeactivate={() => handleDeactivate(field)}
            >
              <p className='font-semibold text-ink'>
                Q{Number(field.pricePerHour).toFixed(2)} / hora
              </p>
              <p className='line-clamp-2'>{field.description}</p>
            </EntityCard>
          ))}
        </div>
      )}

      <FieldModal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedField(null);
        }}
        field={selectedField}
      />
    </section>
  );
};
