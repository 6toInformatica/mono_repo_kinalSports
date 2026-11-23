import { useAuthStore } from '../../features/auth/store/authStore.js';
import { resetAppStores } from '../store/resetAppStores.js';
import { showError } from '../utils/toast.js';

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedQueue = [];
}

export function resolveExpiresAt(expiresIn, expiresAt) {
  if (typeof expiresAt === 'number' && expiresAt > 1_000_000_000_000) {
    return expiresAt;
  }
  if (typeof expiresAt === 'number' && expiresAt > 1_000_000_000) {
    return expiresAt * 1000;
  }
  const seconds = typeof expiresIn === 'number' ? expiresIn : 900;
  return Date.now() + seconds * 1000;
}

export function isAuthError(error) {
  const status = error?.response?.status;
  const code = error?.response?.data?.error;
  return status === 401 || (status === 403 && code === 'TOKEN_EXPIRED');
}

const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Inicia sesión de nuevo.';

export function handleSessionExpired(message = SESSION_EXPIRED_MESSAGE) {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) return;

  resetAppStores();
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    expiresAt: null,
    isAuthenticated: false,
    sessionMessage: null,
  });
  showError(message);
}

export async function performTokenRefresh(axiosAuth) {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  const { refreshToken, isAuthenticated } = useAuthStore.getState();

  // En el navegador la sesión usa la cookie httpOnly kinal_refresh; si no hay sesión
  // activa ni refreshToken en memoria, se cierra la sesión.
  if (!refreshToken && !isAuthenticated) {
    isRefreshing = false;
    handleSessionExpired();
    throw new Error('No refresh token');
  }

  try {
    const body = refreshToken ? { refreshToken } : {};
    const response = await axiosAuth.post('/auth/refresh', body);
    const { accessToken, refreshToken: newRefreshToken, expiresIn, userDetails } = response.data;

    useAuthStore.setState({
      token: refreshToken ? accessToken : null,
      refreshToken: refreshToken ? newRefreshToken : null,
      expiresAt: resolveExpiresAt(expiresIn, response.data.expiresAt),
      user: userDetails || useAuthStore.getState().user,
      isAuthenticated: true,
    });

    processQueue(null, accessToken);
    return accessToken;
  } catch (error) {
    processQueue(error, null);
    handleSessionExpired();
    throw error;
  } finally {
    isRefreshing = false;
  }
}

export async function tryRefreshSession(axiosAuth) {
  const { isAuthenticated, expiresAt } = useAuthStore.getState();

  if (!isAuthenticated) return;

  if (expiresAt && expiresAt > Date.now() && Date.now() < expiresAt - 60_000) {
    return;
  }

  return performTokenRefresh(axiosAuth);
}
