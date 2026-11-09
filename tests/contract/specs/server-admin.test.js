// Contrato de server-admin (/kinalSportsAdmin/v1)
import { beforeAll, describe, expect, inject, test } from "vitest";
import { http } from "../lib/http.js";
import { contract } from "../lib/shape.js";
import { seededUserIds, urls, users } from "../lib/config.js";
import { login } from "../lib/session.js";
import {
  NOT_FOUND_ID,
  RUN,
  guatemalaTime,
  largePng,
  png,
  randomFutureDay,
  textFile,
} from "../lib/fixtures.js";

const base = urls.admin;
const internal = () => ({ "x-internal-token": inject("internalToken") });

let admin;
let user;
let manager;

beforeAll(async () => {
  admin = await login(users.admin);
  user = await login(users.user, { via: "authNode" });
  manager = await login(users.manager, { via: "authNode" });
});

const fieldForm = (overrides = {}) => ({
  fieldName: `Cancha ${RUN}`,
  fieldType: "SINTETICA",
  capacity: "FUTBOL_7",
  pricePerHour: "150",
  description: "Cancha de pruebas de contrato",
  ...overrides,
});

test("GET /health", async () => {
  expect(contract(await http.get(`${base}/health`))).toMatchSnapshot();
});

test("ruta inexistente", async () => {
  expect(contract(await http.get(`${base}/no-existe`))).toMatchSnapshot();
});

