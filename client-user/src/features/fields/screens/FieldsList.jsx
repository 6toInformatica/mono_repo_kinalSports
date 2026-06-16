// src/features/fields/screens/FieldsList.jsx
import {
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  LoadingSpinner,
  EmptyState,
} from "../../../shared/components/common/Common.jsx";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme.js";
import useFields from "../hooks/useFields.js";

export default function FieldsList({ navigation }) {
  const { fields, loading, error, refetch } = useFields();

  if (loading && fields.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <FlatList
        data={fields}
        keyExtractor={(item) => String(item._id ?? item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          error ? (
            <EmptyState
              icon="error-outline"
              title="Error al cargar"
              message={error}
            />
          ) : (
            <EmptyState
              icon="sports-soccer"
              title="Sin canchas disponibles"
              message="No hay canchas registradas aún."
            />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("FieldDetail", { field: item })}
          >
            <Card style={styles.card}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <View style={styles.imageFallback}>
                  <Text style={styles.imageFallbackText}>Sin foto</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.location} numberOfLines={1}>
                  {item.location}
                </Text>
                <View
                  style={[
                    styles.badge,
                    item.isAvailable
                      ? styles.badgeActive
                      : styles.badgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      item.isAvailable
                        ? styles.badgeTextActive
                        : styles.badgeTextInactive,
                    ]}
                  >
                    {item.isAvailable ? "Disponible" : "No disponible"}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, gap: SPACING.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.sm,
  },
  image: { width: 80, height: 80, borderRadius: 8 },
  imageFallback: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  imageFallbackText: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  info: { flex: 1 },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  location: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeActive: { backgroundColor: COLORS.success + "22" },
  badgeInactive: { backgroundColor: COLORS.error + "22" },
  badgeText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
  badgeTextActive: { color: COLORS.success },
  badgeTextInactive: { color: COLORS.error },
});
