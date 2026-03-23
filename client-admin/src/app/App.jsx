import { AppRoutes } from './router/AppRoutes';
import { Modal } from '../features/auth/components/Modal';
import { useEffect } from "react";
import { useAuthStore } from "../features/auth/store/authStore";
import { ConfirmModal } from '../features/auth/components/ConfirmModal';

export const App = () => {

  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);
  
  return (
    <>
      <Modal />
      <ConfirmModal />
      <AppRoutes />
    </>
  )
}