describe("fields", () => {
  let fieldId;

  test("GET /fields sin token", async () => {
    expect(contract(await http.get(`${base}/fields`))).toMatchSnapshot();
  });

  test("GET /fields con token de usuario", async () => {
    expect(
      contract(await http.get(`${base}/fields`, { token: user.token })),
    ).toMatchSnapshot();
  });

  test("GET /fields con token interno", async () => {
    const response = await http.get(`${base}/fields?limit=5`, {
      headers: internal(),
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /fields sin token", async () => {
    expect(
      contract(await http.post(`${base}/fields`, { form: fieldForm() })),
    ).toMatchSnapshot();
  });

  test("POST /fields como usuario", async () => {
    const response = await http.post(`${base}/fields`, {
      token: user.token,
      form: fieldForm(),
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /fields con datos inválidos", async () => {
    const response = await http.post(`${base}/fields`, {
      token: admin.token,
      form: fieldForm({ fieldType: "ARENA", pricePerHour: "-5" }),
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /fields con archivo que no es imagen", async () => {
    const response = await http.post(`${base}/fields`, {
      token: admin.token,
      form: { ...fieldForm(), image: textFile() },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /fields con imagen demasiado grande", async () => {
    const response = await http.post(`${base}/fields`, {
      token: admin.token,
      form: { ...fieldForm(), image: largePng() },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /fields válido", async () => {
    const response = await http.post(`${base}/fields`, {
      token: admin.token,
      form: fieldForm(),
    });
    expect(contract(response)).toMatchSnapshot();
    fieldId = response.data.data._id;
  });

  test("POST /fields con imagen", async () => {
    const response = await http.post(`${base}/fields`, {
      token: admin.token,
      form: {
        ...fieldForm({ fieldName: `Cancha imagen ${RUN}` }),
        image: png(),
      },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("GET /fields/:id", async () => {
    expect(
      contract(
        await http.get(`${base}/fields/${fieldId}`, { token: admin.token }),
      ),
    ).toMatchSnapshot();
  });

  test("GET /fields/:id con id inválido", async () => {
    expect(
      contract(await http.get(`${base}/fields/abc`, { token: admin.token })),
    ).toMatchSnapshot();
  });

  test("GET /fields/:id inexistente", async () => {
    const response = await http.get(`${base}/fields/${NOT_FOUND_ID}`, {
      token: admin.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /fields/:id", async () => {
    const response = await http.put(`${base}/fields/${fieldId}`, {
      token: admin.token,
      form: { pricePerHour: "175", description: "Actualizada" },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /fields/:id inexistente", async () => {
    const response = await http.put(`${base}/fields/${NOT_FOUND_ID}`, {
      token: admin.token,
      form: { pricePerHour: "175" },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /fields/:id/deactivate como usuario", async () => {
    const response = await http.put(`${base}/fields/${fieldId}/deactivate`, {
      token: user.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /fields/:id/deactivate y /activate", async () => {
    const off = await http.put(`${base}/fields/${fieldId}/deactivate`, {
      token: admin.token,
    });
    expect(contract(off)).toMatchSnapshot();
    const on = await http.put(`${base}/fields/${fieldId}/activate`, {
      token: admin.token,
    });
    expect(contract(on)).toMatchSnapshot();
  });
});

describe("teams", () => {
  let teamId;
  let memberId;

  const teamForm = (overrides = {}) => ({
    teamName: `Equipo admin ${RUN}`,
    managerId: seededUserIds.manager,
    category: "FUTBOL_7",
    ...overrides,
  });

  test("GET /teams sin token", async () => {
    expect(contract(await http.get(`${base}/teams`))).toMatchSnapshot();
  });

  test("GET /teams", async () => {
    expect(
      contract(await http.get(`${base}/teams?limit=5`, { token: admin.token })),
    ).toMatchSnapshot();
  });

  test("POST /teams como usuario", async () => {
    const response = await http.post(`${base}/teams`, {
      token: user.token,
      form: teamForm(),
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /teams con datos inválidos", async () => {
    const response = await http.post(`${base}/teams`, {
      token: admin.token,
      form: teamForm({ category: "FUTBOL_9", teamName: "" }),
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /teams válido", async () => {
    const response = await http.post(`${base}/teams`, {
      token: admin.token,
      form: teamForm(),
    });
    expect(contract(response)).toMatchSnapshot();
    teamId = response.data.data._id;
  });

  test("GET /teams/:id", async () => {
    expect(
      contract(
        await http.get(`${base}/teams/${teamId}`, { token: admin.token }),
      ),
    ).toMatchSnapshot();
  });

  test("GET /teams/:id inexistente", async () => {
    const response = await http.get(`${base}/teams/${NOT_FOUND_ID}`, {
      token: admin.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /teams/:id como usuario que no es el manager", async () => {
    const response = await http.put(`${base}/teams/${teamId}`, {
      token: user.token,
      form: { teamName: `Intruso ${RUN}` },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /teams/:id como manager", async () => {
    const response = await http.put(`${base}/teams/${teamId}`, {
      token: manager.token,
      form: { teamName: `Equipo admin editado ${RUN}` },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /teams/:id como admin", async () => {
    const response = await http.put(`${base}/teams/${teamId}`, {
      token: admin.token,
      form: { teamName: `Equipo admin ${RUN}` },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /teams/:id/named-members", async () => {
    const response = await http.post(`${base}/teams/${teamId}/named-members`, {
      token: admin.token,
      json: { name: "Jugador Contrato" },
    });
    expect(contract(response)).toMatchSnapshot();
    memberId = response.data?.data?.namedMembers?.at(-1)?._id;
  });

  test("POST /teams/:id/named-members sin nombre", async () => {
    const response = await http.post(`${base}/teams/${teamId}/named-members`, {
      token: admin.token,
      json: {},
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("DELETE /teams/:id/named-members/:memberId", async () => {
    const response = await http.delete(
      `${base}/teams/${teamId}/named-members/${memberId}`,
      {
        token: admin.token,
      },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("DELETE /teams/:id/named-members/:memberId inexistente", async () => {
    const response = await http.delete(
      `${base}/teams/${teamId}/named-members/${NOT_FOUND_ID}`,
      {
        token: admin.token,
      },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /teams/:id/manager", async () => {
    const response = await http.put(`${base}/teams/${teamId}/manager`, {
      token: admin.token,
      json: { managerId: seededUserIds.other },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /teams/:id/manager sin managerId", async () => {
    const response = await http.put(`${base}/teams/${teamId}/manager`, {
      token: admin.token,
      json: {},
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /teams/:id/deactivate y /activate", async () => {
    const off = await http.put(`${base}/teams/${teamId}/deactivate`, {
      token: admin.token,
    });
    expect(contract(off)).toMatchSnapshot();
    const on = await http.put(`${base}/teams/${teamId}/activate`, {
      token: admin.token,
    });
    expect(contract(on)).toMatchSnapshot();
  });

  test("PUT /teams/:id/activate como usuario", async () => {
    const response = await http.put(`${base}/teams/${teamId}/activate`, {
      token: user.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });
});

describe("tournaments", () => {
  let tournamentId;
  const day = (offset) => guatemalaTime(offset, 12).slice(0, 10);

  const tournamentForm = (overrides = {}) => ({
    tournamentsName: `Torneo ${RUN}`,
    category: "FUTBOL_7",
    startDate: day(10),
    endDate: day(20),
    description: "Torneo de pruebas de contrato",
    ...overrides,
  });

  test("GET /tournaments sin token", async () => {
    expect(contract(await http.get(`${base}/tournaments`))).toMatchSnapshot();
  });

  test("GET /tournaments", async () => {
    const response = await http.get(`${base}/tournaments?limit=5`, {
      token: admin.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /tournaments con fin antes del inicio", async () => {
    const response = await http.post(`${base}/tournaments`, {
      token: admin.token,
      form: tournamentForm({ startDate: day(20), endDate: day(10) }),
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /tournaments como usuario", async () => {
    const response = await http.post(`${base}/tournaments`, {
      token: user.token,
      form: tournamentForm(),
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("POST /tournaments válido", async () => {
    const response = await http.post(`${base}/tournaments`, {
      token: admin.token,
      form: tournamentForm(),
    });
    expect(contract(response)).toMatchSnapshot();
    tournamentId = response.data.data._id;
  });

  test("GET /tournaments/:id", async () => {
    const response = await http.get(`${base}/tournaments/${tournamentId}`, {
      token: admin.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("GET /tournaments/:id inexistente", async () => {
    const response = await http.get(`${base}/tournaments/${NOT_FOUND_ID}`, {
      token: admin.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /tournaments/:id", async () => {
    const response = await http.put(`${base}/tournaments/${tournamentId}`, {
      token: admin.token,
      form: { description: "Actualizado" },
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /tournaments/:id/deactivate y /activate", async () => {
    const off = await http.put(
      `${base}/tournaments/${tournamentId}/deactivate`,
      { token: admin.token },
    );
    expect(contract(off)).toMatchSnapshot();
    const on = await http.put(`${base}/tournaments/${tournamentId}/activate`, {
      token: admin.token,
    });
    expect(contract(on)).toMatchSnapshot();
  });

  test("DELETE /tournaments/:id como usuario", async () => {
    const response = await http.delete(`${base}/tournaments/${tournamentId}`, {
      token: user.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("DELETE /tournaments/:id", async () => {
    const response = await http.delete(`${base}/tournaments/${tournamentId}`, {
      token: admin.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("DELETE /tournaments/:id inexistente", async () => {
    const response = await http.delete(`${base}/tournaments/${NOT_FOUND_ID}`, {
      token: admin.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });
});

describe("reservations", () => {
  let fieldId;
  let reservationId;
  let otherReservationId;
  const offset = randomFutureDay();

  beforeAll(async () => {
    const field = await http.post(`${base}/fields`, {
      token: admin.token,
      form: fieldForm({ fieldName: `Cancha reservas admin ${RUN}` }),
    });
    fieldId = field.data.data._id;
    const create = (startHour, endHour) =>
      http.post(`${urls.user}/reservations`, {
        token: user.token,
        json: {
          fieldId,
          startTime: guatemalaTime(offset, startHour),
          endTime: guatemalaTime(offset, endHour),
        },
      });
    reservationId = (await create(10, 12)).data.data._id;
    otherReservationId = (await create(14, 16)).data.data._id;
  });

  test("GET /reservations como usuario", async () => {
    expect(
      contract(await http.get(`${base}/reservations`, { token: user.token })),
    ).toMatchSnapshot();
  });

  test("GET /reservations como admin", async () => {
    const response = await http.get(
      `${base}/reservations?limit=5&fieldId=${fieldId}`,
      {
        token: admin.token,
      },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("GET /reservations filtrado por cancha y estado", async () => {
    const response = await http.get(
      `${base}/reservations?fieldId=${fieldId}&status=PENDING`,
      {
        token: admin.token,
      },
    );
    expect(contract(response)).toMatchSnapshot();
    expect(response.data.data).toHaveLength(2);
  });

  test("GET /reservations/:id como admin", async () => {
    const response = await http.get(`${base}/reservations/${reservationId}`, {
      token: admin.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("GET /reservations/:id como dueño", async () => {
    const response = await http.get(`${base}/reservations/${reservationId}`, {
      token: user.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("GET /reservations/:id como otro usuario", async () => {
    const response = await http.get(`${base}/reservations/${reservationId}`, {
      token: manager.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("GET /reservations/:id inexistente", async () => {
    const response = await http.get(`${base}/reservations/${NOT_FOUND_ID}`, {
      token: admin.token,
    });
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /reservations/:id/confirm como usuario", async () => {
    const response = await http.put(
      `${base}/reservations/${reservationId}/confirm`,
      { token: user.token },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /reservations/:id/confirm", async () => {
    const response = await http.put(
      `${base}/reservations/${reservationId}/confirm`,
      { token: admin.token },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /reservations/:id/confirm ya confirmada", async () => {
    const response = await http.put(
      `${base}/reservations/${reservationId}/confirm`,
      { token: admin.token },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /reservations/:id/cancel", async () => {
    const response = await http.put(
      `${base}/reservations/${otherReservationId}/cancel`,
      {
        token: admin.token,
      },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /reservations/:id/cancel ya cancelada", async () => {
    const response = await http.put(
      `${base}/reservations/${otherReservationId}/cancel`,
      {
        token: admin.token,
      },
    );
    expect(contract(response)).toMatchSnapshot();
  });

  test("PUT /reservations/:id/confirm de una cancelada", async () => {
    const response = await http.put(
      `${base}/reservations/${otherReservationId}/confirm`,
      {
        token: admin.token,
      },
    );
    expect(contract(response)).toMatchSnapshot();
  });
});
