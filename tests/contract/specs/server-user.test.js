// Contrato de server-user (/kinalSportsUser/v1)
import { beforeAll, describe, expect, test } from "vitest";
import { http } from "../lib/http.js";
import { contract } from "../lib/shape.js";
import { urls, users } from "../lib/config.js";
import { login } from "../lib/session.js";
import {
  NOT_FOUND_ID,
  RUN,
  guatemalaTime,
  png,
  randomFutureDay,
  textFile,
} from "../lib/fixtures.js";

const base = urls.user;

let admin;
let user;
let other;
let fieldId;
let tournamentId;

beforeAll(async () => {
  admin = await login(users.admin);
  user = await login(users.user, { via: "authNode" });
  other = await login(users.other, { via: "authNode" });

  const field = await http.post(`${urls.admin}/fields`, {
    token: admin.token,
    form: {
      fieldName: `Cancha usuario ${RUN}`,
      fieldType: "NATURAL",
      capacity: "FUTBOL_7",
      pricePerHour: "200",
      description: "Cancha de pruebas de contrato",
    },
  });
  fieldId = field.data.data._id;

  const day = (offset) => guatemalaTime(offset, 12).slice(0, 10);
  const tournament = await http.post(`${urls.admin}/tournaments`, {
    token: admin.token,
    form: {
      tournamentsName: `Torneo usuario ${RUN}`,
      category: "FUTBOL_7",
      startDate: day(10),
      endDate: day(20),
      description: "Torneo de pruebas de contrato",
    },
  });
  tournamentId = tournament.data.data._id;
});

test("GET /health", async () => {
  expect(contract(await http.get(`${base}/health`))).toMatchSnapshot();
});

test("ruta inexistente sin token", async () => {
  expect(contract(await http.get(`${base}/no-existe`))).toMatchSnapshot();
});

test("ruta inexistente con token", async () => {
  expect(
    contract(await http.get(`${base}/no-existe`, { token: user.token })),
  ).toMatchSnapshot();
});

test("JSON malformado", async () => {
  const response = await http.post(`${base}/reservations`, {
    token: user.token,
    json: "{malformado",
  });
  expect(contract(response)).toMatchSnapshot();
});

describe("fields (público)", () => {
  test("GET /fields", async () => {
    expect(contract(await http.get(`${base}/fields`))).toMatchSnapshot();
  });

  test("GET /fields/:id", async () => {
    expect(
      contract(await http.get(`${base}/fields/${fieldId}`)),
    ).toMatchSnapshot();
  });

  test("GET /fields/:id inexistente", async () => {
    expect(
      contract(await http.get(`${base}/fields/${NOT_FOUND_ID}`)),
    ).toMatchSnapshot();
  });

  test("GET /fields/:id con id inválido", async () => {
    expect(contract(await http.get(`${base}/fields/abc`))).toMatchSnapshot();
  });
});

