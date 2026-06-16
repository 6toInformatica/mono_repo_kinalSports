import React, { useCallback, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useTeams } from "../hooks/useTeams.js";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import {
  LoadingSpinner,
  EmptyState,
  Card,
} from "../../../shared/components/common/Common.jsx";

const MyTeamsScreen = () => {
  const { myTeams, loading, getMyTeams } = useTeams();

  useEffect(() => {
    getMyTeams();
  }, [getMyTeams]);

  const onRefresh = useCallback(() => {
    getMyTeams();
  }, [getMyTeams]);

  if (loading && !myTeams.length) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={myTeams}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.name}>{item.teamName}</Text>
            <Text style={styles.sport}>
              {item.category?.replace("_", " ") || "Fútbol"}
            </Text>
            <View style={styles.members}>
              <Text style={styles.membersText}>
                {item.members?.length || 0} integrantes
              </Text>
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
          <EmptyState message="No perteneces a ningún equipo aún" />
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
  sport: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  members: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  membersText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
});

export default MyTeamsScreen;
