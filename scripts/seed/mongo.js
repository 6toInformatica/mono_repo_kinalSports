// Datos de prueba para desarrollo local (MongoDB: canchas, equipos, torneos y reservas).
// Se ejecuta con mongosh. Es idempotente: usa _id fijos y reemplaza los documentos.
// Las fechas son relativas al día de ejecución (hora de Guatemala, UTC-6).
/* global db, ObjectId, print */

const oid = (p, i) => ObjectId(p + String(i).padStart(24 - p.length, "0"));
const U = (i) => "usr_SeedUser00" + String(i).padStart(2, "0");
const now = new Date();
const up = (c, d) => {
  const t = { createdAt: now, updatedAt: now, ...d };
  db[c].replaceOne({ _id: d._id }, t, { upsert: true });
};
const gtDay = (o) =>
  new Date(Date.now() + o * 864e5 - 6 * 36e5).toISOString().slice(0, 10);
const at = (o, h) =>
  new Date(`${gtDay(o)}T${String(h).padStart(2, "0")}:00:00-06:00`);
const P = "fields/kinal_sports_nyvxo5";
[
  [
    "Cancha Central",
    "SINTETICA",
    "FUTBOL_11",
    350,
    "Cancha principal con iluminación y graderíos.",
  ],
  [
    "Cancha Norte",
    "SINTETICA",
    "FUTBOL_7",
    200,
    "Grama sintética, ideal para ligas nocturnas.",
  ],
  ["Cancha Sur", "NATURAL", "FUTBOL_11", 300, "Grama natural con vestidores."],
  [
    "Cancha Los Pinos",
    "SINTETICA",
    "FUTBOL_7",
    180,
    "Rodeada de áreas verdes y parqueo.",
  ],
  [
    "Mini Kinal",
    "CONCRETO",
    "FUTBOL_5",
    100,
    "Cancha techada para partidos rápidos.",
  ],
  [
    "Cancha Escolar",
    "CONCRETO",
    "FUTBOL_5",
    80,
    "Cancha económica para entrenamientos.",
  ],
].forEach((f, i) =>
  up("fields", {
    _id: oid("5eed0f", i + 1),
    fieldName: f[0],
    fieldType: f[1],
    capacity: f[2],
    pricePerHour: f[3],
    description: f[4],
    photo: P,
    isActive: true,
  }),
);
const N = [
  "Pablo Reyes",
  "Mateo Cruz",
  "Andres Vega",
  "Kevin Soto",
  "Oscar Lima",
  "Bryan Paz",
  "Hugo Rios",
  "Erick Mejia",
  "Samuel Ortiz",
];
[
  ["Los Halcones", "FUTBOL_7", 2, [3, 4], 6],
  ["Real Kinal", "FUTBOL_7", 3, [5], 5],
  ["Atletico Mixco", "FUTBOL_7", 4, [6, 7], 4],
  ["Deportivo Zona 7", "FUTBOL_11", 5, [2, 8], 9],
  ["Union Guate", "FUTBOL_11", 6, [3], 8],
  ["Tigres FC", "FUTBOL_11", 7, [4, 5], 7],
].forEach((t, i) =>
  up("teams", {
    _id: oid("5eed7e", i + 1),
    teamName: t[0],
    managerId: U(t[2]),
    category: t[1],
    members: [U(t[2]), ...t[3].map(U)],
    namedMembers: N.slice(0, t[4]).map((name) => ({
      _id: new ObjectId(),
      name,
    })),
    logo: P,
    isActive: true,
  }),
);
const T = (i) => oid("5eed7e", i);
[
  [
    "Copa Kinal 7",
    "FUTBOL_7",
    15,
    45,
    [1, 2],
    "PENDIENTE",
    "Torneo abierto de fútbol 7.",
  ],
  [
    "Liga Apertura 11",
    "FUTBOL_11",
    30,
    75,
    [4],
    "PENDIENTE",
    "Liga de fútbol 11, inscripciones abiertas.",
  ],
  [
    "Torneo Relámpago",
    "FUTBOL_7",
    -5,
    10,
    [1, 2, 3],
    "EN PROGRESO",
    "Torneo corto en curso.",
  ],
  [
    "Clausura 11",
    "FUTBOL_11",
    -60,
    -20,
    [4, 5, 6],
    "TERMINADO",
    "Torneo finalizado.",
  ],
].forEach((t, i) =>
  up("tournaments", {
    _id: oid("5eed70", i + 1),
    tournamentsName: t[0],
    category: t[1],
    startDate: at(t[2], 12),
    endDate: at(t[3], 12),
    teams: t[4].map(T),
    status: t[5],
    isActive: true,
    description: t[6],
    logo: P,
  }),
);
[
  [2, 1, 1, 10, 12, "PENDING"],
  [3, 2, 1, 18, 20, "CONFIRMED"],
  [4, 3, 2, 8, 10, "PENDING"],
  [5, 1, 2, 16, 19, "CONFIRMED"],
  [6, 4, 3, 19, 21, "PENDING"],
  [7, 5, 3, 7, 8, "CONFIRMED"],
  [8, 2, 4, 17, 19, "PENDING"],
  [2, 6, 5, 9, 11, "CONFIRMED"],
  [3, 3, 6, 14, 16, "CANCELLED"],
  [4, 1, -2, 18, 20, "COMPLETED"],
  [5, 2, -3, 10, 12, "COMPLETED"],
  [6, 4, -4, 16, 18, "NO_SHOW"],
  [7, 3, -6, 9, 11, "COMPLETED"],
].forEach((r, i) =>
  up("reservations", {
    _id: oid("5eedae", i + 1),
    userId: U(r[0]),
    fieldId: oid("5eed0f", r[1]),
    startTime: at(r[2], r[3]),
    endTime: at(r[2], r[4]),
    status: r[5],
    lastModifiedBy: null,
  }),
);
print(
  JSON.stringify({
    fields: db.fields.countDocuments(),
    teams: db.teams.countDocuments(),
    tournaments: db.tournaments.countDocuments(),
    reservations: db.reservations.countDocuments(),
  }),
);
