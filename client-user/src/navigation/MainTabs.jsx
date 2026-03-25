import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { COLORS } from "../shared/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";

// Screen imports
import FieldsScreen from "../features/fields/screens/FieldsScreen";
import FieldDetailScreen from "../features/fields/screens/FieldDetailScreen";
import TeamsScreen from "../features/teams/screens/TeamsScreen";
import TeamDetailScreen from "../features/teams/screens/TeamDetailScreen";
import MyTeamsScreen from "../features/teams/screens/MyTeamsScreen";
import CreateTeamScreen from "../features/teams/screens/CreateTeamScreen";
import TournamentsScreen from "../features/tournaments/screens/TournamentsScreen";
import TournamentDetailScreen from "../features/tournaments/screens/TournamentDetailScreen";
import MyTournamentsScreen from "../features/tournaments/screens/MyTournamentsScreen";
import ReservationsScreen from "../features/reservations/screens/ReservationsScreen";
import CreateReservationScreen from "../features/reservations/screens/CreateReservationScreen";
import ProfileScreen from "../features/profile/screens/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stacks for nested navigation
const FieldsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="FieldsList"
      component={FieldsScreen}
      options={{ title: "Canchas" }}
    />
    <Stack.Screen
      name="FieldDetail"
      component={FieldDetailScreen}
      options={{ title: "Detalle" }}
    />
    <Stack.Screen
      name="CreateReservation"
      component={CreateReservationScreen}
      options={{ title: "Reservar" }}
    />
  </Stack.Navigator>
);

const TeamsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="TeamsList"
      component={TeamsScreen}
      options={{ title: "Equipos" }}
    />
    <Stack.Screen
      name="TeamDetail"
      component={TeamDetailScreen}
      options={{ title: "Detalle Equipo" }}
    />
    <Stack.Screen
      name="MyTeams"
      component={MyTeamsScreen}
      options={{ title: "Mis Equipos" }}
    />
    <Stack.Screen
      name="CreateTeam"
      component={CreateTeamScreen}
      options={{ title: "Crear Equipo" }}
    />
  </Stack.Navigator>
);

const TournamentsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="TournamentsList"
      component={TournamentsScreen}
      options={{ title: "Torneos" }}
    />
    <Stack.Screen
      name="TournamentDetail"
      component={TournamentDetailScreen}
      options={{ title: "Detalle Torneo" }}
    />
    <Stack.Screen
      name="MyTournaments"
      component={MyTournamentsScreen}
      options={{ title: "Mis Torneos" }}
    />
  </Stack.Navigator>
);

const ReservationsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ReservationsList"
      component={ReservationsScreen}
      options={{ title: "Mis Reservas" }}
    />
  </Stack.Navigator>
);

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Fields") iconName = "sports-soccer";
          else if (route.name === "Teams") iconName = "groups";
          else if (route.name === "Tournaments") iconName = "emoji-events";
          else if (route.name === "Reservations") iconName = "event";
          else if (route.name === "Profile") iconName = "person";

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Fields"
        component={FieldsStack}
        options={{ title: "Canchas" }}
      />
      <Tab.Screen
        name="Teams"
        component={TeamsStack}
        options={{ title: "Equipos" }}
      />
      <Tab.Screen
        name="Tournaments"
        component={TournamentsStack}
        options={{ title: "Torneos" }}
      />
      <Tab.Screen
        name="Reservations"
        component={ReservationsStack}
        options={{ title: "Reservas" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Perfil", headerShown: true }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
