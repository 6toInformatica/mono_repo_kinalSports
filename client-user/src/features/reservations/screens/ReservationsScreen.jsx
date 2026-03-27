import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useReservations } from "../hooks/useReservations.js";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import {
  LoadingSpinner,
  EmptyState,
  Card,
} from "../../../shared/components/common/Common.jsx";

const ReservationCard = ({ item, onCancel }) => {
  const start = item.startTime ? new Date(item.startTime) : null;
  const end = item.endTime ? new Date(item.endTime) : null;
  const date = start ? start.toLocaleDateString() : "Fecha no disponible";
  const time =
    start && end
      ? `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "Hora no disponible";
  const status = item.normalizedStatus || (item.status || "").toUpperCase();
  const isConfirmed = status === "CONFIRMED";
  const canCancel = !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(status);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.fieldName}>
          {item.field?.name || "Cancha no disponible"}
        </Text>
        <View
          style={[
            styles.statusBadge,
            isConfirmed ? styles.confirmed : styles.pending,
          ]}
        >
          <Text style={styles.statusText}>
            {isConfirmed ? "Confirmada" : status}
          </Text>
        </View>
      </View>
      <View style={styles.details}>
        <Text style={styles.info}>📅 {date}</Text>
        <Text style={styles.info}>⏰ {time}</Text>
        <Text style={styles.price}>Q{item.totalPrice || 0}</Text>
      </View>
      {canCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => onCancel(item)}
        >
          <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const ReservationsScreen = () => {
  const { reservations, loading, getReservations, cancelReservation } =
    useReservations();
  const handleCancelReservation = (reservation) => {
    Alert.alert(
      "Cancelar reserva",
      "¿Seguro que deseas cancelar esta reserva?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelReservation(reservation._id);
              Alert.alert("Éxito", "La reserva fue cancelada correctamente.");
            } catch (err) {
              Alert.alert(
                "Error",
                err.response?.data?.message ||
                  "No se pudo cancelar la reserva.",
              );
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    getReservations();
  }, [getReservations]);

  const onRefresh = useCallback(() => {
    getReservations();
  }, [getReservations]);

  if (loading && !reservations.length) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ReservationCard item={item} onCancel={handleCancelReservation} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState message="No has realizado ninguna reserva" />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  fieldName: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confirmed: {
    backgroundColor: COLORS.success + "20",
  },
  pending: {
    backgroundColor: COLORS.warning + "20",
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.text,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  info: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.secondary,
  },
  price: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.primary,
  },
  cancelButton: {
    marginTop: SPACING.md,
    alignSelf: "flex-end",
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: FONT_SIZE.sm,
  },
});

export default ReservationsScreen;
