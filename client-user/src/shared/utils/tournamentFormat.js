export const CATEGORY_LABELS = {
  FUTBOL_7: "Fútbol 7",
  FUTBOL_11: "Fútbol 11",
};

export const STATUS_LABELS = {
  OPEN: "Abierto",
  PENDIENTE: "Pendiente",
  IN_PROGRESS: "En curso",
  "EN PROGRESO": "En curso",
  FINISHED: "Finalizado",
  TERMINADO: "Terminado",
  CANCELLED: "Cancelado",
  CANCELADO: "Cancelado",
};

const PLACEHOLDER_LOGOS = new Set([
  "fields/kinal_sports_nyvxo5",
  "kinal_sports_nyvxo5",
  "kinal_sports/fields/kinal_sports_nyvxo5",
]);

export const formatTournamentDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-GT", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatTournamentDateRange = (startDate, endDate) => {
  const start = formatTournamentDate(startDate);
  if (!start) return "";
  const end = formatTournamentDate(endDate);
  return end ? `${start} — ${end}` : start;
};

export const formatTournamentCategory = (category, sport) =>
  CATEGORY_LABELS[category] ?? category ?? sport ?? "";

export const formatTournamentStatus = (status) => {
  const key = (status ?? "").toUpperCase();
  return STATUS_LABELS[key] ?? status ?? "";
};

export const resolveTournamentLogo = (logo) => {
  const trimmed = logo?.trim();
  if (!trimmed || PLACEHOLDER_LOGOS.has(trimmed)) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return trimmed;
};

export const getTournamentTeamsCount = (tournament) =>
  tournament?.teams?.length ?? tournament?.teamsCount ?? 0;

export const mapTournament = (tournament) => {
  const statusKey = (tournament.status ?? "").toUpperCase();

  return {
    ...tournament,
    displayName:
      tournament.tournamentsName ??
      tournament.name ??
      tournament.tournamentName ??
      "Torneo",
    displayCategory: formatTournamentCategory(
      tournament.category,
      tournament.sport,
    ),
    displayStatus: formatTournamentStatus(tournament.status),
    statusKey,
    displayDateRange: formatTournamentDateRange(
      tournament.startDate,
      tournament.endDate,
    ),
    displayStartDate: formatTournamentDate(tournament.startDate),
    displayEndDate: formatTournamentDate(tournament.endDate),
    logoUrl: resolveTournamentLogo(tournament.logo),
    teamsCount: getTournamentTeamsCount(tournament),
  };
};
