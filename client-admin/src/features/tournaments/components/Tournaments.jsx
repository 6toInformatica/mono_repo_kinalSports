import { useEffect, useState } from 'react';
import { useTournamentsStore } from '../../tournaments/store/tournamentStore';
import { TournamentModal } from './TournamentModal.jsx';
import { useUIStore } from '../../auth/store/uiStore.js';
import { resolveCloudinaryUrl } from '../../../shared/utils/cloudinary.js';
import { CAPACITY_LABELS, formatDate } from '../../../shared/utils/formatters.js';
import { showSuccess } from '../../../shared/utils/toast.js';
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

export const Tournaments = () => {
  const { tournaments, loading, error, getTournaments, deleteTournament } = useTournamentsStore();

  const [openModal, setOpenModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const { openConfirm } = useUIStore();

  useEffect(() => {
    getTournaments();
  }, [getTournaments]);

  const handleDeactivate = (tournament) => {
    openConfirm({
      title: 'Desactivar torneo',
      message: `¿Desactivar ${tournament.tournamentsName}?`,
      confirmLabel: 'Desactivar',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteTournament(tournament._id);
          showSuccess('Torneo desactivado');
        } catch {
          // El store establece el error
        }
      },
    });
  };

  return (
    <section className='flex flex-col gap-6'>
      <PageHeader
        title='Torneos'
        description='Torneos, sus fechas y equipos inscritos'
        action={
          <Button
            onClick={() => {
              setSelectedTournament(null);
              setOpenModal(true);
            }}
          >
            <PlusIcon /> Nuevo torneo
          </Button>
        }
      />

      {error && <ErrorState message={error} onRetry={getTournaments} />}

      {loading && !openModal && tournaments.length === 0 ? (
        <CardGridSkeleton />
      ) : tournaments.length === 0 && !error ? (
        <EmptyState
          title='Sin torneos'
          message='Crea un torneo para que los equipos se inscriban.'
        />
      ) : (
        <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
          {tournaments.map((tournament) => (
            <EntityCard
              key={tournament._id}
              image={resolveCloudinaryUrl(tournament.logo, null)}
              imageFallback={defaultLogo}
              title={tournament.tournamentsName}
              badges={
                <>
                  <Badge>{CAPACITY_LABELS[tournament.category] ?? tournament.category}</Badge>
                  {tournament.status && <Badge tone='neutral'>{tournament.status}</Badge>}
                </>
              }
              onEdit={() => {
                setSelectedTournament(tournament);
                setOpenModal(true);
              }}
              onDeactivate={() => handleDeactivate(tournament)}
            >
              <p>
                {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
              </p>
              <p>Equipos: {tournament.teams?.length ?? 0}</p>
              <p className='line-clamp-2'>{tournament.description}</p>
            </EntityCard>
          ))}
        </div>
      )}

      <TournamentModal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedTournament(null);
        }}
        tournament={selectedTournament}
      />
    </section>
  );
};
