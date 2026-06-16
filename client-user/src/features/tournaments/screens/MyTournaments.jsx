// src/features/tournaments/screens/MyTournaments.jsx
import { useEffect } from "react";
import {
  FlatList,
  View,
  Text,
  Image,
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
import useTournaments from "../hooks/useTournaments.js";

const STATUS_COLORS = {
  OPEN: COLORS.success,
  PENDIENTE: COLORS.success,
  IN_PROGRESS: COLORS.warning,
  "EN PROGRESO": COLORS.warning,
  FINISHED: COLORS.secondary,
  TERMINADO: COLORS.secondary,
  CANCELLED: COLORS.error,
  CANCELADO: COLORS.error,
};

export default function MyTournaments() {
  const { myTournaments, loading, error, fetchMyTournaments } =
    useTournaments();

  useEffect(() => {
    fetchMyTournaments();
  }, [fetchMyTournaments]);

  if (loading && myTournaments.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <FlatList
        data={myTournaments}
        keyExtractor={(item) => String(item._id ?? item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchMyTournaments}
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
              icon="emoji-events"
              title="Sin torneos inscritos"
              message="Aún no estás inscrito en ningún torneo."
            />
          )
        }
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.statusKey] ?? COLORS.textLight;

          return (
            <Card style={styles.card}>
              {item.logoUrl ? (
                <Image source={{ uri: item.logoUrl }} style={styles.logo} />
              ) : (
                <View style={styles.logoFallback}>
                  <MaterialIcons
                    name="emoji-events"
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
              )}

              <View style={styles.info}>
                <View style={styles.titleRow}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.displayName}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: statusColor + "22" },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                      {item.displayStatus}
                    </Text>
                  </View>
                </View>

                {item.displayCategory ? (
                  <Text style={styles.category}>{item.displayCategory}</Text>
                ) : null}

                {item.displayDateRange ? (
                  <View style={styles.metaRow}>
                    <MaterialIcons
                      name="event"
                      size={14}
                      color={COLORS.textLight}
                    />
                    <Text style={styles.metaText}>{item.displayDateRange}</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, gap: SPACING.sm },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    padding: SPACING.sm,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  logoFallback: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
  category: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondary,
  },
});
