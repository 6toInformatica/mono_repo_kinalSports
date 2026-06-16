import { AppRoutes } from './router/AppRoutes';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../features/auth/store/authStore';
import { UiConfirmHost } from '../features/auth/components/ConfirmModal.jsx';
import { tryRefreshSession, axiosAuth } from '../shared/api/api.js';

export const App = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const refreshIfNeeded = async () => {
      try {
        await tryRefreshSession(axiosAuth);
      } catch {
        // handleSessionExpired already muestra el toast y cierra sesión
      }
    };

    refreshIfNeeded();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshIfNeeded();
      }
    };

    window.addEventListener('focus', refreshIfNeeded);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('focus', refreshIfNeeded);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <>
      <Toaster
        position='top-center'
        toastOptions={{
          style: {
            fontFamily: 'inherit',
            fontWeight: 600,
            fontSize: '1rem',
            borderRadius: '8px',
          },
        }}
      />
      <UiConfirmHost />
      <AppRoutes />
    </>
  );
};
