// Datos iniciales de Kinal Sports (MongoDB: canchas, equipos, torneos, reservas y perfiles).
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
const PHOTO = "fields/kinal_sports_nyvxo5";

// [nombre, superficie, formato, precio por hora (Q), descripción]
const fields = [
  [
    "Estadio Kinal",
    "NATURAL",
    "FUTBOL_11",
    450,
    "Cancha principal de grama natural con graderío techado, iluminación LED y vestidores. Sede de las finales intercarreras.",
  ],
  [
    "Cancha Sintética Norte",
    "SINTETICA",
    "FUTBOL_7",
    275,
    "Grama sintética de última generación con iluminación para partidos nocturnos hasta las 22:00.",
  ],
  [
    "Cancha Sintética Sur",
    "SINTETICA",
    "FUTBOL_7",
    250,
    "Junto al parqueo de visitantes; incluye bancas techadas y marcador manual.",
  ],
  [
    "Cancha Techada Zona 7",
    "CONCRETO",
    "FUTBOL_5",
    180,
    "Cancha bajo techo con piso de concreto pulido, ideal para jugar en temporada de lluvia.",
  ],
  [
    "Cancha de Entrenamiento",
    "SINTETICA",
    "FUTBOL_7",
    200,
    "Utilizada por las selecciones de Kinal para entrenamientos entre semana.",
  ],
  [
    "Cancha Polideportiva",
    "CONCRETO",
    "FUTBOL_5",
    150,
    "Cancha multiuso con porterías de futsal, a un costado del edificio de talleres.",
  ],
];
fields.forEach((f, i) =>
  up("fields", {
    _id: oid("5eed0f", i + 1),
    fieldName: f[0],
    fieldType: f[1],
    capacity: f[2],
    pricePerHour: f[3],
    description: f[4],
    photo: PHOTO,
    isActive: true,
  }),
);

// [nombre, formato, encargado, miembros con cuenta, jugadores sin cuenta]
const teams = [
  [
    "Informática FC",
    "FUTBOL_7",
    2,
    [3, 11],
    ["Kevin Ajú", "Brandon Xicará", "Pablo Sic", "Erick Coyoy"],
  ],
  [
    "Electrónica United",
    "FUTBOL_7",
    4,
    [9],
    [
      "Mario Boror",
      "Selvin Chávez",
      "Juan Pablo Tuc",
      "Henry Quiñónez",
      "Óscar Patzán",
    ],
  ],
  [
    "Mecánica Automotriz",
    "FUTBOL_7",
    5,
    [7],
    ["Edgar Cux", "Wilson Pirir", "Cristian Ixcoy", "Marvin Toj"],
  ],
  [
    "Dibujo Técnico",
    "FUTBOL_7",
    6,
    [10, 12],
    ["Ana Lucía Gómez", "Sofía Barrios", "Paola Chacón"],
  ],
  [
    "Electricidad Industrial",
    "FUTBOL_11",
    7,
    [5, 9],
    [
      "Rony Sajché",
      "Byron Culajay",
      "Josué Lemus",
      "Walter Monterroso",
      "Alex Ordóñez",
      "Gerson Ramos",
      "Luis Fernando Tzul",
      "David Archila",
    ],
  ],
  [
    "Diseño Gráfico",
    "FUTBOL_11",
    8,
    [4, 10],
    [
      "Mónica Escobar",
      "Andrea Solares",
      "Isabel Coronado",
      "Lucía Figueroa",
      "Karla Aguilar",
      "Fátima Rosales",
      "Melany Pineda",
    ],
  ],
  [
    "Contabilidad Kinal",
    "FUTBOL_11",
    9,
    [3],
    [
      "Fernando Lix",
      "Jorge Mazariegos",
      "Esteban Velásquez",
      "Raúl Sandoval",
      "Iván Recinos",
      "Carlos Bámaca",
      "Douglas Sir",
    ],
  ],
  [
    "Exalumnos Kinal",
    "FUTBOL_11",
    11,
    [2, 7],
    [
      "Julio Estrada",
      "Rodrigo Cabrera",
      "Hugo Menchú",
      "Allan Dubón",
      "Nery Galindo",
      "Manuel Batz",
    ],
  ],
];
teams.forEach((t, i) =>
  up("teams", {
    _id: oid("5eed7e", i + 1),
    teamName: t[0],
    managerId: U(t[2]),
    category: t[1],
    members: [U(t[2]), ...t[3].map(U)],
    namedMembers: t[4].map((name, j) => ({
      _id: oid(`5eed${i + 1}a`, j + 1),
      name,
    })),
    logo: PHOTO,
    isActive: true,
  }),
);

