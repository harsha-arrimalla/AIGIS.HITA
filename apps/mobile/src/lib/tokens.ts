// Hita mobile design tokens — B&W monochrome matching web
export const colors = {
  // Canvas
  canvas: "#FFFFFF",
  surface: "#FAFAFA",
  tint: "#F7F7F7",
  hover: "#F5F5F5",
  pressed: "#EBEBEB",

  // Accent — black monochrome
  ink: "#222222",
  inkHover: "#000000",
  inkLight: "rgba(34, 34, 34, 0.06)",
  inkMedium: "rgba(34, 34, 34, 0.12)",

  // Text
  textPrimary: "#222222",
  textSecondary: "#717171",
  textTertiary: "#B0B0B0",
  textInverse: "#FFFFFF",

  // Borders
  borderHairline: "#EBEBEB",
  borderSoft: "#DDDDDD",
  borderStrong: "#B0B0B0",

  // Semantic
  success: "#222222",
  warning: "#C13515",
  danger: "#C13515",

  // Legacy compat
  accent: "#222222",
  accentHover: "#000000",
  bgCanvas: "#FFFFFF",
  bgTint: "#F7F7F7",
  bgRaised: "#FFFFFF",
  bgMuted: "#F5F5F5",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  full: 9999,
} as const;

export const fonts = {
  display: "SpaceGrotesk_700Bold",
  body: "DMSans_500Medium",
  bodyRegular: "DMSans_400Regular",
  mono: "JetBrainsMono_500Medium",
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;
