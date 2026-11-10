// App.jsx
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator.jsx";

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Android es edge-to-edge desde el SDK 54: el color de fondo de la barra ya no se aplica */}
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