describe("users", () => {
  test("GET /users/profile sin token", async () => {
    expect(contract(await http.get(`${base}/users/profile`))).toMatchSnapshot();
  });

  test("PUT /users/profile", async () => {
    const response = await http.put(`${base}/users/profile`, {
      token: user.token,
      json: {
        displayName: "Prueba E2E",
        phone: "12345678",
        favoriteSports: ["FUTBOL_7"],
      },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("GET /users/profile (después de actualizarlo)", async () => {
    expect(
      contract(await http.get(`${base}/users/profile`, { token: user.token })),
    ).toMatchSnapshot();
  });

  test("POST /users/profile/avatar con archivo que no es imagen", async () => {
    const response = await http.post(`${base}/users/profile/avatar`, {
      token: user.token,
      form: { avatar: textFile() },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /users/profile/avatar", async () => {
    const response = await http.post(`${base}/users/profile/avatar`, {
      token: user.token,
      form: { avatar: png() },
    });
    expect(contract(response)).toMatchSnapshot();
  });
});

describe("reservations", () => {
  const offset = randomFutureDay();
  const at = (hour, minute) => guatemalaTime(offset, hour, minute);
  const create = (startTime, endTime, field = fieldId, token = user.token) =>
    http.post(`${base}/reservations`, {
      token,
      json: { fieldId: field, startTime, endTime },
    });
  let reservationId;

  test("POST /reservations sin datos", async () => {
    expect(
      contract(
        await http.post(`${base}/reservations`, {
          token: user.token,
          json: {},
        }),
      ),
    ).toMatchSnapshot();
  });

  test("POST /reservations válida", async () => {
    const response = await create(at(10), at(12));
    expect(contract(response)).toMatchSnapshot();
    reservationId = response.data.data._id;
  });

  test("POST /reservations en el pasado", async () => {
    expect(
      contract(await create(guatemalaTime(-1, 10), guatemalaTime(-1, 12))),
    ).toMatchSnapshot();
  });

  test("POST /reservations de 4 horas", async () => {
    expect(contract(await create(at(13), at(17)))).toMatchSnapshot();
  });

  test("POST /reservations de 30 minutos", async () => {
    expect(contract(await create(at(13), at(13, 30)))).toMatchSnapshot();
  });

  test("POST /reservations fuera de horario", async () => {
    expect(contract(await create(at(21), at(23)))).toMatchSnapshot();
  });

  test("POST /reservations traslapada", async () => {
    expect(
      contract(await create(at(11), at(13), fieldId, other.token)),
    ).toMatchSnapshot();
  });

  test("POST /reservations en cancha inexistente", async () => {
    expect(
      contract(await create(at(15), at(17), NOT_FOUND_ID)),
    ).toMatchSnapshot();
  });

  test("POST /reservations simultáneas: solo una se crea", async () => {
    const results = await Promise.all([
      create(at(15), at(17)),
      create(at(15), at(17), fieldId, other.token),
      create(at(16), at(18)),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409, 409]);
  });

  test("GET /reservations/availability", async () => {
    const date = at(12).slice(0, 10);
    const response = await http.get(
      `${base}/reservations/availability?fieldId=${fieldId}&date=${date}`,
      {
        token: user.token,
      },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("GET /reservations/availability sin parámetros", async () => {
    expect(
      contract(
        await http.get(`${base}/reservations/availability`, {
          token: user.token,
        }),
      ),
    ).toMatchSnapshot();
  });

  // La lista depende de los datos cargados; se compara solo la reserva creada por esta prueba
  const ownReservation = (response) => ({
    ...response,
    data: {
      ...response.data,
      data: response.data.data.filter((r) => r._id === reservationId),
    },
  });

  test("GET /reservations/me/history", async () => {
    const response = await http.get(`${base}/reservations/me/history`, {
      token: user.token,
    });
    expect(contract(ownReservation(response))).toMatchSnapshot();
  });

  test("GET /reservations/my-reservations", async () => {
    const response = await http.get(`${base}/reservations/my-reservations`, {
      token: user.token,
    });
    expect(contract(ownReservation(response))).toMatchSnapshot();
  });

  test("PUT /reservations/:id/cancel de otro usuario", async () => {
    const response = await http.put(
      `${base}/reservations/${reservationId}/cancel`,
      { token: other.token },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /reservations/:id/cancel", async () => {
    const response = await http.put(
      `${base}/reservations/${reservationId}/cancel`,
      { token: user.token },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /reservations/:id/cancel ya cancelada", async () => {
    const response = await http.put(
      `${base}/reservations/${reservationId}/cancel`,
      { token: user.token },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /reservations/:id/cancel inexistente", async () => {
    const response = await http.put(
      `${base}/reservations/${NOT_FOUND_ID}/cancel`,
      { token: user.token },
    );
    expect(contract(response)).toMatchSnapshot();
  });
});

describe("teams", () => {
  let teamId;
  let namedMemberId;

  test("GET /teams", async () => {
    expect(
      contract(await http.get(`${base}/teams`, { token: user.token })),
    ).toMatchSnapshot();
  });

  test("POST /teams con categoría inválida", async () => {
    const response = await http.post(`${base}/teams`, {
      token: user.token,
      form: { teamName: `Malo ${RUN}`, category: "FUTBOL_9" },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /teams con logo que no es imagen", async () => {
    const response = await http.post(`${base}/teams`, {
      token: user.token,
      form: {
        teamName: `Logo malo ${RUN}`,
        category: "FUTBOL_7",
        logo: textFile(),
      },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /teams válido", async () => {
    const response = await http.post(`${base}/teams`, {
      token: user.token,
      form: {
        teamName: `Equipo usuario ${RUN}`,
        category: "FUTBOL_7",
        namedMembers: JSON.stringify([{ name: "Jugador Uno" }]),
      },
    });
    expect(contract(response)).toMatchSnapshot();
    teamId = response.data.data._id;
  });

  test("POST /teams con logo", async () => {
    const response = await http.post(`${base}/teams`, {
      token: user.token,
      form: {
        teamName: `Equipo logo ${RUN}`,
        category: "FUTBOL_11",
        logo: png(),
      },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("GET /teams/:id", async () => {
    expect(
      contract(
        await http.get(`${base}/teams/${teamId}`, { token: user.token }),
      ),
    ).toMatchSnapshot();
  });

  test("GET /teams/:id inexistente", async () => {
    expect(
      contract(
        await http.get(`${base}/teams/${NOT_FOUND_ID}`, { token: user.token }),
      ),
    ).toMatchSnapshot();
  });

  test("GET /teams/me/mis-equipos", async () => {
    expect(
      contract(
        await http.get(`${base}/teams/me/mis-equipos`, { token: user.token }),
      ),
    ).toMatchSnapshot();
  });

  test("POST /teams/:id/join", async () => {
    expect(
      contract(
        await http.post(`${base}/teams/${teamId}/join`, { token: other.token }),
      ),
    ).toMatchSnapshot();
  });

  test("POST /teams/:id/join repetido", async () => {
    expect(
      contract(
        await http.post(`${base}/teams/${teamId}/join`, { token: other.token }),
      ),
    ).toMatchSnapshot();
  });

  test("POST /teams/:id/leave", async () => {
    expect(
      contract(
        await http.post(`${base}/teams/${teamId}/leave`, {
          token: other.token,
        }),
      ),
    ).toMatchSnapshot();
  });

  test("POST /teams/:id/leave sin ser miembro", async () => {
    expect(
      contract(
        await http.post(`${base}/teams/${teamId}/leave`, {
          token: other.token,
        }),
      ),
    ).toMatchSnapshot();
  });

  test("POST /teams/:id/members como no capitán", async () => {
    const response = await http.post(`${base}/teams/${teamId}/members`, {
      token: other.token,
      json: { username: users.manager },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /teams/:id/members", async () => {
    const response = await http.post(`${base}/teams/${teamId}/members`, {
      token: user.token,
      json: { username: users.other },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /teams/:id/members con usuario inexistente", async () => {
    const response = await http.post(`${base}/teams/${teamId}/members`, {
      token: user.token,
      json: { username: `nadie${RUN}` },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("DELETE /teams/:id/members/:userId", async () => {
    const response = await http.delete(
      `${base}/teams/${teamId}/members/${other.user.id}`,
      {
        token: user.token,
      },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /teams/:id/named-members", async () => {
    const response = await http.post(`${base}/teams/${teamId}/named-members`, {
      token: user.token,
      json: { name: "Jugador Dos" },
    });
    expect(contract(response)).toMatchSnapshot();
    namedMemberId = response.data?.data?.namedMembers?.at(-1)?._id;
  });

  test("POST /teams/:id/named-members sin nombre", async () => {
    const response = await http.post(`${base}/teams/${teamId}/named-members`, {
      token: user.token,
      json: {},
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("DELETE /teams/:id/named-members/:memberId", async () => {
    const response = await http.delete(
      `${base}/teams/${teamId}/named-members/${namedMemberId}`,
      {
        token: user.token,
      },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  describe("tournaments", () => {
    test("GET /tournaments", async () => {
      expect(
        contract(await http.get(`${base}/tournaments`, { token: user.token })),
      ).toMatchSnapshot();
    });

    test("GET /tournaments/:id", async () => {
      const response = await http.get(`${base}/tournaments/${tournamentId}`, {
        token: user.token,
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("GET /tournaments/:id inexistente", async () => {
      const response = await http.get(`${base}/tournaments/${NOT_FOUND_ID}`, {
        token: user.token,
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /tournaments/:id/register con teamId inválido", async () => {
      const response = await http.post(
        `${base}/tournaments/${tournamentId}/register`,
        {
          token: user.token,
          json: { teamId: { $ne: null } },
        },
      );
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /tournaments/:id/register de un equipo ajeno", async () => {
      const response = await http.post(
        `${base}/tournaments/${tournamentId}/register`,
        {
          token: other.token,
          json: { teamId },
        },
      );
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /tournaments/:id/register", async () => {
      const response = await http.post(
        `${base}/tournaments/${tournamentId}/register`,
        {
          token: user.token,
          json: { teamId },
        },
      );
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /tournaments/:id/register duplicado", async () => {
      const response = await http.post(
        `${base}/tournaments/${tournamentId}/register`,
        {
          token: user.token,
          json: { teamId },
        },
      );
      expect(contract(response)).toMatchSnapshot();
    });

    test("GET /tournaments/me/mis-torneos", async () => {
      const response = await http.get(`${base}/tournaments/me/mis-torneos`, {
        token: user.token,
      });
      expect(contract(response)).toMatchSnapshot();
      expect(response.data.data.some((t) => t._id === tournamentId)).toBe(true);
    });
  });
});
