// Fechas en español de Guatemala, con la zona horaria del negocio
const TIME_ZONE = "America/Guatemala";

export const formatDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("es-GT", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

export const formatTime = (iso: string | Date) =>
  new Date(iso).toLocaleTimeString("es-GT", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export const formatLongDate = (date: Date) =>
  date.toLocaleDateString("es-GT", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

/** YYYY-MM-DD del día en la zona horaria del negocio */
export const businessDay = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

/** YYYY-MM-DD para un <input type="date"> */
export const toDateInput = (iso?: string | null) =>
  iso ? iso.slice(0, 10) : "";

export const CAPACITY_LABELS: Record<string, string> = {
  FUTBOL_5: "Fútbol 5",
  FUTBOL_7: "Fútbol 7",
  FUTBOL_11: "Fútbol 11",
};

export const FIELD_TYPE_LABELS: Record<string, string> = {
  SINTETICA: "Sintética",
  NATURAL: "Natural",
  CONCRETO: "Concreto",
};

export const fullName = (user: { name?: string; surname?: string }) =>
  [user.name, user.surname].filter(Boolean).join(" ").trim();
