// src/features/teams/screens/TeamsList.jsx
import {
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Card,
  LoadingSpinner,
  EmptyState,
} from "../../../shared/components/common/Common.jsx";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme.js";
import useTeams from "../hooks/useTeams.js";

const CATEGORY_LABELS = {
  FUTBOL_7: "Fútbol 7",
  FUTBOL_11: "Fútbol 11",
};

export default function TeamsList({ navigation }) {
  const { teams, listLoading, error, refetch } = useTeams();

  if (listLoading && teams.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate("MyTeams")}
        >
          <MaterialIcons name="groups" size={18} color={COLORS.primary} />
          <Text style={styles.headerBtnText}>Mis equipos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerBtn, styles.headerBtnPrimary]}
          onPress={() => navigation.navigate("CreateTeam")}
        >
          <MaterialIcons name="add" size={18} color={COLORS.surface} />
          <Text style={[styles.headerBtnText, styles.headerBtnTextPrimary]}>
            Crear equipo
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={teams}
        keyExtractor={(item) => String(item._id ?? item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={listLoading}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          error ? (
            <EmptyState
              icon="error-outline"
              title="Error al cargar"
              message={error}
            />
          ) : (
            <EmptyState
              icon="groups"
              title="Sin equipos"
              message="Aún no hay equipos registrados."
            />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("TeamDetail", { team: item })}
          >
            <Card style={styles.card}>
              {(item.logo ?? item.photo) ? (
                <Image
                  source={{ uri: item.logo ?? item.photo }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {(item.teamName ?? item.name ?? "?")[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.teamName ?? item.name}
                </Text>
                <Text style={styles.sport} numberOfLines={1}>
                  {CATEGORY_LABELS[item.category] ??
                    item.category ??
                    item.sport ??
                    ""}
                </Text>
                <Text style={styles.members}>
                  {(item.members?.length ?? 0) +
                    (item.namedMembers?.length ?? 0)}{" "}
                  miembros
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  headerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  headerBtnPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  headerBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.primary,
  },
  headerBtnTextPrimary: { color: COLORS.surface },
  list: { padding: SPACING.md, gap: SPACING.sm },
  card: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.surface,
  },
  info: { flex: 1 },
  name: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.text },
  sport: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: 2 },
  members: { fontSize: FONT_SIZE.xs, color: COLORS.secondary, marginTop: 4 },
});
