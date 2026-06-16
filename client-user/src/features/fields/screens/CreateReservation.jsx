// src/features/fields/screens/CreateReservation.jsx
import { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import Button from "../../../shared/components/common/Button.jsx";
import DateTimePickerField from "../../../shared/components/common/DateTimePickerField.jsx";
import { Card } from "../../../shared/components/common/Common.jsx";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme.js";
import useReservations from "../../reservations/hooks/useReservations.js";
import { buildReservationDateTime } from "../../../shared/utils/reservationFormat.js";

export default function CreateReservation({ navigation, route }) {
  const { field } = route.params ?? {};
  const { createReservation } = useReservations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const minimumDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { date: "", startTime: "", endTime: "" } });

  const onSubmit = useCallback(
    async (data) => {
      const fieldId = field?._id ?? field?.id;
      if (!fieldId) {
        setError("No se encontró la cancha seleccionada");
        return;
      }

      const startTime = buildReservationDateTime(data.date, data.startTime);
      const endTime = buildReservationDateTime(data.date, data.endTime);

      if (new Date(endTime) <= new Date(startTime)) {
        setError("La hora de fin debe ser posterior a la hora de inicio");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await createReservation({ fieldId, startTime, endTime });
        Alert.alert(
          "¡Reserva creada!",
          "Tu reserva fue registrada exitosamente.",
          [{ text: "Aceptar", onPress: () => navigation.goBack() }],
        );
      } catch (err) {
        const apiMessage = err.response?.data?.message;
        const fieldError = err.response?.data?.errors?.[0]?.message;
        setError(fieldError ?? apiMessage ?? "Error al crear la reserva");
      } finally {
        setLoading(false);
      }
    },
    [createReservation, field, navigation],
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
            {field.price ? (
              <Text style={styles.fieldPrice}>
                Precio: Q {field.price} / hora
              </Text>
            ) : null}
          </Card>
        ) : null}

        {error ? <Text style={styles.globalError}>{error}</Text> : null}

        <Controller
          control={control}
          name="date"
          rules={{ required: "La fecha es requerida" }}
          render={({ field: { onChange, value } }) => (
            <DateTimePickerField
              label="Fecha"
              mode="date"
              value={value}
              onChange={onChange}
              placeholder="Selecciona una fecha"
              minimumDate={minimumDate}
              error={errors.date?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="startTime"
          rules={{ required: "La hora de inicio es requerida" }}
          render={({ field: { onChange, value } }) => (
            <DateTimePickerField
              label="Hora de inicio"
              mode="time"
              value={value}
              onChange={onChange}
              placeholder="Selecciona hora de inicio"
              error={errors.startTime?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="endTime"
          rules={{ required: "La hora de fin es requerida" }}
          render={({ field: { onChange, value } }) => (
            <DateTimePickerField
              label="Hora de fin"
              mode="time"
              value={value}
              onChange={onChange}
              placeholder="Selecciona hora de fin"
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
  fieldPrice: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  globalError: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  button: { marginTop: SPACING.sm },
});
