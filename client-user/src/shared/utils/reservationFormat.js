const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-GT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveFieldSource = (reservation) => {
  if (reservation.fieldId && typeof reservation.fieldId === "object") {
    return reservation.fieldId;
  }
  if (reservation.field && typeof reservation.field === "object") {
    return reservation.field;
  }
  return null;
};

const computeTotalPrice = (reservation, fieldSource) => {
  const pricePerHour = fieldSource?.pricePerHour ?? fieldSource?.price ?? null;
  if (!pricePerHour || !reservation.startTime || !reservation.endTime)
    return null;

  const hours =
    (new Date(reservation.endTime).getTime() -
      new Date(reservation.startTime).getTime()) /
    (1000 * 60 * 60);

  if (hours <= 0) return null;
  return Math.round(pricePerHour * hours);
};

export const mapReservation = (reservation) => {
  const fieldSource = resolveFieldSource(reservation);

  return {
    ...reservation,
    field: {
      id:
        fieldSource?._id ??
        fieldSource?.id ??
        (typeof reservation.fieldId === "string" ? reservation.fieldId : null),
      name: fieldSource?.fieldName ?? fieldSource?.name ?? "Cancha",
      image: fieldSource?.photo ?? fieldSource?.image ?? null,
      pricePerHour: fieldSource?.pricePerHour ?? fieldSource?.price ?? null,
    },
    displayDate: formatDate(reservation.startTime),
    displayStartTime: formatTime(reservation.startTime),
    displayEndTime: formatTime(reservation.endTime),
    totalPrice: computeTotalPrice(reservation, fieldSource),
    normalizedStatus: (reservation.status ?? "").toUpperCase(),
  };
};

export const buildReservationDateTime = (date, time) => `${date}T${time}:00`;

export const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatTimeValue = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const parseDateValue = (value) => {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const parseTimeValue = (value) => {
  const [hours, minutes] = (value || "08:00").split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};
