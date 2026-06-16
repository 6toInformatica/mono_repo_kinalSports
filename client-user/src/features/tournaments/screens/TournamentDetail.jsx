// src/features/tournaments/screens/TournamentDetail.jsx
import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Button from "../../../shared/components/common/Button.jsx";
import { Card } from "../../../shared/components/common/Common.jsx";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme.js";
import { mapTournament } from "../../../shared/utils/tournamentFormat.js";
import useTournaments from "../hooks/useTournaments.js";
import useTeams from "../../teams/hooks/useTeams.js";

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

function InfoRow({ icon, label, value }) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.labelWrap}>
        {icon ? (
          <MaterialIcons name={icon} size={16} color={COLORS.textLight} />
        ) : null}
        <Text style={rowStyles.label}>{label}</Text>
      </View>
      <Text style={rowStyles.value}>{value ?? "—"}</Text>
    </View>
  );
}

export default function TournamentDetail({ route }) {
  const rawTournament = route.params?.tournament;
  const tournament = useMemo(
    () => (rawTournament ? mapTournament(rawTournament) : null),
    [rawTournament],
  );
  const {
    registerToTournament,
    loading: regLoading,
    error: regError,
  } = useTournaments();
  const { myTeams, fetchMyTeams, listLoading: teamsLoading } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  if (!tournament) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se encontró el torneo.</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[tournament.statusKey] ?? COLORS.textLight;
  const isOpen =
    tournament.statusKey === "OPEN" || tournament.statusKey === "PENDIENTE";

  const handleRegister = async () => {
    if (!selectedTeamId) {
      Alert.alert(
        "Selecciona un equipo",
        "Debes elegir un equipo para inscribirte.",
      );
      return;
    }
    try {
      await registerToTournament(
        tournament._id ?? tournament.id,
        selectedTeamId,
      );
      Alert.alert(
        "¡Inscripción exitosa!",
        "Tu equipo ha sido registrado en el torneo.",
      );
      setSelectedTeamId(null);
    } catch (_) {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {tournament.logoUrl ? (
            <Image
              source={{ uri: tournament.logoUrl }}
              style={styles.heroImage}
            />
          ) : (
            <View style={styles.heroFallback}>
              <MaterialIcons
                name="emoji-events"
                size={48}
                color={COLORS.primary}
              />
            </View>
          )}
        </View>

        <Text style={styles.title}>{tournament.displayName}</Text>

        <View style={styles.chips}>
          {tournament.displayCategory ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{tournament.displayCategory}</Text>
            </View>
          ) : null}
          <View style={[styles.chip, { backgroundColor: statusColor + "22" }]}>
            <Text style={[styles.chipText, { color: statusColor }]}>
              {tournament.displayStatus}
            </Text>
          </View>
        </View>

        <Card style={styles.card}>
          <InfoRow
            icon="flag"
            label="Estado"
            value={tournament.displayStatus}
          />
          <InfoRow
            icon="event"
            label="Inicio"
            value={tournament.displayStartDate}
          />
          <InfoRow icon="event" label="Fin" value={tournament.displayEndDate} />
          <InfoRow
            icon="groups"
            label="Equipos inscritos"
            value={String(tournament.teamsCount)}
          />
          {tournament.prize ? (
            <InfoRow icon="star" label="Premio" value={tournament.prize} />
          ) : null}
        </Card>

        {tournament.description ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{tournament.description}</Text>
          </Card>
        ) : null}

        {isOpen ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Inscribir equipo</Text>

            {teamsLoading ? (
              <Text style={styles.hint}>Cargando tus equipos...</Text>
            ) : myTeams.length === 0 ? (
              <Text style={styles.hint}>
                Aún no perteneces a ningún equipo. Únete a uno desde la pestaña
                Equipos.
              </Text>
            ) : (
              myTeams.map((team) => {
                const tid = team._id ?? team.id;
                const selected = selectedTeamId === tid;
                return (
                  <TouchableOpacity
                    key={String(tid)}
                    style={[
                      styles.teamOption,
                      selected && styles.teamOptionSelected,
                    ]}
                    onPress={() => setSelectedTeamId(tid)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.teamOptionText,
                        selected && styles.teamOptionTextSelected,
                      ]}
                    >
                      {team.teamName ?? team.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}

            {regError ? <Text style={styles.errorText}>{regError}</Text> : null}

            <Button
              title="Confirmar inscripción"
              onPress={handleRegister}
              loading={regLoading}
              disabled={myTeams.length === 0}
              style={styles.button}
            />
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  heroImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: COLORS.border,
  },
  heroFallback: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: COLORS.primary + "12",
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
    color: COLORS.primary,
  },
  card: { marginBottom: SPACING.md, gap: SPACING.sm },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: { fontSize: FONT_SIZE.sm, color: COLORS.text, lineHeight: 22 },
  hint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: "center",
    marginVertical: SPACING.sm,
  },
  teamOption: {
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  teamOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "12",
  },
  teamOptionText: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  teamOptionTextSelected: { fontWeight: "600", color: COLORS.primary },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  button: { marginTop: SPACING.sm },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    gap: SPACING.sm,
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  label: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  value: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "right",
    flexShrink: 1,
  },
});