const T = (i) => oid("5eed7e", i);
// [nombre, formato, inicio (días), fin (días), equipos, estado, descripción]
const tournaments = [
  [
    "Copa Intercarreras Fútbol 7",
    "FUTBOL_7",
    -4,
    24,
    [1, 2, 3, 4],
    "EN PROGRESO",
    "Torneo anual entre las carreras técnicas de Kinal. Partidos martes y jueves por la tarde.",
  ],
  [
    "Liga Kinal Apertura 2027",
    "FUTBOL_11",
    20,
    90,
    [5, 6, 7, 8],
    "PENDIENTE",
    "Liga de fútbol 11 con formato todos contra todos y final en el Estadio Kinal. Inscripciones abiertas.",
  ],
  [
    "Torneo Relámpago de Aniversario",
    "FUTBOL_7",
    35,
    36,
    [1, 3],
    "PENDIENTE",
    "Torneo de un fin de semana para celebrar el aniversario de Kinal, con eliminación directa.",
  ],
  [
    "Clausura Fútbol 11 2026",
    "FUTBOL_11",
    -95,
    -40,
    [5, 6, 7],
    "TERMINADO",
    "Torneo de clausura del ciclo 2026. Campeón: Electricidad Industrial.",
  ],
];
tournaments.forEach((t, i) =>
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
    logo: PHOTO,
  }),
);

// [usuario, cancha, día relativo, hora inicio, hora fin, estado]
const reservations = [
  [2, 2, 1, 17, 19, "CONFIRMED"],
  [4, 4, 1, 18, 19, "PENDING"],
  [5, 3, 2, 16, 18, "CONFIRMED"],
  [6, 6, 2, 15, 16, "PENDING"],
  [7, 1, 3, 9, 11, "CONFIRMED"],
  [9, 2, 3, 19, 21, "PENDING"],
  [10, 4, 4, 14, 15, "PENDING"],
  [12, 5, 5, 7, 9, "CONFIRMED"],
  [3, 3, 6, 18, 20, "PENDING"],
  [8, 1, 7, 10, 12, "CONFIRMED"],
  [12, 6, 8, 17, 18, "CANCELLED"],
  [2, 5, 9, 16, 18, "PENDING"],
  [4, 2, -1, 18, 20, "COMPLETED"],
  [5, 1, -2, 8, 10, "COMPLETED"],
  [6, 4, -3, 17, 18, "NO_SHOW"],
  [9, 3, -5, 19, 21, "COMPLETED"],
  [10, 6, -6, 15, 16, "CANCELLED"],
  [7, 2, -8, 18, 20, "COMPLETED"],
];
reservations.forEach((r, i) =>
  up("reservations", {
    _id: oid("5eedae", i + 1),
    userId: U(r[0]),
    fieldId: oid("5eed0f", r[1]),
    startTime: at(r[2], r[3]),
    endTime: at(r[2], r[4]),
    status: r[5],
    // Las confirmadas y completadas registran qué administrador las confirmó
    ...(["CONFIRMED", "COMPLETED", "NO_SHOW"].includes(r[5]) && {
      confirmation: {
        confirmedAt: at(Math.min(r[2], 0) - 1, 10),
        confirmedBy: U(1),
      },
    }),
    lastModifiedBy: null,
  }),
);

// Perfiles de server-user (nombre visible, teléfono y deportes favoritos)
const profiles = [
  [2, "Andrea Morales", "42178935", ["FUTBOL_7"]],
  [3, "José Pérez", "31846250", ["FUTBOL_7", "FUTBOL_11"]],
  [4, "Daniela Rodríguez", "58402716", ["FUTBOL_5"]],
  [5, "Fernando Castillo", "47715382", ["FUTBOL_11"]],
  [7, "Javier Ramírez", "50963184", ["FUTBOL_11", "FUTBOL_7"]],
  [9, "Diego Hernández", "36514829", ["FUTBOL_7"]],
  [10, "Mariana Ortiz", "59870241", ["FUTBOL_5", "FUTBOL_7"]],
];
profiles.forEach((p, i) =>
  up("userprofiles", {
    _id: oid("5eedf1", i + 1),
    authId: U(p[0]),
    displayName: p[1],
    phone: p[2],
    favoriteSports: p[3],
  }),
);

print(
  JSON.stringify({
    fields: db.fields.countDocuments(),
    teams: db.teams.countDocuments(),
    tournaments: db.tournaments.countDocuments(),
    reservations: db.reservations.countDocuments(),
    userprofiles: db.userprofiles.countDocuments(),
  }),
);
