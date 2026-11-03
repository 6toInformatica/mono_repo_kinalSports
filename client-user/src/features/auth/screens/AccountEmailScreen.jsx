// src/features/auth/screens/AccountEmailScreen.jsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

const CONTENT = {
  forgot: {
    title: "Recuperar contraseña",
    subtitle:
      "Te enviaremos un enlace para crear una nueva contraseña. Ábrelo desde tu correo para completar el cambio.",
    button: "Enviar enlace",
  },
  verify: {
    title: "Verificar correo",
    subtitle:
      "Te reenviaremos el enlace de verificación. Debes verificar tu correo antes de iniciar sesión.",
    button: "Reenviar verificación",
  },
};

/**
 * Pantalla para solicitar correos de la cuenta.
 * route.params.mode: "forgot" (recuperar contraseña) | "verify" (reenviar verificación)
 */
export default function AccountEmailScreen({ navigation, route }) {
  const mode = route?.params?.mode === "verify" ? "verify" : "forgot";
  const content = CONTENT[mode];
  const { requestAccountEmail, loading, error } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: "" } });

  const onSubmit = async ({ email }) => {
    try {
      const message = await requestAccountEmail(mode, email);
      Alert.alert("Correo enviado", message, [
        { text: "Aceptar", onPress: () => navigation.navigate("Login") },
      ]);
    } catch {
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
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="email"
          rules={{
            required: "El correo es requerido",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Ingresa un correo válido",
            },
          }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Correo electrónico"
              placeholder="ejemplo@correo.com"
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

        <Button
          title={content.button}
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.button}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.linkContainer}
          activeOpacity={0.7}
        >
          <Text style={styles.linkBold}>Volver a iniciar sesión</Text>
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
  linkBold: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
