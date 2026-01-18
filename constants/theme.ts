import { Platform } from "react-native";

export type ThemeMode = 'light' | 'dark';

// $200K Ultra-Premium Design System - Gender-Neutral Luxury Excellence
// Inspired by: Apple Pro, Porsche Design, Bang & Olufsen, Aesop, Arc'teryx
const lightPalette = {
  // Brandbook (Primary combo) — clean white canvas
  background: "#FFFFFF", // Brand white
  backgroundStart: "#FFFFFF", // Pure white
  backgroundEnd: "#FAFBFC", // Subtle premium light gray
  surface: "#FFFFFF", // Cards / sheets
  surfaceAlt: "#FAFBFC", // Premium luxury background
  surfaceElevated: "#FFFFFF", // Elevated surface
  surfaceGlass: "rgba(255,255,255,0.78)", // Clean glassmorphism on white
  
  // Brandbook text
  primary: "#0A0A0A", // Primary text (black)
  secondary: "#6B7280", // Secondary text (slate)
  tertiary: "#E5E7EB", // Subtle separators / neutral surface
  
  // Brandbook accents
  gold: "#C9A961", // Accent gold
  silver: "#B8BCC8", // Neutral metal (kept for existing UI)
  bronze: "#CD7F32",
  copper: "#B87333",
  emerald: "#059669",
  sapphire: "#2563EB",
  
  // Premium luxury warmth
  blush: "#E8DDD5", // Warm accent (blush)
  sage: "#B8C5C2",
  slate: "#475569",
  charcoal: "#1F2937",
  ivory: "#FAFAF9",
  pearl: "#FFFFFF",
  obsidian: "#0A0A0A",
  
  // Architectural color aliases
  mint: "#A8B5B2", // Same as sage
  rose: "#D4C4B8", // Same as blush
  lavender: "#9CA3AF", // Cool gray
  champagne: "#E8DED2", // Muted gold
  peach: "#D4C4B8", // Same as blush
  
  // Text hierarchy — brandbook-aligned
  text: "#0A0A0A", // Primary text
  textPrimary: "#0A0A0A",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  textMuted: "#D1D5DB",
  textAccent: "#C9A961", // Accent gold
  textLight: "#FFFFFF", // Pure white
  textInverse: "#FFFFFF", // White on dark
  
  // System colors - Premium refinement
  success: "#10B981", // Emerald green
  warning: "#F59E0B", // Amber
  error: "#EF4444", // Modern red
  info: "#3B82F6", // Blue
  danger: "#DC2626", // Alert red
  disabled: "#E5E7EB", // Disabled state
  
  // Borders & dividers - Architectural precision
  divider: "rgba(0,0,0,0.08)", // Defined divider
  border: "rgba(0,0,0,0.10)", // Clear border
  borderLight: "rgba(0,0,0,0.05)", // Subtle
  borderDark: "rgba(0,0,0,0.15)", // Strong definition
  
  // Advanced overlays - Depth & dimension
  overlayDark: "rgba(0,0,0,0.75)",
  overlayMedium: "rgba(0,0,0,0.5)",
  overlayLight: "rgba(0,0,0,0.25)",
  overlayWhite: "rgba(255,255,255,0.95)",
  overlayGlass: "rgba(255,255,255,0.72)",
  overlayGold: "rgba(201,169,97,0.12)",
  overlaySage: "rgba(184,201,197,0.12)",
  overlaySuccess: "rgba(52,199,89,0.12)",
  overlayError: "rgba(255,59,48,0.12)",
  
  // Legacy overlay aliases
  overlayBlush: "rgba(232,213,196,0.12)", // Warm overlay
  overlayLavender: "rgba(156,163,175,0.12)", // Cool overlay
  
  // Premium effects - Subtle luxury
  shimmer: "rgba(255,255,255,0.9)",
  glow: "rgba(201,169,97,0.4)",
  highlight: "rgba(255,255,255,0.8)",
  shadow: "rgba(0,0,0,0.04)",
  shadowMedium: "rgba(0,0,0,0.08)",
  shadowStrong: "rgba(0,0,0,0.15)",
  
  // Blur & glass - Modern depth
  blur: "rgba(255,255,255,0.8)",
  glass: "rgba(255,255,255,0.6)",
} as const;

