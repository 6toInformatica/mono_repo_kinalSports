// src/navigation/AuthStack.jsx
import { StatusBar } from "expo-status-bar";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../features/auth/screens/LoginScreen.jsx";
import RegisterScreen from "../features/auth/screens/RegisterScreen.jsx";
import AccountEmailScreen from "../features/auth/screens/AccountEmailScreen.jsx";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="AccountEmail" component={AccountEmailScreen} />
      </Stack.Navigator>
    </>
  );
}
