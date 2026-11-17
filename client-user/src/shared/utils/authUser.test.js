import { getAuthUserId, getTokenUserId, normalizeAuthUser } from "./authUser";

// JWT sin firma válida: solo se usa el payload
const tokenFor = (payload) =>
  `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.firma`;

describe("authUser", () => {
  it("lee el id del usuario desde el claim sub del token", () => {
    expect(getTokenUserId(tokenFor({ sub: "usr_SeedUser0002" }))).toBe(
      "usr_SeedUser0002",
    );
  });

  it("devuelve null con un token inválido", () => {
    expect(getTokenUserId("no-es-un-jwt")).toBeNull();
    expect(getTokenUserId(null)).toBeNull();
  });

  it("normaliza las propiedades con mayúscula que devuelve auth-service", () => {
    const user = normalizeAuthUser({
      Id: "x",
      Username: "andrea.morales",
      Email: "andrea.morales@kinalsports.gt",
      Name: "Andrea",
      Surname: "Morales",
    });

    expect(user).toMatchObject({
      username: "andrea.morales",
      email: "andrea.morales@kinalsports.gt",
      name: "Andrea",
      surname: "Morales",
    });
  });

  it("usa el id del token si el usuario no trae uno", () => {
    expect(getAuthUserId({}, tokenFor({ sub: "usr_SeedUser0011" }))).toBe(
      "usr_SeedUser0011",
    );
  });
});
