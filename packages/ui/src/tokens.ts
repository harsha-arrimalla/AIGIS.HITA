/**
 * Design tokens — shared between web and mobile.
 * "Warm Black + Burnt Orange" design language.
 */

export const colors = {
  light: {
    bg: {
      canvas: "#FAF7F2",
      surface: "#FFFFFF",
      hover: "#F0ECE5",
      pressed: "#E5E0D8",
    },
    border: {
      hairline: "#E5E5E5",
      medium: "#D0D0D0",
      strong: "#B0B0B0",
    },
    text: {
      primary: "#1A1A1A",
      body: "#3A3A3A",
      secondary: "#6B6B6B",
      tertiary: "#999999",
      ghost: "#B5B5B5",
    },
    primary: "#2C2C2C",
    accent: "#D4622B",
    accentPressed: "#C0571F",
    success: "#1A7A3A",
    warning: "#D4622B",
    danger: "#C42B2B",
  },
  dark: {
    bg: {
      canvas: "#161615",
      surface: "#1E1E1D",
      hover: "#2A2A28",
      pressed: "#333332",
    },
    border: {
      hairline: "#333332",
      medium: "#444443",
      strong: "#555554",
    },
    text: {
      primary: "#EDEDEB",
      body: "#C8C8C5",
      secondary: "#999999",
      tertiary: "#6B6B6B",
      ghost: "#3A3A3A",
    },
    primary: "#EDEDEB",
    accent: "#E07040",
    accentPressed: "#D4622B",
    success: "#3FB54A",
    warning: "#E07040",
    danger: "#E04040",
  },
} as const;

export const spacing = {
  "4": 4,
  "8": 8,
  "12": 12,
  "16": 16,
  "24": 24,
  "32": 32,
  "48": 48,
  "64": 64,
} as const;

export const cardPadding = { web: 24, mobile: 20 } as const;
export const sectionGap = { web: 48, mobile: 32 } as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  card: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
  elevated: "0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.05)",
} as const;

export const fonts = {
  display: "Newsreader",
  body: "Inter",
  mono: "JetBrains Mono",
} as const;

export const motion = {
  duration: {
    default: 200,
    fast: 100,
    sheet: 300,
    save: 600,
  },
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  streamingStagger: 60,
} as const;
