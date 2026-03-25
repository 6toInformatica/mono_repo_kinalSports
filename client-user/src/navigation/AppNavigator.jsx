import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "../store/authStore";
import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state._hasHydrated);

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});

export default AppNavigator;
