import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";
import { fetchAllPages, fetchList } from "./collections";
import { dropEmptyFile, hasErrors, imageFieldError, text } from "../lib/forms";

vi.mock("./client", () => ({ api: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe("fetchAllPages", () => {
  it("recorre todas las páginas de 100 en 100", async () => {
    vi.mocked(api)
      .mockResolvedValueOnce({ data: [1, 2], pagination: { totalPages: 3 } })
      .mockResolvedValueOnce({ data: [3], pagination: { totalPages: 3 } })
      .mockResolvedValueOnce({ data: [4], pagination: { totalPages: 3 } });

    expect(await fetchAllPages("reservations")).toEqual([1, 2, 3, 4]);
    expect(api).toHaveBeenLastCalledWith("admin", "reservations", {
      query: { page: 3, limit: 100 },
    });
  });

  it("sin paginación pide una sola página", async () => {
    vi.mocked(api).mockResolvedValue({});

    expect(await fetchAllPages("teams")).toEqual([]);
    expect(api).toHaveBeenCalledTimes(1);
  });
});

describe("fetchList", () => {
  it("devuelve data o una lista vacía", async () => {
    vi.mocked(api)
      .mockResolvedValueOnce({ data: ["a"] })
      .mockResolvedValueOnce({});

    expect(await fetchList("x")).toEqual(["a"]);
    expect(await fetchList("x")).toEqual([]);
  });
});

describe("forms", () => {
  it("text recorta espacios y no falla con campos ausentes", () => {
    const form = new FormData();
    form.set("name", "  Estadio Kinal ");
    expect(text(form, "name")).toBe("Estadio Kinal");
    expect(text(form, "otro")).toBe("");
  });

  it("dropEmptyFile quita el archivo vacío para no reemplazar la imagen", () => {
    const form = new FormData();
    form.set("photo", new File([], "vacio.png"));
    form.set("logo", new File(["x"], "logo.png"));

    dropEmptyFile(form, "photo");
    dropEmptyFile(form, "logo");

    expect(form.has("photo")).toBe(false);
    expect(form.has("logo")).toBe(true);
  });

  it("imageFieldError rechaza tipo y tamaño antes de enviar", () => {
    expect(imageFieldError(new File([], "vacio.png"))).toBeNull();
    expect(
      imageFieldError(new File(["gif"], "a.gif", { type: "image/gif" })),
    ).toMatch(/Formato/);
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "grande.png", {
      type: "image/png",
    });
    expect(imageFieldError(big)).toMatch(/10 MB/);
    expect(
      imageFieldError(new File(["ok"], "foto.png", { type: "image/png" })),
    ).toBeNull();
  });

  it("hasErrors", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ name: "Requerido" })).toBe(true);
  });
});
