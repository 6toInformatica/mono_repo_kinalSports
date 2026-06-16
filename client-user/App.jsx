// App.jsx
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { COLORS } from "./src/shared/constants/theme.js";
import AppNavigator from "./src/navigation/AppNavigator.jsx";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
