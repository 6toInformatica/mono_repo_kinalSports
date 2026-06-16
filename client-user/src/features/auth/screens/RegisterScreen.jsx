// src/features/auth/screens/RegisterScreen.jsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }) {
  const { handleRegister, loading, error } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      surname: "",
      username: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await handleRegister(data);
      Alert.alert(
        "Registro exitoso",
        "Tu cuenta ha sido creada. Ya puedes iniciar sesión.",
        [{ text: "Aceptar", onPress: () => navigation.navigate("Login") }],
      );
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
        {/* Encabezado */}
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Únete a KinalSports</Text>

        {/* Error global */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        {/* Nombre */}
        <Controller
          control={control}
          name="name"
          rules={{ required: "El nombre es requerido" }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Nombre"
              placeholder="María"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              error={errors.name?.message}
            />
          )}
        />

        {/* Apellido */}
        <Controller
          control={control}
          name="surname"
          rules={{ required: "El apellido es requerido" }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Apellido"
              placeholder="García"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              error={errors.surname?.message}
            />
          )}
        />

        {/* Usuario */}
        <Controller
          control={control}
          name="username"
          rules={{
            required: "El nombre de usuario es requerido",
            minLength: { value: 3, message: "Mínimo 3 caracteres" },
          }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Nombre de usuario"
              placeholder="maria_garcia"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              error={errors.username?.message}
            />
          )}
        />

        {/* Correo */}
        <Controller
          control={control}
          name="email"
          rules={{
            required: "El correo electrónico es requerido",
            pattern: { value: EMAIL_REGEX, message: "Correo inválido" },
          }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Correo electrónico"
              placeholder="maria@correo.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email?.message}
            />
          )}
        />

        {/* Contraseña */}
        <Controller
          control={control}
          name="password"
          rules={{
            required: "La contraseña es requerida",
            minLength: { value: 8, message: "Mínimo 8 caracteres" },
          }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete="new-password"
              error={errors.password?.message}
            />
          )}
        />

        {/* Teléfono */}
        <Controller
          control={control}
          name="phone"
          rules={{ required: "El teléfono es requerido" }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Teléfono"
              placeholder="5512345678"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              autoComplete="tel"
              error={errors.phone?.message}
            />
          )}
        />

        {/* Botón principal */}
        <Button
          title="Registrarme"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.button}
        />

        {/* Enlace a login */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.linkContainer}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>
            ¿Ya tienes cuenta?{" "}
            <Text style={styles.linkBold}>Inicia sesión</Text>
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
    paddingTop: SPACING.xl,
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
    marginBottom: SPACING.xl,
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
