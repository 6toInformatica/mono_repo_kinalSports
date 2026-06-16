// src/features/reservations/navigation/ReservationsStack.jsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReservationsList from "../screens/ReservationsList.jsx";

const Stack = createNativeStackNavigator();

export default function ReservationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReservationsList"
        component={ReservationsList}
        options={{ title: "Mis Reservas" }}
      />
    </Stack.Navigator>
  );
}
