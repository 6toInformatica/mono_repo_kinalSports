import axios from "axios";
import * as SecureStore from "expo-secure-store";
import useAuthStore from "../store/authStore.js";
import {
  isAuthError,
  refreshAccessToken,
  resolveExpiresAt,
} from "./tokenRefresh";

jest.mock("axios", () => ({ post: jest.fn() }));
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
jest.mock("../store/authStore.js", () => {
  const state = { setAccessToken: jest.fn(), logout: jest.fn() };
  return { __esModule: true, default: { getState: () => state } };
});

const store = useAuthStore.getState();

beforeEach(() => jest.clearAllMocks());

describe("resolveExpiresAt", () => {
  it("acepta milisegundos, segundos o expiresIn", () => {
    expect(resolveExpiresAt(undefined, 1_800_000_000_000)).toBe(
      1_800_000_000_000,
    );
    expect(resolveExpiresAt(undefined, 1_800_000_000)).toBe(1_800_000_000_000);
    expect(resolveExpiresAt(900) - Date.now()).toBeGreaterThan(899_000);
  });
});

describe("isAuthError", () => {
  it("reconoce un 401 o un 403 TOKEN_EXPIRED", () => {
    expect(isAuthError({ response: { status: 401 } })).toBe(true);
    expect(
      isAuthError({
        response: { status: 403, data: { error: "TOKEN_EXPIRED" } },
      }),
    ).toBe(true);
    expect(isAuthError({ response: { status: 500 } })).toBe(false);
  });
});

describe("refreshAccessToken", () => {
  it("guarda el refresh token rotado en el almacenamiento seguro", async () => {
    SecureStore.getItemAsync.mockResolvedValue("refresh-1");
    axios.post.mockResolvedValue({
      data: {
        accessToken: "access-2",
        refreshToken: "refresh-2",
        expiresIn: 900,
      },
    });

    await expect(refreshAccessToken()).resolves.toBe("access-2");

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/refresh$/),
      { refreshToken: "refresh-1" },
      expect.any(Object),
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "ks_refresh_token",
      "refresh-2",
    );
    expect(store.setAccessToken).toHaveBeenCalledWith(
      "access-2",
      expect.any(Number),
    );
  });

  it("peticiones simultáneas comparten una sola renovación", async () => {
    SecureStore.getItemAsync.mockResolvedValue("refresh-1");
    axios.post.mockResolvedValue({
      data: { accessToken: "access-2", refreshToken: "refresh-2" },
    });

    const results = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    expect(results).toEqual(["access-2", "access-2"]);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("sin refresh token cierra la sesión con aviso", async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);

    await expect(refreshAccessToken()).rejects.toThrow();

    expect(axios.post).not.toHaveBeenCalled();
    expect(store.logout).toHaveBeenCalledWith({
      message: "Tu sesión expiró. Inicia sesión de nuevo.",
    });
  });
});
