// src/shared/components/common/Button.jsx
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../constants/theme.js";

/**
 * @param {{
 *   title: string,
 *   onPress: () => void,
 *   variant?: 'primary' | 'secondary',
 *   loading?: boolean,
 *   disabled?: boolean,
 *   style?: object,
 *   textStyle?: object,
 * }} props
 */
export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? COLORS.surface : COLORS.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.textPrimary : styles.textSecondary,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.sm,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  textPrimary: {
    color: COLORS.surface,
  },
  textSecondary: {
    color: COLORS.primary,
  },
});
