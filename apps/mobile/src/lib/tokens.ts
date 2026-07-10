// Hita mobile design tokens — Sunset Coral, matching web
export const colors = {
  // Canvas — warm cream
  canvas: "#FFF9F5",
  surface: "#FFF1E9",
  tint: "#FFEDE4",
  hover: "#FFEAE0",
  pressed: "#F9DDD1",

  // Ink — warm plum (text & dark elements)
  ink: "#2B1B2C",
  inkHover: "#1C0F1D",
  inkLight: "rgba(43, 27, 44, 0.06)",
  inkMedium: "rgba(43, 27, 44, 0.12)",

  // Accent — sunset coral
  coral: "#FF5A5F",
  coralHover: "#E8484D",
  coralTint: "#FFECEC",
  coralLight: "rgba(255, 90, 95, 0.10)",
  amber: "#FFB400",
  amberTint: "#FFF4DB",

  // Text
  textPrimary: "#2B1B2C",
  textSecondary: "#7D6A79",
  textTertiary: "#B5A3B0",
  textInverse: "#FFFFFF",

  // Borders — warm
  borderHairline: "#F4E6DD",
  borderSoft: "#EAD6CA",
  borderStrong: "#C9AFA3",

  // Semantic
  success: "#1FA97A",
  warning: "#FFB400",
  danger: "#E0484D",

  // Legacy compat
  accent: "#FF5A5F",
  accentHover: "#E8484D",
  bgCanvas: "#FFF9F5",
  bgTint: "#FFEDE4",
  bgRaised: "#FFFFFF",
  bgMuted: "#FFEAE0",
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
    shadowColor: "#2B1B2C",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  lg: {
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
} as const;
