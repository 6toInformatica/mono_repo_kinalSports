// src/shared/components/common/Input.jsx
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../../constants/theme.js";

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
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.label,
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.text,
  },
  inputError: {
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.error,
    marginTop: 6,
  },
});
