// src/features/reservations/screens/ReservationsList.jsx
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  LoadingSpinner,
  EmptyState,
} from "../../../shared/components/common/Common.jsx";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme.js";
import useReservations from "../hooks/useReservations.js";

const STATUS_CONFIG = {
  PENDING: { label: "Pendiente", color: COLORS.warning },
  CONFIRMED: { label: "Confirmada", color: COLORS.success },
  CANCELLED: { label: "Cancelada", color: COLORS.error },
  COMPLETED: { label: "Completada", color: COLORS.secondary },
};

export default function ReservationsList({ navigation }) {
  const { reservations, loading, error, refetch, cancelReservation } =
    useReservations();

  const handleCancel = (id) => {
    Alert.alert(
      "Cancelar reserva",
      "¿Estás seguro de que deseas cancelar esta reserva?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelReservation(id);
            } catch (_) {}
          },
        },
      ],
    );
  };

  if (loading && reservations.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => String(item._id ?? item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
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
              icon="event-busy"
              title="Sin reservas"
              message="Aún no tienes reservas registradas."
            />
          )
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.normalizedStatus] ?? {
            label: item.normalizedStatus,
            color: COLORS.textLight,
          };
          const canCancel =
            item.normalizedStatus === "PENDING" ||
            item.normalizedStatus === "CONFIRMED";

          return (
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.fieldName} numberOfLines={1}>
                  {item.field?.name ?? "Cancha"}
                </Text>
                <View
                  style={[styles.badge, { backgroundColor: cfg.color + "22" }]}
                >
                  <Text style={[styles.badgeText, { color: cfg.color }]}>
                    {cfg.label}
                  </Text>
                </View>
              </View>

              {item.displayDate || item.displayStartTime ? (
                <Text style={styles.meta}>
                  {item.displayDate}
                  {item.displayStartTime
                    ? `  •  ${item.displayStartTime} – ${item.displayEndTime ?? ""}`
                    : ""}
                </Text>
              ) : null}

              {item.totalPrice ? (
                <Text style={styles.price}>Q {item.totalPrice}</Text>
              ) : null}

              {canCancel ? (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancel(item._id ?? item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancelar reserva</Text>
                </TouchableOpacity>
              ) : null}
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
  card: { gap: SPACING.xs },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldName: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
  meta: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  price: { fontSize: FONT_SIZE.sm, fontWeight: "500", color: COLORS.text },
  cancelBtn: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.error,
  },
});
