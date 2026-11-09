// Datos de apoyo compartidos por todas las pruebas

// Identificador único de esta corrida: evita choques con datos de corridas anteriores
export const RUN = `ct${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// PNG válido de 1x1
export const png = () => ({
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  ),
  type: "image/png",
  name: "contract.png",
});

export const textFile = () => ({
  buffer: Buffer.from("no es una imagen"),
  type: "text/plain",
  name: "contract.txt",
});

export const largePng = (megabytes = 30) => ({
  buffer: Buffer.alloc(megabytes * 1024 * 1024),
  type: "image/png",
  name: "large.png",
});

export const NOT_FOUND_ID = "0123456789abcdef01234567";

// Fecha y hora local de Guatemala (UTC-6, sin horario de verano) como ISO UTC
export const guatemalaTime = (daysAhead, hour, minute = 0) => {
  const base = new Date(Date.now() + daysAhead * 86_400_000 - 6 * 3_600_000);
  const day = base.toISOString().slice(0, 10);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${day}T${hh}:${mm}:00-06:00`).toISOString();
};

// Día futuro aleatorio para que las reservas de cada corrida no choquen con otras
export const randomFutureDay = () => 20 + Math.floor(Math.random() * 300);

export const decodeJwt = (token) =>
  JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));

// Datos de un usuario nuevo para registro
let counter = 0;
export const newUser = (prefix) => {
  counter += 1;
  const id = `${prefix}${RUN}${counter}`.toLowerCase();
  return {
    name: "Contrato",
    surname: "Prueba",
    username: id,
    email: `${id}@kinalsports.test`,
    password: "Contrato1234!",
    phone: "55500000",
  };
};
