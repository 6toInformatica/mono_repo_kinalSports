import { resolveCaptainName, resolveMemberLabel } from "./teamDisplay";

describe("resolveMemberLabel", () => {
  it("prefiere el username y luego el nombre visible", () => {
    expect(resolveMemberLabel({ username: "jose.perez" })).toBe("jose.perez");
    expect(resolveMemberLabel({ displayName: "José Pérez" })).toBe(
      "José Pérez",
    );
  });

  it("nunca muestra un id técnico usr_", () => {
    expect(resolveMemberLabel({ displayName: "usr_SeedUser0003" })).toBe(
      "Miembro",
    );
    expect(resolveMemberLabel(null)).toBe("Miembro");
  });

  it("reconoce al usuario actual por su id", () => {
    expect(
      resolveMemberLabel(
        { userId: "usr_2", displayName: "usr_2" },
        { id: "usr_2", username: "andrea.morales" },
      ),
    ).toBe("andrea.morales");
  });
});

describe("resolveCaptainName", () => {
  it("usa el nombre del capitán que envía el servidor", () => {
    expect(resolveCaptainName({ managerName: "andrea.morales" })).toBe(
      "andrea.morales",
    );
  });

  it("si no hay nombre, busca el perfil marcado como capitán", () => {
    const team = {
      managerName: "usr_SeedUser0002",
      memberProfiles: [
        { userId: "usr_3", username: "jose.perez" },
        { userId: "usr_2", username: "andrea.morales", isCaptain: true },
      ],
    };

    expect(resolveCaptainName(team)).toBe("andrea.morales");
  });

  it("muestra un guion si no se conoce", () => {
    expect(resolveCaptainName({})).toBe("—");
  });
});
