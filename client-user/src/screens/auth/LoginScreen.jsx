import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import kinalLogo from "../../../assets/kinal_sports.png";
import { useForm, Controller } from "react-hook-form";
import { COLORS, SPACING, FONT_SIZE } from "../../constants/theme";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import authClient from "../../api/authClient";
import { useAuthStore } from "../../store/authStore";

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await authClient.post("/login", data);
      const { token, user } = response.data;

      login(token, user);
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message || "Error al iniciar sesión";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image source={kinalLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.subtitle}>Bienvenido de nuevo</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            rules={{ required: "Email o usuario requerido" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email o Usuario"
                placeholder="correo@ejemplo.com o usuario"
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                error={errors.emailOrUsername?.message}
              />
            )}
            name="emailOrUsername"
          />

          <Controller
            control={control}
            rules={{ required: "Contraseña requerida" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Contraseña"
                placeholder="••••••••"
                secureTextEntry
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
            name="password"
          />

          <Button
            title="Iniciar Sesión"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <Text
              style={styles.link}
              onPress={() => navigation.navigate("Register")}
            >
              Regístrate
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  logo: {
    height: 80,
    width: 200,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.secondary,
    marginTop: SPACING.sm,
  },
  form: {
    width: "100%",
  },
  button: {
    marginTop: SPACING.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
  },
  link: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: "700",
  },
});

export default LoginScreen;
