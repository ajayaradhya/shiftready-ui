// Single source of truth for raw color/font values needed outside NativeWind
// classes (ActivityIndicator, navigators, gradients, icon colors).
// Mirrors tailwind.config.ts — change both together.

export const colors = {
  primary: "#B5604A",
  onPrimary: "#FFFFFF",
  tertiary: "#557239",
  surface: "#FAFAF7",
  surfaceLowest: "#FFFFFF",
  surfaceLow: "#FBF8F3",
  surfaceContainer: "#F5F0E8",
  surfaceHigh: "#EDE5D6",
  surfaceHighest: "#E0D5C0",
  onSurface: "#1F1B17",
  onSurfaceVariant: "#4F4838",
  outline: "#A09683",
  outlineVariant: "#E0D5C0",
  error: "#B14F3B",

  clay50: "#FBF1EC",
  clay100: "#F5DDCF",
  clay200: "#ECC2AB",
  clay600: "#B5604A",
  clay700: "#944A39",
  clay900: "#4A2519",

  ink300: "#A09683",
  ink400: "#756B5A",
  ink500: "#4F4838",
  ink800: "#1F1B17",

  // Semantic states tuned to the cream/clay world
  success: "#557239",
  successContainer: "#E4ECD8",
  onSuccessContainer: "#33491F",
  warning: "#A0653B",
  warningContainer: "#F5E3CF",
  onWarningContainer: "#5C3A1E",
  info: "#4A6172",
  infoContainer: "#DEE7ED",
  onInfoContainer: "#2A3A46",
  errorContainer: "#F5D6CE",
  onErrorContainer: "#6E2618",
} as const;

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 } as const;
