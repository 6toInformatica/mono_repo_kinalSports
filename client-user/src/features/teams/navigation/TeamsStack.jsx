// src/features/teams/navigation/TeamsStack.jsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TeamsList from "../screens/TeamsList.jsx";
import TeamDetail from "../screens/TeamDetail.jsx";
import MyTeams from "../screens/MyTeams.jsx";
import CreateTeam from "../screens/CreateTeam.jsx";

const Stack = createNativeStackNavigator();

export default function TeamsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TeamsList"
        component={TeamsList}
        options={{ title: "Equipos" }}
      />
      <Stack.Screen
        name="TeamDetail"
        component={TeamDetail}
        options={{ title: "Detalle de Equipo" }}
      />
      <Stack.Screen
        name="MyTeams"
        component={MyTeams}
        options={{ title: "Mis Equipos" }}
      />
      <Stack.Screen
        name="CreateTeam"
        component={CreateTeam}
        options={{ title: "Crear Equipo" }}
      />
    </Stack.Navigator>
  );
}
