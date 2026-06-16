// src/navigation/MainTabs.jsx
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONT_SIZE } from "../shared/constants/theme.js";
import FieldsStack from "../features/fields/navigation/FieldsStack.jsx";
import TeamsStack from "../features/teams/navigation/TeamsStack.jsx";
import TournamentsStack from "../features/tournaments/navigation/TournamentsStack.jsx";
import ReservationsStack from "../features/reservations/navigation/ReservationsStack.jsx";
import ProfileScreen from "../features/profile/screens/ProfileScreen.jsx";

const Tab = createBottomTabNavigator();

const TAB_BAR_BASE_HEIGHT = 56;

/** Devuelve un componente de ícono MaterialIcons para la tabBar. */
function makeIcon(name) {
  return ({ color, size }) => (
    <MaterialIcons name={name} size={size} color={color} />
  );
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: TAB_BAR_BASE_HEIGHT + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Fields"
        component={FieldsStack}
        options={{
          title: "Canchas",
          tabBarIcon: makeIcon("sports-soccer"),
        }}
      />

      <Tab.Screen
        name="Teams"
        component={TeamsStack}
        options={{
          title: "Equipos",
          tabBarIcon: makeIcon("groups"),
        }}
      />

      <Tab.Screen
        name="Tournaments"
        component={TournamentsStack}
        options={{
          title: "Torneos",
          tabBarIcon: makeIcon("emoji-events"),
        }}
      />

      <Tab.Screen
        name="Reservations"
        component={ReservationsStack}
        options={{
          title: "Reservas",
          tabBarIcon: makeIcon("event"),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          headerShown: true,
          tabBarIcon: makeIcon("person"),
        }}
      />
    </Tab.Navigator>
  );
}
