import { useEffect, useState } from 'react';
import { useTeamsStore } from '../../teams/store/teamStore';
import { TeamModal } from './TeamModal.jsx';
import { useUIStore } from '../../auth/store/uiStore';
import { useUserManagementStore } from '../../users/store/useUserManagementStore';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { resolveCloudinaryUrl } from '../../../shared/utils/cloudinary.js';
import { CAPACITY_LABELS, fullName } from '../../../shared/utils/formatters.js';
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
import defaultLogo from '../../../assets/img/kinal_sports.png';

export const Teams = () => {
  const { teams, loading, error, getTeams, deleteTeam } = useTeamsStore();
  const { users, fetchUsers } = useUserManagementStore();
  const [openModal, setOpenModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { openConfirm } = useUIStore();

  useEffect(() => {
    getTeams();
    if (users?.length === 0) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  const handleDeactivate = (team) => {
    openConfirm({
      title: 'Desactivar equipo',
      message: `¿Desactivar ${team.teamName}?`,
      confirmLabel: 'Desactivar',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteTeam(team._id);
          showSuccess('Equipo desactivado');
        } catch {
          // El store establece el error
        }
      },
    });
  };

  return (
    <section className='flex flex-col gap-6'>
      <PageHeader
        title='Equipos'
        description='Equipos registrados, su manager e integrantes'
        action={
          <Button
            onClick={() => {
              setSelectedTeam(null);
              setOpenModal(true);
            }}
          >
            <PlusIcon /> Nuevo equipo
          </Button>
        }
      />

      {error && <ErrorState message={error} onRetry={getTeams} />}

      {loading && !openModal && teams.length === 0 ? (
        <CardGridSkeleton />
      ) : teams.length === 0 && !error ? (
        <EmptyState title='Sin equipos' message='Todavía no hay equipos registrados.' />
      ) : (
        <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
          {teams.map((team) => {
            const manager = users?.find((u) => u.id === team.managerId);
            const named = team.namedMembers?.length ?? 0;
            const total = (team.members?.length ?? 0) + named;

            return (
              <EntityCard
                key={team._id}
                image={resolveCloudinaryUrl(team.logo, null)}
                imageFallback={defaultLogo}
                title={team.teamName}
                badges={<Badge>{CAPACITY_LABELS[team.category] ?? team.category}</Badge>}
                onEdit={() => {
                  setSelectedTeam(team);
                  setOpenModal(true);
                }}
                onDeactivate={() => handleDeactivate(team)}
              >
                <p>
                  Manager:{' '}
                  {manager ? fullName(manager) || manager.username : `ID: ${team.managerId}`}
                </p>
                <p>
                  {total} miembros{named > 0 ? ` (${named} por nombre)` : ''}
                </p>
                {named > 0 && (
                  <p className='line-clamp-2'>
                    Roster: {team.namedMembers.map((m) => m.name).join(', ')}
                  </p>
                )}
              </EntityCard>
            );
          })}
        </div>
      )}

      <TeamModal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedTeam(null);
        }}
        team={selectedTeam}
      />
    </section>
  );
};
