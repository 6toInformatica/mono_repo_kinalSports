import React, { useCallback, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useTournaments } from "../../hooks/useTournaments";
import { COLORS, SPACING, FONT_SIZE } from "../../constants/theme";
import {
  LoadingSpinner,
  EmptyState,
  Card,
} from "../../components/common/Common";

const MyTournamentsScreen = () => {
  const { myTournaments, loading, getMyTournaments } = useTournaments();

  useEffect(() => {
    getMyTournaments();
  }, [getMyTournaments]);

  const onRefresh = useCallback(() => {
    getMyTournaments();
  }, [getMyTournaments]);

  if (loading && !myTournaments.length) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={myTournaments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.category}>
              {item.category || "Masc. Libre"}
            </Text>
            <View style={styles.details}>
              <Text style={styles.row}>Inscrito con el equipo del usuario</Text>
            </View>
          </Card>
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
          <EmptyState message="Aún no estás inscrito en ningún torneo" />
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
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  category: {
    fontSize: FONT_SIZE.sm,
    color: "#d97706",
    fontWeight: "600",
    marginTop: 2,
  },
  details: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  row: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
});

export default MyTournamentsScreen;
