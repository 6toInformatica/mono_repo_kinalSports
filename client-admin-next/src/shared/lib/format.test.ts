import { describe, expect, it } from "vitest";
import { businessDay, formatTime, toDateInput } from "./format";
import { resolveImage } from "./images";

describe("format", () => {
  it("usa el día de Guatemala aunque en UTC ya sea el día siguiente", () => {
    // 23:30 en Guatemala = 05:30 UTC del día siguiente
    expect(businessDay("2026-12-02T05:30:00Z")).toBe("2026-12-01");
  });

  it("muestra la hora en formato de 24 horas de Guatemala", () => {
    expect(formatTime("2026-12-01T22:00:00Z")).toBe("16:00");
  });

  it("convierte una fecha ISO para un input de fecha", () => {
    expect(toDateInput("2026-12-01T10:00:00.000Z")).toBe("2026-12-01");
    expect(toDateInput(null)).toBe("");
  });
});

describe("resolveImage", () => {
  it("ignora los logos de ejemplo del backend", () => {
    expect(resolveImage("fields/kinal_sports_nyvxo5")).toBeNull();
  });

  it("arma la URL de Cloudinary a partir del public_id", () => {
    expect(resolveImage("teams/logo")).toBe(
      "https://res.cloudinary.com/demo/image/upload/teams/logo",
    );
  });
});