const darkPalette = {
  // Premium dark - OLED luxury
  background: "#000000", // True black (OLED)
  backgroundStart: "#000000", // True black
  backgroundEnd: "#0A0A0A", // Near black
  surface: "#1C1C1E", // iOS dark surface
  surfaceAlt: "#2C2C2E", // Elevated dark
  surfaceElevated: "#3A3A3C", // Premium elevation
  surfaceGlass: "rgba(28,28,30,0.85)", // Dark glass

  // Premium dark accents
  primary: "#FFFFFF", // White primary (dark mode)
  secondary: "#8E8E93", // Premium gray
  tertiary: "#48484A", // Dark surface
  
  // Dark luxury metallics
  gold: "#E5C287", // Bright champagne
  silver: "#D0D0D6", // Bright silver
  bronze: "#E5A862", // Bright bronze
  copper: "#D9936A", // Bright copper
  
  // Dark premium accents
  blush: "#E8D5C4", // Warm
  sage: "#B8C9C5", // Cool
  slate: "#9CA3AF", // Gray-blue
  charcoal: "#48484A", // Surface
  ivory: "#F8F6F3", // Bright
  pearl: "#FFFFFF", // Pure
  
  // Dark legacy color aliases
  mint: "#B8C9C5", // Same as sage
  rose: "#E8D5C4", // Same as blush
  lavender: "#9CA3AF", // Cool gray
  champagne: "#F5E6D3", // Light gold
  peach: "#E8D5C4", // Same as blush
  
  // Dark text hierarchy
  text: "#FFFFFF", // Pure white
  textPrimary: "#FFFFFF", // Pure white
  textSecondary: "#EBEBF5", // Secondary (60%)
  textTertiary: "#EBEBF5", // Tertiary (30%)
  textMuted: "#8E8E93", // Ultra muted
  textAccent: "#E5C287", // Gold accent
  textLight: "#FFFFFF", // Pure white
  textInverse: "#000000", // Black on light
  
  // Dark system colors
  success: "#30D158", // iOS green (dark)
  warning: "#FF9F0A", // iOS orange (dark)
  error: "#FF453A", // iOS red (dark)
  info: "#0A84FF", // iOS blue (dark)
  danger: "#FF453A", // Alert red
  disabled: "#48484A", // Disabled
  
  // Dark borders
  divider: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.04)",
  borderDark: "rgba(255,255,255,0.12)",
  
  // Dark overlays
  overlayDark: "rgba(0,0,0,0.85)",
  overlayMedium: "rgba(0,0,0,0.6)",
  overlayLight: "rgba(255,255,255,0.15)",
  overlayWhite: "rgba(255,255,255,0.08)",
  overlayGlass: "rgba(28,28,30,0.72)",
  overlayGold: "rgba(229,194,135,0.15)",
  overlaySage: "rgba(184,201,197,0.15)",
  overlaySuccess: "rgba(48,209,88,0.15)",
  overlayError: "rgba(255,69,58,0.15)",
  
  // Dark legacy overlay aliases
  overlayBlush: "rgba(232,213,196,0.15)", // Warm overlay
  overlayLavender: "rgba(156,163,175,0.15)", // Cool overlay
  
  // Dark effects
  shimmer: "rgba(255,255,255,0.8)",
  glow: "rgba(229,194,135,0.5)",
  highlight: "rgba(255,255,255,0.6)",
  shadow: "rgba(0,0,0,0.5)",
  shadowMedium: "rgba(0,0,0,0.6)",
  shadowStrong: "rgba(0,0,0,0.8)",
  
  // Dark glass
  blur: "rgba(28,28,30,0.8)",
  glass: "rgba(28,28,30,0.6)",
} as const;

export const getPalette = (theme: ThemeMode) => {
  return theme === 'light' ? lightPalette : darkPalette;
};

// Default to light theme for the luxurious design
export const palette = lightPalette;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export const typography = {
  // Elegant font sizes
  display: 36,
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  h6: 16,
  body: 16,
  bodySmall: 14,
  caption: 12,
  overline: 10,
  
  // Font weights
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
} as const;

