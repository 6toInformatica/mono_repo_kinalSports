import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import Input from "../../../shared/components/common/Input.jsx";
import Button from "../../../shared/components/common/Button.jsx";

const avatarDefault = require("../../../../assets/avatarDefault-1749508519496.png");
import { Card } from "../../../shared/components/common/Common.jsx";
import { useAuthStore } from "../../../shared/store/authStore.js";
import userClient from "../../../shared/api/userClient.js";

const ProfileScreen = () => {
  const { user, logout, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      surname: user?.surname || "",
      email: user?.email || "",
      username: user?.username || "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await userClient.put(`/users/${user._id}`, data);

      updateUser(response.data.data || response.data);
      setIsEditing(false);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Error al actualizar perfil",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Aceptar", onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={
            user?.profilePicture?.startsWith("http")
              ? { uri: user.profilePicture }
              : avatarDefault
          }
          style={styles.avatarImage}
        />
        <Text style={styles.userName}>
          {user?.name} {user?.surname}
        </Text>
        <Text style={styles.userHandle}>@{user?.username}</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editBtn}>
                {isEditing ? "Cancelar" : "Editar"}
              </Text>
            </TouchableOpacity>
          </View>

          <Controller
            control={control}
            rules={{ required: "Nombre requerido" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nombre"
                onChangeText={onChange}
                value={value}
                editable={isEditing}
                error={errors.name?.message}
                style={!isEditing && styles.readOnly}
              />
            )}
            name="name"
          />

          <Controller
            control={control}
            rules={{ required: "Apellido requerido" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Apellido"
                onChangeText={onChange}
                value={value}
                editable={isEditing}
                error={errors.surname?.message}
                style={!isEditing && styles.readOnly}
              />
            )}
            name="surname"
          />

          <Controller
            control={control}
            rules={{ required: "Email requerido" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                onChangeText={onChange}
                value={value}
                editable={isEditing}
                error={errors.email?.message}
                style={!isEditing && styles.readOnly}
                keyboardType="email-address"
              />
            )}
            name="email"
          />

          {isEditing && (
            <Button
              title="Guardar Cambios"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={{ marginTop: SPACING.md }}
            />
          )}
        </Card>

        <View style={styles.actions}>
          <Button
            title="Cerrar Sesión"
            variant="secondary"
            onPress={handleLogout}
          />
        </View>
        <Text style={styles.version}>Kinal Sports v1.0.0</Text>
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
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  userHandle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.secondary,
  },
  content: {
    padding: SPACING.lg,
  },
  profileCard: {
    marginBottom: SPACING.xl,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  editBtn: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: "700",
  },
  readOnly: {
    backgroundColor: "#f1f5f9",
    color: COLORS.secondary,
  },
  actions: {
    marginTop: SPACING.sm,
  },
  version: {
    textAlign: "center",
    marginTop: SPACING.xxl,
    color: COLORS.textLight,
    paddingBottom: SPACING.xl,
    fontSize: FONT_SIZE.xs,
  },
});

export default ProfileScreen;
