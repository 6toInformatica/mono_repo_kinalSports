// src/features/tournaments/navigation/TournamentsStack.jsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TournamentsList from "../screens/TournamentsList.jsx";
import TournamentDetail from "../screens/TournamentDetail.jsx";
import MyTournaments from "../screens/MyTournaments.jsx";

const Stack = createNativeStackNavigator();

export default function TournamentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TournamentsList"
        component={TournamentsList}
        options={{ title: "Torneos" }}
      />
      <Stack.Screen
        name="TournamentDetail"
        component={TournamentDetail}
        options={{ title: "Detalle de Torneo" }}
      />
      <Stack.Screen
        name="MyTournaments"
        component={MyTournaments}
        options={{ title: "Mis Torneos" }}
      />
    </Stack.Navigator>
  );
}
