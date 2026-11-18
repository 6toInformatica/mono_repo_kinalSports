import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../features/auth/store/authStore.js';
import { showError } from '../utils/toast.js';
import {
  isAuthError,
  performTokenRefresh,
  resolveExpiresAt,
  tryRefreshSession,
} from './sessionRefresh.js';

vi.mock('../utils/toast.js', () => ({ showError: vi.fn() }));
vi.mock('../store/resetAppStores.js', () => ({ resetAppStores: vi.fn() }));

const login = (overrides = {}) =>
  useAuthStore.setState({
    isAuthenticated: true,
    token: 'access-1',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() - 1000,
    user: { username: 'roberto.juarez' },
    ...overrides,
  });

beforeEach(() => {
  vi.clearAllMocks();
  login();
});

describe('resolveExpiresAt', () => {
  it('acepta milisegundos, segundos o expiresIn', () => {
    expect(resolveExpiresAt(undefined, 1_800_000_000_000)).toBe(1_800_000_000_000);
    expect(resolveExpiresAt(undefined, 1_800_000_000)).toBe(1_800_000_000_000);
    const inFifteen = resolveExpiresAt(900);
    expect(inFifteen - Date.now()).toBeGreaterThan(899_000);
  });
});

describe('isAuthError', () => {
  it('reconoce un 401 o un 403 TOKEN_EXPIRED', () => {
    expect(isAuthError({ response: { status: 401 } })).toBe(true);
    expect(isAuthError({ response: { status: 403, data: { error: 'TOKEN_EXPIRED' } } })).toBe(true);
    expect(isAuthError({ response: { status: 403, data: { error: 'FORBIDDEN' } } })).toBe(false);
    expect(isAuthError(new Error('red'))).toBe(false);
  });
});

describe('performTokenRefresh', () => {
  it('guarda los tokens nuevos', async () => {
    const axiosAuth = {
      post: vi.fn().mockResolvedValue({
        data: { accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 900 },
      }),
    };

    await expect(performTokenRefresh(axiosAuth)).resolves.toBe('access-2');
    expect(axiosAuth.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh-1' });
    expect(useAuthStore.getState()).toMatchObject({
      token: 'access-2',
      refreshToken: 'refresh-2',
      user: { username: 'roberto.juarez' },
    });
  });

  it('peticiones simultáneas comparten una sola renovación', async () => {
    let finish;
    const axiosAuth = {
      post: vi.fn(
        () =>
          new Promise((resolve) => {
            finish = () => resolve({ data: { accessToken: 'access-2', refreshToken: 'r2' } });
          })
      ),
    };

    const first = performTokenRefresh(axiosAuth);
    const second = performTokenRefresh(axiosAuth);
    finish();

    await expect(Promise.all([first, second])).resolves.toEqual(['access-2', 'access-2']);
    expect(axiosAuth.post).toHaveBeenCalledTimes(1);
  });

  it('si falla, cierra la sesión y avisa', async () => {
    const rejection = { response: { status: 401 } };
    const axiosAuth = { post: vi.fn().mockRejectedValue(rejection) };

    await expect(performTokenRefresh(axiosAuth)).rejects.toBe(rejection);
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, token: null });
    expect(showError).toHaveBeenCalledWith('Tu sesión expiró. Inicia sesión de nuevo.');
  });
});

describe('tryRefreshSession', () => {
  it('no renueva si al token le queda más de un minuto', async () => {
    login({ expiresAt: Date.now() + 5 * 60_000 });
    const axiosAuth = { post: vi.fn() };

    await tryRefreshSession(axiosAuth);

    expect(axiosAuth.post).not.toHaveBeenCalled();
  });

  it('no hace nada sin sesión', async () => {
    login({ isAuthenticated: false });
    const axiosAuth = { post: vi.fn() };

    await tryRefreshSession(axiosAuth);

    expect(axiosAuth.post).not.toHaveBeenCalled();
  });
});
