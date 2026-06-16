// src/features/fields/navigation/FieldsStack.jsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FieldsList from "../screens/FieldsList.jsx";
import FieldDetail from "../screens/FieldDetail.jsx";
import CreateReservation from "../screens/CreateReservation.jsx";

const Stack = createNativeStackNavigator();

export default function FieldsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FieldsList"
        component={FieldsList}
        options={{ title: "Canchas" }}
      />
      <Stack.Screen
        name="FieldDetail"
        component={FieldDetail}
        options={{ title: "Detalle de Cancha" }}
      />
      <Stack.Screen
        name="CreateReservation"
        component={CreateReservation}
        options={{ title: "Crear Reserva" }}
      />
    </Stack.Navigator>
  );
}
