// src/shared/components/common/Input.jsx
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme.js";

/**
 * @param {{
 *   label?: string,
 *   error?: string,
 *   style?: object,
 *   inputStyle?: object,
 * } & import('react-native').TextInputProps} props
 */
export default function Input({ label, error, style, inputStyle, ...props }) {
  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, inputStyle]}
        placeholderTextColor={COLORS.textLight}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
