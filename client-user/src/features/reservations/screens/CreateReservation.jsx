// src/features/reservations/screens/CreateReservation.jsx
import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import Input from "../../../shared/components/common/Input.jsx";
import Button from "../../../shared/components/common/Button.jsx";
import { Card } from "../../../shared/components/common/Common.jsx";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme.js";
import userClient from "../../../shared/api/userClient.js";

export default function CreateReservation({ navigation, route }) {
  const { field } = route.params ?? {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { date: "", startTime: "", endTime: "" } });

  const onSubmit = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        await userClient.post("/reservations", {
          fieldId: field?._id ?? field?.id,
          startTime: buildLocalDateTime(data.date, data.startTime),
          endTime: buildLocalDateTime(data.date, data.endTime),
        });
        Alert.alert(
          "¡Reserva creada!",
          "Tu reserva fue registrada exitosamente.",
          [{ text: "Aceptar", onPress: () => navigation.goBack() }],
        );
      } catch (err) {
        setError(err.response?.data?.message ?? "Error al crear la reserva");
      } finally {
        setLoading(false);
      }
    },
    [field, navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {field ? (
          <Card style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Cancha seleccionada</Text>
            <Text style={styles.fieldName}>{field.name}</Text>
            <Text style={styles.fieldLocation}>{field.location}</Text>
          </Card>
        ) : (
          <Card style={styles.fieldCard}>
            <Text style={styles.hint}>
              Para reservar una cancha específica, selecciónala desde la pestaña
              Canchas.
            </Text>
          </Card>
        )}

        {error ? <Text style={styles.globalError}>{error}</Text> : null}

        <Controller
          control={control}
          name="date"
          rules={{ required: "La fecha es requerida" }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Fecha (YYYY-MM-DD)"
              placeholder="2026-06-15"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.date?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="startTime"
          rules={{ required: "La hora de inicio es requerida" }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Hora de inicio (HH:MM)"
              placeholder="08:00"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.startTime?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="endTime"
          rules={{ required: "La hora de fin es requerida" }}
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Hora de fin (HH:MM)"
              placeholder="10:00"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.endTime?.message}
            />
          )}
        />

        <Button
          title="Confirmar reserva"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const buildLocalDateTime = (date, time) => `${date}T${time}:00`;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md },
  fieldCard: { marginBottom: SPACING.lg },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  fieldName: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text },
  fieldLocation: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.secondary,
    marginTop: 2,
  },
  hint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: "center",
  },
  globalError: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  button: { marginTop: SPACING.sm },
});
