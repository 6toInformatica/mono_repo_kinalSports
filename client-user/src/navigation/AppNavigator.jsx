// src/navigation/AppNavigator.jsx
import { useEffect } from "react";
import { Alert, AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import useAuthStore from "../shared/store/authStore.js";
import { tryRefreshSession } from "../shared/api/tokenRefresh.js";
import { LoadingSpinner } from "../shared/components/common/Common.jsx";
import AuthStack from "./AuthStack.jsx";
import MainTabs from "./MainTabs.jsx";

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const sessionMessage = useAuthStore((s) => s.sessionMessage);
  const clearSessionMessage = useAuthStore((s) => s.clearSessionMessage);

  useEffect(() => {
    if (!sessionMessage) return;

    Alert.alert("Sesión expirada", sessionMessage, [
      { text: "Entendido", onPress: clearSessionMessage },
    ]);
  }, [sessionMessage, clearSessionMessage]);

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated) return;

    const refreshIfNeeded = () => {
      tryRefreshSession().catch(() => {});
    };

    refreshIfNeeded();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshIfNeeded();
      }
    });

    return () => subscription.remove();
  }, [_hasHydrated, isAuthenticated]);

  if (!_hasHydrated) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