// Premium shadow system - Subtle depth
export const shadow = {
  // Minimal - Subtle elevation (cards, buttons)
  minimal: Platform.select({
    web: {
      shadowColor: "#000000",
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 0,
    },
    default: {
      shadowColor: "#000000",
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  }),
  
  // Soft - Standard elevation
  soft: Platform.select({
    web: {
      shadowColor: "#000000",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 0,
    },
    default: {
      shadowColor: "#000000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  }),
  
  // Medium - Prominent cards
  medium: Platform.select({
    web: {
      shadowColor: "#000000",
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 0,
    },
    default: {
      shadowColor: "#000000",
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  }),
  
  // Strong - Modals, overlays
  strong: Platform.select({
    web: {
      shadowColor: "#000000",
      shadowOpacity: 0.2,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 16 },
      elevation: 0,
    },
    default: {
      shadowColor: "#000000",
      shadowOpacity: 0.2,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 16 },
      elevation: 16,
    },
  }),
  
  // Glow - Brandbook gold accent elements
  glow: Platform.select({
    web: {
      shadowColor: "#C9A961",
      shadowOpacity: 0.28,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 4 },
      elevation: 0,
    },
    default: {
      shadowColor: "#C9A961",
      shadowOpacity: 0.28,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
  }),
  
  // Inner - Inset depth effect
  inner: {
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  
  // Legacy aliases - for backward compatibility
  card: Platform.select({
    web: {
      shadowColor: "#000000",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 0,
    },
    default: {
      shadowColor: "#000000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  }),
  elevated: Platform.select({
    web: {
      shadowColor: "#000000",
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 0,
    },
    default: {
      shadowColor: "#000000",
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  }),
  floating: Platform.select({
    web: {
      shadowColor: "#000000",
      shadowOpacity: 0.2,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 16 },
      elevation: 0,
    },
    default: {
      shadowColor: "#000000",
      shadowOpacity: 0.2,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 16 },
      elevation: 16,
    },
  }),
} as const;

// Premium gradient system - Subtle luxury
const lightGradient = {
  // Primary gradients - Minimal & premium
  primary: ["#1A1A1A", "#000000"] as const, // Black gradient
  secondary: ["#F7F8FA", "#FFFFFF"] as const, // Light gradient
  tertiary: ["#FCFCFC", "#F7F8FA"] as const, // Subtle gradient
  
  // Background gradients - Ultra clean
  hero: ["#FFFFFF", "#F7F8FA"] as const, // White to cool gray
  surface: ["#FFFFFF", "#FCFCFC"] as const, // White gradient
  glass: ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.6)"] as const, // Glassmorphism
  
  // Luxury metallic gradients - Strategic accents
  gold: ["#FFF9E6", "#FFD700", "#C9A961"] as const, // Rich gold
  silver: ["#F8F9FA", "#D1D5DB", "#B8BCC8"] as const, // Platinum silver
  bronze: ["#F5E8DC", "#CD7F32", "#B87333"] as const, // Classic bronze
  emerald: ["#ECFDF5", "#10B981", "#059669"] as const, // Premium emerald
  sapphire: ["#EFF6FF", "#3B82F6", "#2563EB"] as const, // Premium sapphire
  
  // Ambient gradients - Subtle atmosphere (brandbook)
  sage: ["#F0FDF9", "#E8F5F0", "#B8C5C2"] as const,
  blush: ["#FFFFFF", "#FAFBFC", "#E8DDD5"] as const,
  slate: ["#F8FAFC", "#E8EAED", "#9CA3AF"] as const, // Neutral ambient
  luxury: ["#1F2937", "#111827", "#0A0A0A"] as const, // Premium dark
  
  // Legacy gradient aliases
  mint: ["#F5F8F7", "#E8EEEC", "#B8C9C5"] as const, // Same as sage
  rose: ["#F8F5F2", "#F0E8E0", "#E8D5C4"] as const, // Same as blush
  lavender: ["#F5F6F7", "#E8EAED", "#9CA3AF"] as const, // Cool gray
  card: ["#FFFFFF", "#FCFCFC"] as const, // Legacy card gradient
  aurora: ["#FFF9E6", "#C9A961", "#E8DDD5", "#9CA3AF"] as const,
  paywall: ["#000000", "#1A1A1A"] as const, // Dark overlay
  
  // Special effects
  shimmer: ["rgba(255,255,255,1)", "rgba(201,169,97,0.42)", "rgba(255,255,255,1)"] as const,
  glow: ["rgba(201,169,97,0.15)", "rgba(201,169,97,0.08)", "rgba(201,169,97,0)"] as const,
  spotlight: ["rgba(255,255,255,0)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0)"] as const,
  
  // System gradients
  success: ["#34C759", "#30D158"] as const,
  warning: ["#FF9500", "#FF9F0A"] as const,
  error: ["#FF3B30", "#FF453A"] as const,
  info: ["#007AFF", "#0A84FF"] as const,
  
  // Dark overlay for premium modals
  overlay: ["rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"] as const,
} as const;

const darkGradient = {
  // Dark primary gradients
  primary: ["#FFFFFF", "#E5E5EA"] as const, // White gradient
  secondary: ["#3A3A3C", "#1C1C1E"] as const, // Dark gradient
  tertiary: ["#2C2C2E", "#1C1C1E"] as const, // Elevated dark
  
  // Dark backgrounds
  hero: ["#000000", "#0A0A0A"] as const, // True black to near black
  surface: ["#1C1C1E", "#2C2C2E"] as const, // iOS dark surfaces
  glass: ["rgba(28,28,30,0.9)", "rgba(28,28,30,0.6)"] as const, // Dark glass
  
  // Dark luxury metallics
  gold: ["#F5E6D3", "#E5C287", "#D4A574"] as const, // Bright gold
  silver: ["#F5F5FA", "#D0D0D6", "#B8B8C0"] as const, // Bright silver
  bronze: ["#F5E0CC", "#E5A862", "#CD7F32"] as const, // Bright bronze
  
  // Dark ambient gradients
  sage: ["#2C3430", "#242B28", "#1C2220"] as const, // Dark sage
  blush: ["#2C2826", "#242220", "#1C1A18"] as const, // Dark blush
  slate: ["#2A2C2E", "#242628", "#1C1E20"] as const, // Dark slate
  
  // Dark legacy gradient aliases
  mint: ["#2C3430", "#242B28", "#1C2220"] as const, // Same as sage
  rose: ["#2C2826", "#242220", "#1C1A18"] as const, // Same as blush
  lavender: ["#2A2C2E", "#242628", "#1C1E20"] as const, // Cool gray
  card: ["#1C1C1E", "#2C2C2E"] as const, // Legacy card gradient
  aurora: ["#F5E6D3", "#E5C287", "#B8C9C5", "#9CA3AF"] as const, // Multi-tone gradient
  paywall: ["#000000", "#0A0A0A"] as const, // Dark overlay
  
  // Dark effects
  shimmer: ["rgba(255,255,255,0.9)", "rgba(229,194,135,0.5)", "rgba(255,255,255,0.9)"] as const,
  glow: ["rgba(229,194,135,0.2)", "rgba(229,194,135,0.1)", "rgba(229,194,135,0)"] as const,
  spotlight: ["rgba(255,255,255,0)", "rgba(255,255,255,0.1)", "rgba(255,255,255,0)"] as const,
  
  // Dark system gradients
  success: ["#30D158", "#32D74B"] as const,
  warning: ["#FF9F0A", "#FFB340"] as const,
  error: ["#FF453A", "#FF6961"] as const,
  info: ["#0A84FF", "#409CFF"] as const,
  
  // Light overlay for dark premium modals
  overlay: ["rgba(28,28,30,0.85)", "rgba(0,0,0,0.95)"] as const,
} as const;

export const getGradient = (theme: ThemeMode) => {
  return theme === 'light' ? lightGradient : darkGradient;
};

// Default to light theme for the new pastel design
export const gradient = lightGradient;

export const rings = {
  // For premium circular meters and avatars
  primary: {
    start: "#D9B37F",
    end: "#C9AFE9",
  },
  success: {
    start: "#79E6B1",
    end: "#C9AFE9",
  },
} as const;
