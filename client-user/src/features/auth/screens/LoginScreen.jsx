// src/features/auth/screens/LoginScreen.jsx
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import Input from "../../../shared/components/common/Input.jsx";
import Button from "../../../shared/components/common/Button.jsx";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  SHADOWS,
} from "../../../shared/constants/theme.js";
import useAuth from "../hooks/useAuth.js";

export default function LoginScreen({ navigation }) {
  const { handleLogin, loading, error } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { emailOrUsername: "", password: "" },
  });

  const onSubmit = async (data) => {
    try {
      await handleLogin(data);
    } catch (_) {
      // error ya gestionado en el hook, se muestra en pantalla
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../../assets/kinal_sports.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Encabezado */}
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Bienvenido a KinalSports</Text>

        {/* Error global */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        {/* Correo o usuario */}
        <Controller
          control={control}
          name="emailOrUsername"
          rules={{ required: "El correo o usuario es requerido" }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Correo electrónico o usuario"
              placeholder="ejemplo@correo.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.emailOrUsername?.message}
            />
          )}
        />

        {/* Contraseña */}
        <Controller
          control={control}
          name="password"
          rules={{ required: "La contraseña es requerida" }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete="current-password"
              error={errors.password?.message}
            />
          )}
        />

        {/* Botón principal */}
        <Button
          title="Ingresar"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.button}
        />

        {/* Enlace a registro */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          style={styles.linkContainer}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>
            ¿No tienes cuenta?{" "}
            <Text style={styles.linkBold}>Regístrate aquí</Text>
          </Text>
        </TouchableOpacity>
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
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  errorBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  errorBoxText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    textAlign: "center",
  },
  button: {
    marginTop: SPACING.sm,
  },
  linkContainer: {
    marginTop: SPACING.lg,
    alignItems: "center",
  },
  linkText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  linkBold: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
