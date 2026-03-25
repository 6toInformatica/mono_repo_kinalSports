import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTeams } from "../../hooks/useTeams";
import { COLORS, SPACING, FONT_SIZE } from "../../constants/theme";
import { LoadingSpinner } from "../../components/common/Common";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";

const CreateTeamScreen = ({ navigation }) => {
  const { createTeam } = useTeams();
  const [loading, setLoading] = useState(false);
  const [logoUri, setLogoUri] = useState(null);
  const [formData, setFormData] = useState({
    teamName: "",
    category: "FUTBOL_7",
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tu galería para seleccionar un logo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!formData.teamName.trim()) {
      Alert.alert("Error", "El nombre del equipo es requerido");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("teamName", formData.teamName);
      form.append("category", formData.category);

      if (logoUri) {
        const filename = logoUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        form.append("logo", { uri: logoUri, name: filename, type });
      }

      await createTeam(form);
      Alert.alert("Éxito", "Equipo creado correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "No se pudo crear el equipo",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nuevo Equipo</Text>
      <Text style={styles.subtitle}>
        Crea tu equipo y conviértete en el Manager
      </Text>

      <View style={styles.formContainer}>
        {/* Logo picker */}
        <Text style={styles.label}>Logo del equipo</Text>
        <TouchableOpacity style={styles.logoPicker} onPress={pickImage}>
          {logoUri ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.logoPreview}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderIcon}>🏟️</Text>
              <Text style={styles.logoPlaceholderText}>
                Toca para seleccionar imagen
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {logoUri && (
          <TouchableOpacity
            onPress={() => setLogoUri(null)}
            style={styles.removeBtn}
          >
            <Text style={styles.removeBtnText}>✕ Quitar imagen</Text>
          </TouchableOpacity>
        )}

        <Input
          label="Nombre del equipo"
          value={formData.teamName}
          onChangeText={(text) => setFormData({ ...formData, teamName: text })}
          placeholder="Ej: SJT FC"
        />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.categoryContainer}>
          <TouchableOpacity
            style={[
              styles.categoryBtn,
              formData.category === "FUTBOL_7" && styles.categoryBtnActive,
            ]}
            onPress={() => setFormData({ ...formData, category: "FUTBOL_7" })}
          >
            <Text
              style={[
                styles.categoryText,
                formData.category === "FUTBOL_7" && styles.categoryTextActive,
              ]}
            >
              Fútbol 7
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryBtn,
              formData.category === "FUTBOL_11" && styles.categoryBtnActive,
            ]}
            onPress={() => setFormData({ ...formData, category: "FUTBOL_11" })}
          >
            <Text
              style={[
                styles.categoryText,
                formData.category === "FUTBOL_11" && styles.categoryTextActive,
              ]}
            >
              Fútbol 11
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title={loading ? "Creando..." : "Crear Equipo"}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitBtn}
        />
      </View>
      {loading && <LoadingSpinner />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.secondary,
    marginBottom: SPACING.xl,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  logoPicker: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 12,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xs,
    overflow: "hidden",
    backgroundColor: COLORS.background,
  },
  logoPreview: {
    width: "100%",
    height: "100%",
  },
  logoPlaceholder: {
    alignItems: "center",
    gap: SPACING.xs,
  },
  logoPlaceholderIcon: {
    fontSize: 36,
  },
  logoPlaceholderText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.secondary,
  },
  removeBtn: {
    alignSelf: "flex-end",
    marginBottom: SPACING.sm,
  },
  removeBtnText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error || "#ef4444",
    fontWeight: "600",
  },
  categoryContainer: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    marginTop: SPACING.xs,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: "center",
  },
  categoryBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "15",
  },
  categoryText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.secondary,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
});

export default CreateTeamScreen;
