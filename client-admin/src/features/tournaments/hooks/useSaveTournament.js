import { useTournamentsStore } from '../store/tournamentStore';

export const useSaveTournament = () => {
  const { createTournament, updateTournament } = useTournamentsStore();

  const saveTournament = async (data, id) => {
    const formData = new FormData();

    formData.append('tournamentsName', data.tournamentsName);
    formData.append('category', data.category);
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);
    formData.append('description', data.description ?? '');

    if (data.logo?.length > 0) {
      formData.append('logo', data.logo[0]);
    }

    if (id) {
      await updateTournament(id, formData);
    } else {
      await createTournament(formData);
    }
  };

  return { saveTournament };
};
