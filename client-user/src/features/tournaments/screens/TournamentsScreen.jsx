import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useTournaments } from "../../hooks/useTournaments";
import { COLORS, SPACING, FONT_SIZE } from "../../constants/theme";
import {
  LoadingSpinner,
  EmptyState,
  Card,
} from "../../components/common/Common";

const TournamentCard = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <Card style={styles.card}>
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.category || "Abierto"}</Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {item.description ||
            "Prepárate para la gloria en este emocionante torneo deportivo."}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.teamsCount}>
            {item.teams?.length || 0} equipos inscritos
          </Text>
          <Text style={styles.date}>
            {item.startDate
              ? new Date(item.startDate).toLocaleDateString()
              : "Sin fecha"}
          </Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);

const TournamentsScreen = ({ navigation }) => {
  const { tournaments, loading, getTournaments } = useTournaments();

  useEffect(() => {
    getTournaments();
  }, [getTournaments]);

  const onRefresh = useCallback(() => {
    getTournaments();
  }, [getTournaments]);

  if (loading && !tournaments.length) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.topActions}>
        <TouchableOpacity
          style={styles.myTournamentsBtn}
          onPress={() => navigation.navigate("MyTournaments")}
        >
          <Text style={styles.myTournamentsBtnText}>Mis Torneos</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tournaments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TournamentCard
            item={item}
            onPress={() =>
              navigation.navigate("TournamentDetail", { tournament: item })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState message="No hay torneos vigentes" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topActions: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: "flex-end",
  },
  myTournamentsBtn: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  myTournamentsBtnText: {
    color: "#d97706",
    fontWeight: "700",
    fontSize: FONT_SIZE.sm,
  },
  listContent: {
    padding: SPACING.md,
  },
  card: {
    padding: 0,
    overflow: "hidden",
    marginBottom: SPACING.md,
  },
  image: {
    width: "100%",
    height: 120,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: "700",
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.secondary,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  teamsCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: "700",
  },
  date: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
});

export default TournamentsScreen;
