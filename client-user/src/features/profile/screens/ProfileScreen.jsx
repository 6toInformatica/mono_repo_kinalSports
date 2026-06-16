// src/features/profile/screens/ProfileScreen.jsx
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import userClient from "../../../shared/api/userClient.js";
import useAuthStore from "../../../shared/store/authStore.js";
import {
  Card,
  LoadingSpinner,
} from "../../../shared/components/common/Common.jsx";
import Input from "../../../shared/components/common/Input.jsx";
import Button from "../../../shared/components/common/Button.jsx";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme.js";
import {
  mapProfileToForm,
  getProfileDisplayName,
  getProfileEmail,
  resolveProfileAvatarUri,
} from "../../../shared/utils/profileFormat.js";

const DEFAULT_AVATAR = require("../../../../assets/avatarDefault-1749508519496.png");

export default function ProfileScreen() {
  const storedUser = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: mapProfileToForm(storedUser ?? {}),
  });

  const getAvatarSource = useCallback(
    (avatarUri) => {
      if (avatarUri && !avatarFailed) {
        return { uri: avatarUri };
      }
      return DEFAULT_AVATAR;
    },
    [avatarFailed],
  );

  const uploadAvatarImage = useCallback(
    async (uri) => {
      setUploadingAvatar(true);
      setError(null);
      setAvatarFailed(false);
      setLocalAvatarUri(uri);

      try {
        const filename = uri.split("/").pop() ?? "avatar.jpg";
        const ext = (filename.split(".").pop() ?? "jpg").toLowerCase();
        const formData = new FormData();
        formData.append("avatar", {
          uri,
          name: filename,
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });

        const response = await userClient.post(
          "/users/profile/avatar",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        const updated = response.data.data ?? response.data;

        setProfile(updated);
        updateUser(updated);
        setAvatarFailed(false);
        setLocalAvatarUri(null);
        Alert.alert(
          "Foto actualizada",
          "Tu foto de perfil se guardó correctamente.",
        );
      } catch (err) {
        setLocalAvatarUri(null);
        setError(
          err.response?.data?.message ?? "No se pudo actualizar la foto",
        );
      } finally {
        setUploadingAvatar(false);
      }
    },
    [updateUser],
  );

  const pickAvatar = useCallback(async () => {
    if (uploadingAvatar) return;

    Alert.alert("Foto de perfil", "Elige una opción", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Galería",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permiso requerido",
              "Se necesita acceso a la galería para cambiar tu foto.",
            );
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });

          if (!result.canceled) {
            await uploadAvatarImage(result.assets[0].uri);
          }
        },
      },
      {
        text: "Cámara",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permiso requerido",
              "Se necesita acceso a la cámara para tomar tu foto.",
            );
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });

          if (!result.canceled) {
            await uploadAvatarImage(result.assets[0].uri);
          }
        },
      },
    ]);
  }, [uploadAvatarImage, uploadingAvatar]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userClient.get("/users/profile");
      const data = response.data.data ?? response.data;
      setProfile(data);
      reset(mapProfileToForm(data));
      updateUser(data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar el perfil");
      const fallbackUser = useAuthStore.getState().user;
      if (fallbackUser) {
        reset(mapProfileToForm(fallbackUser));
      }
    } finally {
      setLoading(false);
    }
  }, [reset, updateUser]);

  const onSubmit = useCallback(
    async (values) => {
      setLoading(true);
      setError(null);
      try {
        const payload = {
          displayName: values.displayName,
          phone: values.phone,
          favoriteSports: values.favoriteSports
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        };

        const response = await userClient.put("/users/profile", payload);
        const updated = response.data.data ?? response.data;

        setProfile(updated);
        updateUser(updated);
        reset(mapProfileToForm(updated));
        setIsEditing(false);
        Alert.alert(
          "Perfil actualizado",
          "Tus datos se guardaron correctamente.",
        );
      } catch (err) {
        setError(
          err.response?.data?.message ?? "No se pudo actualizar el perfil",
        );
      } finally {
        setLoading(false);
      }
    },
    [reset, updateUser],
  );

  const confirmLogout = useCallback(() => {
    Alert.alert("Cerrar sesión", "¿Deseas cerrar tu sesión en KinalSports?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }, [logout]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const mergedProfile = { ...(storedUser ?? {}), ...(profile ?? {}) };
  const displayName = getProfileDisplayName(profile ?? {}, storedUser ?? {});
  const email = getProfileEmail(profile ?? {}, storedUser ?? {});
  const avatarUri =
    localAvatarUri || resolveProfileAvatarUri(profile ?? {}, storedUser ?? {});

  useEffect(() => {
    if (!localAvatarUri) {
      setAvatarFailed(false);
    }
  }, [avatarUri, localAvatarUri]);

  if (loading && !profile && !storedUser) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.avatarCard}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={pickAvatar}
            activeOpacity={0.85}
            disabled={uploadingAvatar}
          >
            <Image
              source={getAvatarSource(avatarUri)}
              style={styles.avatar}
              resizeMode="cover"
              onError={() => setAvatarFailed(true)}
            />
            <View style={styles.avatarBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <MaterialIcons
                  name="photo-camera"
                  size={16}
                  color={COLORS.surface}
                />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          {mergedProfile.username ? (
            <Text style={styles.username}>@{mergedProfile.username}</Text>
          ) : null}
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Card style={styles.formCard}>
          <Controller
            control={control}
            name="displayName"
            rules={{ required: "El nombre para mostrar es requerido" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nombre para mostrar"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.displayName?.message}
                editable={isEditing}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Teléfono"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
                error={errors.phone?.message}
                editable={isEditing}
              />
            )}
          />

          <Controller
            control={control}
            name="favoriteSports"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Deportes favoritos"
                placeholder="Fútbol, Baloncesto"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.favoriteSports?.message}
                editable={isEditing}
              />
            )}
          />

          {isEditing ? (
            <View style={styles.actionsRow}>
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={() => {
                  reset(mapProfileToForm(mergedProfile));
                  setIsEditing(false);
                  setError(null);
                }}
                style={styles.flexButton}
              />
              <Button
                title="Guardar"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={styles.flexButton}
              />
            </View>
          ) : (
            <Button
              title="Editar perfil"
              onPress={() => setIsEditing(true)}
              style={styles.fullButton}
            />
          )}
        </Card>

        <Button
          title="Cerrar sesión"
          variant="secondary"
          onPress={confirmLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  avatarCard: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  avatarButton: {
    position: "relative",
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.border,
  },
  avatarBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  email: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  username: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondary,
  },
  formCard: {
    paddingTop: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  flexButton: {
    flex: 1,
  },
  fullButton: {
    marginTop: SPACING.sm,
  },
  logoutButton: {
    marginBottom: SPACING.md,
  },
});
