import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Image } from "react-native";
import { COLORS, SPACING, FONT_SIZE } from "../../constants/theme";
import Button from "../../components/common/Button";
import { Card } from "../../components/common/Common";
import { useAuthStore } from "../../store/authStore";
import { useTeams } from "../../hooks/useTeams";

const TeamDetailScreen = ({ route }) => {
  const { team } = route.params;
  const { user } = useAuthStore();
  const { joinTeam, leaveTeam, getTeams, loading: hookLoading } = useTeams();
  const [loading, setLoading] = useState(false);
  const [isMember, setIsMember] = useState(team.members?.includes(user?._id));

  const handleAction = async () => {
    try {
      setLoading(true);
      if (isMember) {
        await leaveTeam(team._id);
        setIsMember(false);
        Alert.alert("Éxito", "Has salido del equipo");
      } else {
        await joinTeam(team._id);
        setIsMember(true);
        Alert.alert("Éxito", "Te has unido al equipo");
      }
      await getTeams();
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Error al procesar acción",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: team.logo?.startsWith("http")
              ? team.logo
              : "https://res.cloudinary.com/dug3apxt3/image/upload/v1727339000/kinal_sports/" +
                (team.logo || "kinal_sports_nyvxo5"),
          }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.name}>{team.teamName}</Text>
        <Text style={styles.sport}>
          {team.category?.replace("_", " ") || "Fútbol"}
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Representante / Manager</Text>
          <Text style={styles.captainName}>
            {team.managerId === user?.id || team.managerId === user?._id
              ? `Tú (${user?.name || user?.username || "Representante"})`
              : `ID: ${team.managerId}`}
          </Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Integrantes ({team.members?.length || 0})
          </Text>
          {team.members?.map((memberId, idx) => (
            <Text key={idx} style={styles.memberItem}>
              • {memberId}
            </Text>
          ))}
        </Card>

        <View style={styles.footer}>
          <Button
            title={isMember ? "Salir del Equipo" : "Unirse al Equipo"}
            variant={isMember ? "secondary" : "primary"}
            onPress={handleAction}
            loading={loading || hookLoading}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    color: COLORS.surface,
  },
  sport: {
    fontSize: FONT_SIZE.md,
    color: "#dbeafe",
    marginTop: 4,
    fontWeight: "700",
  },
  content: {
    padding: SPACING.lg,
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.secondary,
  },
  captainName: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: "600",
  },
  memberItem: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  footer: {
    marginTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
});

export default TeamDetailScreen;
