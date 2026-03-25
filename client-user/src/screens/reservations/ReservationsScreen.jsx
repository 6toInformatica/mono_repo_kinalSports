import React, { useCallback, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useReservations } from "../../hooks/useReservations";
import { COLORS, SPACING, FONT_SIZE } from "../../constants/theme";
import {
  LoadingSpinner,
  EmptyState,
  Card,
} from "../../components/common/Common";

const ReservationCard = ({ item }) => {
  const date = new Date(item.date).toLocaleDateString();
  const time = item.time;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.fieldName}>
          {item.field?.name || "Cancha Eliminada"}
        </Text>
        <View
          style={[
            styles.statusBadge,
            item.status === "confirmed" ? styles.confirmed : styles.pending,
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === "confirmed" ? "Confirmada" : "Pendiente"}
          </Text>
        </View>
      </View>
      <View style={styles.details}>
        <Text style={styles.info}>📅 {date}</Text>
        <Text style={styles.info}>⏰ {time}</Text>
        <Text style={styles.price}>Q{item.totalPrice || 0}</Text>
      </View>
    </Card>
  );
};

const ReservationsScreen = () => {
  const { reservations, loading, getReservations } = useReservations();

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
        renderItem={({ item }) => <ReservationCard item={item} />}
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
});

export default ReservationsScreen;
