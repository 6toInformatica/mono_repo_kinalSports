// src/features/teams/screens/CreateTeam.jsx
import { useState, useCallback } from "react";
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
import { useForm, Controller } from "react-hook-form";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import Input from "../../../shared/components/common/Input.jsx";
import Button from "../../../shared/components/common/Button.jsx";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  SHADOWS,
} from "../../../shared/constants/theme.js";
import useTeams from "../hooks/useTeams.js";

const CATEGORIES = [
  { value: "FUTBOL_7", label: "Fútbol 7" },
  { value: "FUTBOL_11", label: "Fútbol 11" },
];

export default function CreateTeam({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [namedMembers, setNamedMembers] = useState([]);
  const [memberName, setMemberName] = useState("");
  const { createTeam, actionLoading, error } = useTeams();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { teamName: "", category: "" },
  });

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Se necesita acceso a la galería para seleccionar la foto del equipo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const addNamedMember = useCallback(() => {
    const trimmed = memberName.trim();
    if (!trimmed) return;
    setNamedMembers((prev) => [...prev, trimmed]);
    setMemberName("");
  }, [memberName]);

  const removeNamedMember = useCallback((index) => {
    setNamedMembers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = useCallback(
    async (data) => {
      const formData = new FormData();
      formData.append("teamName", data.teamName);
      formData.append("category", data.category);
      if (namedMembers.length > 0) {
        formData.append(
          "namedMembers",
          JSON.stringify(namedMembers.map((name) => ({ name }))),
        );
      }
      if (imageUri) {
        const filename = imageUri.split("/").pop();
        const ext = (filename.split(".").pop() ?? "jpg").toLowerCase();
        formData.append("logo", {
          uri: imageUri,
          name: filename,
          type: `image/${ext}`,
        });
      }
      try {
        await createTeam(formData);
        Alert.alert(
          "¡Equipo creado!",
          "Tu equipo fue registrado exitosamente.",
          [{ text: "Aceptar", onPress: () => navigation.goBack() }],
        );
      } catch (_) {}
    },
    [createTeam, imageUri, namedMembers, navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.photoPicker}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons
                name="add-a-photo"
                size={32}
                color={COLORS.textLight}
              />
              <Text style={styles.photoPlaceholderText}>Logo del equipo</Text>
            </View>
          )}
        </TouchableOpacity>

        {error ? <Text style={styles.globalError}>{error}</Text> : null}

        <Controller
          control={control}
          name="teamName"
          rules={{ required: "El nombre del equipo es requerido" }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Nombre del equipo"
              placeholder="Los Guerreros"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.teamName?.message}
            />
          )}
        />

        <Text style={styles.label}>Categoría</Text>
        <Controller
          control={control}
          name="category"
          rules={{ required: "La categoría es requerida" }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    value === cat.value && styles.categoryChipActive,
                  ]}
                  onPress={() => onChange(cat.value)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      value === cat.value && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        {errors.category ? (
          <Text style={styles.fieldError}>{errors.category.message}</Text>
        ) : null}

        <Text style={styles.label}>Miembros del roster (opcional)</Text>
        <View style={styles.rosterRow}>
          <View style={styles.rosterInput}>
            <Input
              placeholder="Nombre del jugador"
              value={memberName}
              onChangeText={setMemberName}
            />
          </View>
          <TouchableOpacity
            style={styles.addMemberBtn}
            onPress={addNamedMember}
          >
            <MaterialIcons name="person-add" size={22} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
        {namedMembers.map((name, index) => (
          <View key={`${name}-${index}`} style={styles.memberItem}>
            <Text style={styles.memberName}>{name}</Text>
            <TouchableOpacity onPress={() => removeNamedMember(index)}>
              <MaterialIcons name="close" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}

        <Button
          title="Crear equipo"
          onPress={handleSubmit(onSubmit)}
          loading={actionLoading}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md },
  photoPicker: { alignItems: "center", marginBottom: SPACING.lg },
  photoPreview: { width: 120, height: 120, borderRadius: 60 },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  photoPlaceholderText: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  globalError: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  fieldError: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  categoryRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  categoryChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  categoryChipText: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  categoryChipTextActive: { color: COLORS.surface, fontWeight: "600" },
  rosterRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  rosterInput: { flex: 1 },
  addMemberBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  memberName: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  button: { marginTop: SPACING.lg },
});
