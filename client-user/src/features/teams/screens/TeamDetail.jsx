// src/features/teams/screens/TeamDetail.jsx
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Button from "../../../shared/components/common/Button.jsx";
import {
  Card,
  LoadingSpinner,
} from "../../../shared/components/common/Common.jsx";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme.js";
import useTeams from "../hooks/useTeams.js";
import useAuthStore from "../../../shared/store/authStore.js";
import { getAuthUserId } from "../../../shared/utils/authUser.js";
import {
  resolveCaptainName,
  resolveMemberLabel,
} from "../../../shared/utils/teamDisplay.js";

const CATEGORY_LABELS = {
  FUTBOL_7: "Fútbol 7",
  FUTBOL_11: "Fútbol 11",
};

function InfoRow({ label, value }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value ?? "—"}</Text>
    </View>
  );
}

export default function TeamDetail({ navigation, route }) {
  const routeTeam = route.params?.team;
  const routeTeamId = routeTeam?._id ?? routeTeam?.id;
  const [team, setTeam] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [newMemberName, setNewMemberName] = useState("");
  const [newAppUsername, setNewAppUsername] = useState("");
  const {
    fetchTeamById,
    joinTeam,
    leaveTeam,
    addNamedMember,
    removeNamedMember,
    addAppMember,
    removeAppMember,
    actionLoading,
    error,
    clearError,
  } = useTeams();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const teamId = routeTeamId ?? team?._id ?? team?.id;
  const userId = getAuthUserId(user, token);
  const currentUsername = (user?.username ?? "").toLowerCase();

  const loadTeam = useCallback(async () => {
    if (!routeTeamId) return;
    setLoadingTeam(true);
    try {
      const freshTeam = await fetchTeamById(routeTeamId);
      setTeam(freshTeam);
      clearError?.();
    } catch (loadError) {
      console.warn("Error al cargar equipo:", loadError);
      if (routeTeam) {
        setTeam(routeTeam);
      }
    } finally {
      setLoadingTeam(false);
    }
  }, [clearError, fetchTeamById, routeTeam, routeTeamId]);

  useFocusEffect(
    useCallback(() => {
      loadTeam();
    }, [loadTeam]),
  );

  if (loadingTeam && !team) {
    return <LoadingSpinner />;
  }

  if (!team) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se encontró el equipo.</Text>
      </View>
    );
  }

  const members = team.members ?? [];
  const namedMembers = team.namedMembers ?? [];
  const memberProfiles = team.memberProfiles ?? [];
  const captainProfile = memberProfiles.find((profile) => profile.isCaptain);

  const isCaptainById =
    Boolean(userId) && String(team.managerId) === String(userId);
  const isCaptainByUsername =
    Boolean(currentUsername) &&
    captainProfile?.username?.toLowerCase() === currentUsername;
  const isCaptain = isCaptainById || isCaptainByUsername;

  const isMemberById =
    Boolean(userId) && members.some((m) => String(m) === String(userId));
  const isMemberByUsername =
    Boolean(currentUsername) &&
    memberProfiles.some((p) => p.username?.toLowerCase() === currentUsername);
  const isMember = isMemberById || isMemberByUsername || isCaptain;

  const totalMembers = members.length + namedMembers.length;
  const captainName = resolveCaptainName(team, user);

  const handleJoin = async () => {
    if (isMember) return;
    try {
      const updated = await joinTeam(teamId);
      setTeam(updated);
      Alert.alert(
        "¡Bienvenido!",
        `Te has unido a ${team.teamName ?? team.name}.`,
      );
    } catch (joinError) {
      const message = joinError?.response?.data?.message ?? "";
      if (message.includes("Ya eres miembro")) {
        await loadTeam();
      }
    }
  };

  const handleLeave = () => {
    Alert.alert(
      "Salir del equipo",
      "¿Estás seguro de que deseas salir de este equipo?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, salir",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveTeam(teamId);
              navigation.goBack();
            } catch (_) {}
          },
        },
      ],
    );
  };

  const handleAddAppMember = async () => {
    const trimmed = newAppUsername.trim();
    if (!trimmed) return;
    try {
      const updated = await addAppMember(teamId, trimmed);
      setTeam(updated);
      setNewAppUsername("");
    } catch (_) {}
  };

  const handleRemoveAppMember = (memberUserId, displayName) => {
    Alert.alert("Eliminar miembro", `¿Quitar a ${displayName} del equipo?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await removeAppMember(teamId, memberUserId);
            setTeam(updated);
          } catch (_) {}
        },
      },
    ]);
  };

  const handleAddNamedMember = async () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    try {
      const updated = await addNamedMember(teamId, trimmed);
      setTeam(updated);
      setNewMemberName("");
    } catch (_) {}
  };

  const handleRemoveNamedMember = (memberId, name) => {
    Alert.alert("Eliminar jugador", `¿Quitar a ${name} del roster?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await removeNamedMember(teamId, memberId);
            setTeam(updated);
          } catch (_) {}
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {(team.logo ?? team.photo) ? (
            <Image
              source={{ uri: team.logo ?? team.photo }}
              style={styles.logo}
            />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoInitial}>
                {(team.teamName ?? team.name ?? "?")[0].toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{team.teamName ?? team.name}</Text>
          <Text style={styles.sport}>
            {CATEGORY_LABELS[team.category] ??
              team.category ??
              team.sport ??
              ""}
          </Text>
        </View>

        <Card style={styles.card}>
          <InfoRow label="Capitán" value={captainName} />
          <InfoRow label="Miembros app" value={String(members.length)} />
          <InfoRow
            label="Roster por nombre"
            value={String(namedMembers.length)}
          />
          <InfoRow label="Total" value={String(totalMembers)} />
        </Card>

        {memberProfiles.length > 0 ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Miembros de la app</Text>
            {memberProfiles.map((profile) => {
              const memberLabel = resolveMemberLabel(profile, user);
              return (
                <View key={profile.userId} style={styles.rosterItem}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.rosterName}>{memberLabel}</Text>
                    {profile.isCaptain ? (
                      <Text style={styles.captainBadge}>Capitán</Text>
                    ) : null}
                  </View>
                  {isCaptain && !profile.isCaptain ? (
                    <TouchableOpacity
                      onPress={() =>
                        handleRemoveAppMember(profile.userId, memberLabel)
                      }
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={20}
                        color={COLORS.error}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </Card>
        ) : null}

        {namedMembers.length > 0 ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Jugadores del roster</Text>
            {namedMembers.map((member) => (
              <View key={member._id ?? member.name} style={styles.rosterItem}>
                <Text style={styles.rosterName}>{member.name}</Text>
                {isCaptain && member._id ? (
                  <TouchableOpacity
                    onPress={() =>
                      handleRemoveNamedMember(member._id, member.name)
                    }
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={20}
                      color={COLORS.error}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </Card>
        ) : null}

        {isCaptain ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Agregar usuario de la app</Text>
            <Text style={styles.sectionHint}>
              Ingresa el username del jugador registrado en la app.
            </Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="Username"
                autoCapitalize="none"
                value={newAppUsername}
                onChangeText={setNewAppUsername}
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAddAppMember}
              >
                <MaterialIcons
                  name="person-add"
                  size={20}
                  color={COLORS.surface}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
              Agregar jugador solo por nombre
            </Text>
            <Text style={styles.sectionHint}>
              Para jugadores que no tienen cuenta en la app.
            </Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="Nombre del jugador"
                value={newMemberName}
                onChangeText={setNewMemberName}
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAddNamedMember}
              >
                <MaterialIcons
                  name="person-add"
                  size={20}
                  color={COLORS.surface}
                />
              </TouchableOpacity>
            </View>
          </Card>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isMember && !isCaptain ? (
          <Button
            title="Salir del equipo"
            variant="secondary"
            onPress={handleLeave}
            loading={actionLoading}
            style={styles.button}
          />
        ) : null}

        {!isMember ? (
          <Button
            title="Unirse al equipo"
            onPress={handleJoin}
            loading={actionLoading}
            style={styles.button}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { alignItems: "center", marginBottom: SPACING.lg },
  logo: { width: 100, height: 100, borderRadius: 50, marginBottom: SPACING.sm },
  logoFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  logoInitial: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: "700",
    color: COLORS.surface,
  },
  name: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
  sport: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  card: { marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  sectionSpacing: { marginTop: SPACING.md },
  rosterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  memberInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  rosterName: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  captainBadge: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: "600",
  },
  addRow: { flexDirection: "row", gap: SPACING.sm, alignItems: "center" },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    backgroundColor: COLORS.surface,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  button: { marginTop: SPACING.sm },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  label: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  value: { fontSize: FONT_SIZE.sm, fontWeight: "500", color: COLORS.text },
});
