import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import Input from "../../../shared/components/common/Input.jsx";
import Button from "../../../shared/components/common/Button.jsx";
import { Card } from "../../../shared/components/common/Common.jsx";
import { useReservations } from "../hooks/useReservations.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

const CreateReservationScreen = ({ route, navigation }) => {
  const { field } = route.params;
  const { createReservation, loading } = useReservations();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      time: "18:00",
      duration: "1",
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!DATE_REGEX.test(data.date) || !TIME_REGEX.test(data.time)) {
        Alert.alert(
          "Formato inválido",
          "Ingresa fecha YYYY-MM-DD y hora HH:MM válidas.",
        );
        return;
      }

      const durationHours = parseInt(data.duration, 10);
      if (Number.isNaN(durationHours) || durationHours <= 0) {
        Alert.alert("Duración inválida", "La duración debe ser mayor a 0.");
        return;
      }

      const start = new Date(`${data.date}T${data.time}:00`);
      if (Number.isNaN(start.getTime())) {
        Alert.alert("Fecha inválida", "No se pudo interpretar fecha y hora.");
        return;
      }

      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

      const reservationData = {
        fieldId: field._id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };

      await createReservation(reservationData);
      Alert.alert(
        "Reserva Exitosa",
        "Tu reserva ha sido registrada correctamente.",
        [
          {
            text: "Ver mis reservas",
            onPress: () => navigation.navigate("Reservations"),
          },
        ],
      );
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Error al crear la reserva",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.fieldCard}>
          <Text style={styles.fieldName}>{field.name || field.fieldName}</Text>
          <Text style={styles.fieldPrice}>Q{field.pricePerHour} / hora</Text>
        </Card>

        <View style={styles.form}>
          <Controller
            control={control}
            rules={{ required: "Fecha requerida (AAAA-MM-DD)" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Fecha (YYYY-MM-DD)"
                placeholder="2024-12-31"
                onChangeText={onChange}
                value={value}
                error={errors.date?.message}
              />
            )}
            name="date"
          />

          <Controller
            control={control}
            rules={{ required: "Hora requerida" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Hora (HH:MM)"
                placeholder="18:00"
                onChangeText={onChange}
                value={value}
                error={errors.time?.message}
              />
            )}
            name="time"
          />

          <Controller
            control={control}
            rules={{ required: "Duración requerida" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Duración (Horas)"
                placeholder="1"
                keyboardType="numeric"
                onChangeText={onChange}
                value={value}
                error={errors.duration?.message}
              />
            )}
            name="duration"
          />

          <View style={styles.footer}>
            <Button
              title="Confirmar Reserva"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
            />
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
    padding: SPACING.lg,
  },
  fieldCard: {
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
  },
  fieldName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
    color: COLORS.surface,
  },
  fieldPrice: {
    fontSize: FONT_SIZE.md,
    color: "#dbeafe",
    marginTop: 4,
    fontWeight: "600",
  },
  form: {
    width: "100%",
  },
  footer: {
    marginTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
});

export default CreateReservationScreen;
