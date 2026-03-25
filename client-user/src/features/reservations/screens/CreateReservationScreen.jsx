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
import { COLORS, SPACING, FONT_SIZE } from "../../constants/theme";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { Card } from "../../components/common/Common";
import { useReservations } from "../../hooks/useReservations";

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
      const reservationData = {
        fieldId: field._id,
        date: data.date,
        time: data.time,
        duration: parseInt(data.duration),
        totalPrice: field.pricePerHour * parseInt(data.duration),
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
          <Text style={styles.fieldName}>{field.name}</Text>
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
