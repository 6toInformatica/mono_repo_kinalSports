import { useTournamentsStore } from '../../features/tournaments/store/tournamentStore.js';
import { useTeamsStore } from '../../features/teams/store/teamStore.js';
import { useFieldsStore } from '../../features/users/store/adminStore.js';
import { useUserManagementStore } from '../../features/users/store/useUserManagementStore.js';

export function resetAppStores() {
  useTournamentsStore.setState({
    tournaments: [],
    loading: false,
    error: null,
  });
  useTeamsStore.setState({
    teams: [],
    loading: false,
    error: null,
  });
  useFieldsStore.setState({
    fields: [],
    reservations: [],
    loading: false,
    error: null,
  });
  useUserManagementStore.setState({
    users: [],
    loading: false,
    error: null,
  });
}
