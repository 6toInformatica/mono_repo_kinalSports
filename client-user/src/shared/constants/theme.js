// src/shared/constants/theme.js

export const COLORS = {
  primary: "#08316d",
  primaryLight: "#0d3f86",
  primaryDark: "#051f45",
  soft: "#dbe4f3",
  secondary: "#4b5563",
  background: "#f4f6fa",
  surface: "#ffffff",
  text: "#111827",
  textLight: "#4b5563",
  error: "#b91c1c",
  success: "#16a34a",
  warning: "#f59e0b",
  border: "#e3e8f0",
  borderStrong: "#c9d3e3",
};

/** Encabezados de las pilas, alineados con la barra azul de los paneles. */
export const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: "#ffffff",
  headerTitleStyle: { fontWeight: "700" },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: COLORS.background },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};
