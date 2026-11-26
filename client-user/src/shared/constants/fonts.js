/** Misma pareja que los paneles: Inter para texto y Space Grotesk para títulos. */
export const FONTS = {
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  display: "SpaceGrotesk_600SemiBold",
  displayBold: "SpaceGrotesk_700Bold",
};

/**
 * Elige el archivo de la fuente según tamaño y peso.
 * En Android el peso no se sintetiza: cada peso es un archivo.
 * Los títulos (17 px o más, en seminegrita) usan Space Grotesk.
 */
export const pickFontFamily = (style = {}) => {
  if (style.fontFamily) return style.fontFamily;
  const size = Number(style.fontSize) || 0;
  const weight = String(style.fontWeight || "400");
  const strong =
    weight === "600" ||
    weight === "700" ||
    weight === "bold" ||
    weight === "semibold";
  if (size >= 17 && strong) {
    return weight === "600" || weight === "semibold"
      ? FONTS.display
      : FONTS.displayBold;
  }
  if (weight === "700" || weight === "bold") return FONTS.bodyBold;
  if (weight === "600" || weight === "semibold") return FONTS.bodySemibold;
  if (weight === "500" || weight === "medium") return FONTS.bodyMedium;
  return FONTS.body;
};
