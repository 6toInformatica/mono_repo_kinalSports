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
import { useTeams } from "../hooks/useTeams.js";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import {
  LoadingSpinner,
  EmptyState,
  Card,
} from "../../../shared/components/common/Common.jsx";

const TeamCard = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <Card style={styles.card}>
      <View style={styles.cardContent}>
        <Image
          source={{
            uri: item.logo?.startsWith("http")
              ? item.logo
              : "https://res.cloudinary.com/dug3apxt3/image/upload/v1727339000/kinal_sports/" +
                (item.logo || "kinal_sports_nyvxo5"),
          }}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.cardRight}>
          <View style={styles.header}>
            <Text style={styles.name}>{item.teamName}</Text>
            <Text style={styles.sport}>
              {item.category?.replace("_", " ") || "Fútbol"}
            </Text>
          </View>
          <View style={styles.details}>
            <Text style={styles.info}>ID Manager: {item.managerId}</Text>
            <View style={styles.footer}>
              <Text style={styles.members}>
                {item.members?.length || 0} integrantes
              </Text>
              <Text style={styles.actionText}>Ver más</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);

const TeamsScreen = ({ navigation }) => {
  const { teams, loading, getTeams, getMyTeams } = useTeams();

  useEffect(() => {
    getTeams();
    getMyTeams();
  }, [getTeams, getMyTeams]);

  const onRefresh = useCallback(() => {
    getTeams();
    getMyTeams();
  }, [getTeams, getMyTeams]);

  if (loading && !teams.length) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.topActions}>
        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          <TouchableOpacity
            style={styles.myTeamsBtn}
            onPress={() => navigation.navigate("MyTeams")}
          >
            <Text style={styles.myTeamsBtnText}>Mis Equipos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createTeamBtn}
            onPress={() => navigation.navigate("CreateTeam")}
          >
            <Text style={styles.createTeamBtnText}>+ Crear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={teams}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TeamCard
            item={item}
            onPress={() => navigation.navigate("TeamDetail", { team: item })}
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
        ListEmptyComponent={<EmptyState message="No hay equipos creados" />}
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
  myTeamsBtn: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  myTeamsBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: FONT_SIZE.sm,
  },
  createTeamBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  createTeamBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: FONT_SIZE.sm,
  },
  listContent: {
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.sm,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  cardRight: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  sport: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  details: {
    marginTop: SPACING.sm,
  },
  info: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.secondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    alignItems: "center",
  },
  members: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.primary,
  },
});

export default TeamsScreen;
