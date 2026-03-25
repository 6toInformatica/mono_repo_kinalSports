import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { COLORS, SPACING, FONT_SIZE } from "../../constants/theme";
import Button from "../../components/common/Button";
import { Card, LoadingSpinner } from "../../components/common/Common";
import { useTournaments } from "../../hooks/useTournaments";
import { useTeams } from "../../hooks/useTeams";

const TournamentDetailScreen = ({ route }) => {
  const { tournament } = route.params;
  const { registerTeam, loading: tourneyLoading } = useTournaments();
  const { myTeams, getMyTeams, loading: teamsLoading } = useTeams();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    getMyTeams();
  }, [getMyTeams]);

  const handleRegister = async (teamId) => {
    try {
      await registerTeam(tournament._id, teamId);
      Alert.alert("Éxito", "Tu equipo ha sido inscrito en el torneo");
      setModalVisible(false);
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "No se pudo inscribir al equipo",
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{tournament.name}</Text>
        <Text style={styles.subtext}>
          {tournament.category || "Masc. Libre"}
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Sobre el torneo</Text>
          <Text style={styles.description}>
            {tournament.description || "Disfruta de la mejor competencia."}
          </Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Detalles del Evento</Text>
          <Text style={styles.row}>
            Inicio:{" "}
            {tournament.startDate
              ? new Date(tournament.startDate).toLocaleDateString()
              : "Pendiente"}
          </Text>
          <Text style={styles.row}>
            Fin:{" "}
            {tournament.endDate
              ? new Date(tournament.endDate).toLocaleDateString()
              : "Pendiente"}
          </Text>
          <Text style={styles.row}>
            Nivel: {tournament.maxTeams || 16} equipos máx.
          </Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Equipos Inscritos ({tournament.teams?.length || 0})
          </Text>
          {tournament.teams?.map((teamId, idx) => (
            <Text key={idx} style={styles.teamItem}>
              • {teamId}
            </Text>
          ))}
        </Card>

        <View style={styles.footer}>
          <Button
            title="Inscribir mi Equipo"
            onPress={() => setModalVisible(true)}
            loading={tourneyLoading}
          />
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecciona un Equipo</Text>

              {teamsLoading ? (
                <LoadingSpinner />
              ) : (
                <ScrollView style={styles.teamsList}>
                  {myTeams.length > 0 ? (
                    myTeams.map((team) => (
                      <TouchableOpacity
                        key={team._id}
                        style={styles.teamOption}
                        onPress={() => handleRegister(team._id)}
                      >
                        <Text style={styles.teamNameText}>{team.name}</Text>
                        <Text style={styles.teamSportText}>{team.sport}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noTeamsText}>
                      No eres capitán de ningún equipo aún.
                    </Text>
                  )}
                </ScrollView>
              )}

              <Button
                title="Cerrar"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ marginTop: SPACING.md }}
              />
            </View>
          </View>
        </Modal>
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
    backgroundColor: "#d97706",
    alignItems: "center",
  },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    color: COLORS.surface,
  },
  subtext: {
    fontSize: FONT_SIZE.md,
    color: "#fef3c7",
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
  row: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginBottom: 4,
  },
  teamItem: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  footer: {
    marginTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.xl,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  teamsList: {
    marginBottom: SPACING.md,
  },
  teamOption: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  teamNameText: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  teamSportText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondary,
  },
  noTeamsText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.secondary,
    textAlign: "center",
    paddingVertical: SPACING.xl,
  },
});

export default TournamentDetailScreen;
