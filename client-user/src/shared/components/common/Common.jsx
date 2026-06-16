// src/shared/components/common/Common.jsx
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../constants/theme.js";

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

/**
 * @param {{ size?: 'small' | 'large', color?: string, style?: object }} props
 */
export function LoadingSpinner({
  size = "large",
  color = COLORS.primary,
  style,
}) {
  return (
    <View style={[styles.center, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

/**
 * @param {{
 *   icon?: string,
 *   title?: string,
 *   message?: string,
 *   style?: object,
 * }} props
 */
export function EmptyState({
  icon = "inbox",
  title = "Sin resultados",
  message,
  style,
}) {
  return (
    <View style={[styles.center, style]}>
      <MaterialIcons name={icon} size={56} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

/**
 * @param {{ children: import('react').ReactNode, style?: object }} props
 */
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
});
