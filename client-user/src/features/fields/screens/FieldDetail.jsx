// src/features/fields/screens/FieldDetail.jsx
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../../shared/components/common/Button.jsx";
import { Card } from "../../../shared/components/common/Common.jsx";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme.js";

function InfoRow({ label, value }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value ?? "—"}</Text>
    </View>
  );
}

export default function FieldDetail({ navigation, route }) {
  const { field } = route.params ?? {};

  if (!field) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se encontró la cancha.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {field.image ? (
          <Image source={{ uri: field.image }} style={styles.image} />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>Sin imagen</Text>
          </View>
        )}

        <Card style={styles.card}>
          <Text style={styles.name}>{field.name}</Text>
          <Text style={styles.location}>{field.location}</Text>
          <View style={styles.divider} />
          <InfoRow label="Tipo" value={field.fieldType} />
          <InfoRow label="Capacidad" value={field.capacity} />
          <InfoRow
            label="Disponibilidad"
            value={field.isAvailable ? "Disponible" : "No disponible"}
          />
          {field.price ? (
            <InfoRow label="Precio / hora" value={`Q ${field.price}`} />
          ) : null}
          {field.address ? (
            <InfoRow label="Dirección" value={field.address} />
          ) : null}
        </Card>

        <Button
          title="Reservar esta cancha"
          onPress={() => navigation.navigate("CreateReservation", { field })}
          disabled={!field.isAvailable}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  imageFallback: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  imageFallbackText: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  card: { marginBottom: SPACING.md },
  name: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  location: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  errorText: { fontSize: FONT_SIZE.md, color: COLORS.error },
  button: { marginTop: SPACING.sm },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  label: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  value: { fontSize: FONT_SIZE.sm, fontWeight: "500", color: COLORS.text },
});
