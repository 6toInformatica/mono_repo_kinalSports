// src/features/teams/screens/MyTeams.jsx
import { useEffect } from "react";
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
import {
  Card,
  LoadingSpinner,
  EmptyState,
} from "../../../shared/components/common/Common.jsx";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme.js";
import useTeams from "../hooks/useTeams.js";

export default function MyTeams({ navigation }) {
  const { myTeams, listLoading, error, fetchMyTeams } = useTeams();

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  if (listLoading && myTeams.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <FlatList
        data={myTeams}
        keyExtractor={(item) => String(item._id ?? item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={listLoading}
            onRefresh={fetchMyTeams}
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
              message="Aún no perteneces a ningún equipo."
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
                  {item.sport ?? item.category ?? ""}
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
  list: { padding: SPACING.md, gap: SPACING.sm },
  card: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.surface,
  },
  info: { flex: 1 },
  name: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.text },
  sport: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: 2 },
});
