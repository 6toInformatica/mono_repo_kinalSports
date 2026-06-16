// src/shared/components/common/DateTimePickerField.jsx
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme.js";
import {
  formatDateValue,
  formatTimeValue,
  parseDateValue,
  parseTimeValue,
} from "../../utils/reservationFormat.js";

/**
 * @param {{
 *   label?: string,
 *   value?: string,
 *   onChange: (value: string) => void,
 *   mode?: 'date' | 'time',
 *   error?: string,
 *   placeholder?: string,
 *   minimumDate?: Date,
 * }} props
 */
export default function DateTimePickerField({
  label,
  value,
  onChange,
  mode = "date",
  error,
  placeholder,
  minimumDate,
}) {
  const [show, setShow] = useState(false);

  const pickerValue =
    mode === "date" ? parseDateValue(value) : parseTimeValue(value);

  const iconName = mode === "date" ? "calendar-today" : "access-time";

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShow(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    onChange(
      mode === "date"
        ? formatDateValue(selectedDate)
        : formatTimeValue(selectedDate),
    );
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.field, error ? styles.fieldError : null]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <MaterialIcons name={iconName} size={20} color={COLORS.textLight} />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {show && Platform.OS === "ios" ? (
        <View style={styles.iosPicker}>
          <DateTimePicker
            value={pickerValue}
            mode={mode}
            display="spinner"
            minimumDate={mode === "date" ? minimumDate : undefined}
            onChange={handleChange}
            locale="es-GT"
          />
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => setShow(false)}
          >
            <Text style={styles.doneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {show && Platform.OS === "android" ? (
        <DateTimePicker
          value={pickerValue}
          mode={mode}
          display="default"
          minimumDate={mode === "date" ? minimumDate : undefined}
          onChange={handleChange}
          is24Hour
        />
      ) : null}
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
  field: {
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldError: {
    borderColor: COLORS.error,
  },
  value: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    flex: 1,
  },
  placeholder: {
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  iosPicker: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  doneBtn: {
    alignItems: "flex-end",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  doneText: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.primary,
  },
});
