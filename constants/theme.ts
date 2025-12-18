import { Platform } from "react-native";

export type ThemeMode = 'light' | 'dark';

// Modern gender-neutral color palette for confidence and wellness
const lightPalette = {
  // Clean, professional backgrounds
  background: "#F8FAFB", // Fresh white
  backgroundStart: "#F8FAFB", // Fresh white
  backgroundEnd: "#EEF2F6", // Cool mist
  surface: "#FFFFFF", // Pure white
  surfaceAlt: "#F5F7FA", // Light gray
  surfaceElevated: "#FAFBFC", // Elevated surface

  // Bold, confident accent colors - gender-neutral
  primary: "#FF6B35", // Energetic coral-orange
  secondary: "#004E89", // Professional deep blue
  tertiary: "#1B998B", // Fresh teal
  
  // Balanced, universal colors
  blush: "#FF6B35", // Warm orange (replaces pink)
  lavender: "#6C63FF", // Modern purple
  mint: "#1B998B", // Professional teal
  peach: "#FFA726", // Warm amber
  rose: "#FF6B35", // Energetic coral
  cream: "#F5F1E8", // Warm neutral
  pearl: "#FFFFFF", // Clean white
  
  // Professional accent colors
  gold: "#FFA726", // Warm amber
  roseGold: "#FF6B35", // Energetic coral
  champagne: "#FFD89B", // Soft gold
  bronze: "#D4850A", // Rich gold
  
  // Text hierarchy - better readability
  text: "#1A1F36", // Professional navy
  textPrimary: "#1A1F36", // Professional navy
  textSecondary: "#6B7280", // Balanced gray
  textMuted: "#9CA3AF", // Light gray
  textAccent: "#FF6B35", // Vibrant orange
  textLight: "#FFFFFF", // Pure white
  
  // System colors - clear and professional
  success: "#10B981", // Fresh green
  warning: "#FFA726", // Warm amber
  error: "#EF4444", // Clear red
  info: "#3B82F6", // Professional blue
  danger: "#DC2626", // Strong red
  
  // Dividers and borders - clean
  divider: "#E5E7EB", // Cool gray divider
  border: "#D1D5DB", // Subtle border
  borderLight: "#F3F4F6", // Ultra light border
  disabled: "#E5E7EB", // Disabled state
  
  // Overlays and effects - modern depth
  overlayDark: "rgba(26,31,54,0.12)",
  overlayLight: "rgba(255,255,255,0.95)",
  overlayBlush: "rgba(255,107,53,0.15)",
  overlayGold: "rgba(255,167,38,0.18)",
  overlayLavender: "rgba(108,99,255,0.15)",
  overlaySuccess: "rgba(16,185,129,0.15)",
  overlayError: "rgba(239,68,68,0.15)",
  
  // Shimmer and glow effects - subtle
  shimmer: "#FFFFFF",
  glow: "#FF6B35",
  highlight: "rgba(255,107,53,0.25)",
  shadow: "rgba(26,31,54,0.08)",
} as const;

const darkPalette = {
  // Professional dark backgrounds
  background: "#0F1419", // Deep navy
  backgroundStart: "#0F1419", // Deep navy
  backgroundEnd: "#1A1F36", // Navy blue
  surface: "#1A1F36", // Dark surface
  surfaceAlt: "#252A41", // Elevated dark
  surfaceElevated: "#2D3548", // Premium elevation

  // Bold accent colors for dark mode
  primary: "#FF8A5B", // Bright coral
  secondary: "#3B82F6", // Vibrant blue
  tertiary: "#34D399", // Bright teal
  
  // Universal colors for dark mode
  blush: "#FF8A5B", // Warm coral
  lavender: "#818CF8", // Bright purple
  mint: "#34D399", // Bright teal
  peach: "#FBB040", // Warm gold
  rose: "#FF8A5B", // Bright coral
  cream: "#E5DCC5", // Warm neutral
  pearl: "#F3F4F6", // Light gray
  
  // Professional accents for dark
  gold: "#FBB040", // Warm gold
  roseGold: "#FF8A5B", // Bright coral
  champagne: "#FCD67B", // Bright gold
  bronze: "#F59E0B", // Rich amber
  
  // Text hierarchy - better contrast
  text: "#F9FAFB", // Clean white
  textPrimary: "#F9FAFB", // Clean white
  textSecondary: "#D1D5DB", // Light gray
  textMuted: "#9CA3AF", // Medium gray
  textAccent: "#FF8A5B", // Bright coral
  textLight: "#FFFFFF", // Pure white
  
  // System colors - clear for dark mode
  success: "#34D399", // Bright green
  warning: "#FBB040", // Bright amber
  error: "#F87171", // Bright red
  info: "#60A5FA", // Bright blue
  danger: "#EF4444", // Strong red
  disabled: "#4B5563", // Disabled state dark
  
  // Dividers and borders - professional
  divider: "#374151", // Dark divider
  border: "#4B5563", // Medium border
  borderLight: "#6B7280", // Light border
  
  // Overlays and effects - modern depth
  overlayDark: "rgba(0,0,0,0.4)",
  overlayLight: "rgba(249,250,251,0.1)",
  overlayBlush: "rgba(255,138,91,0.2)",
  overlayGold: "rgba(251,176,64,0.2)",
  overlayLavender: "rgba(129,140,248,0.2)",
  overlaySuccess: "rgba(52,211,153,0.15)",
  overlayError: "rgba(248,113,113,0.15)",
  
  // Shimmer and glow effects - subtle
  shimmer: "#F3F4F6",
  glow: "#FF8A5B",
  highlight: "rgba(255,138,91,0.25)",
  shadow: "rgba(0,0,0,0.3)",
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

export const shadow = {
  // Subtle card shadows
  card: Platform.select({
    web: {
      shadowColor: "rgba(44,42,46,0.08)",
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 0,
    },
    default: {
      shadowColor: "rgba(44,42,46,0.08)",
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  }),
  
  // Elegant elevated shadow
  elevated: Platform.select({
    web: {
      shadowColor: "rgba(44,42,46,0.12)",
      shadowOpacity: 1,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 0,
    },
    default: {
      shadowColor: "rgba(44,42,46,0.12)",
      shadowOpacity: 1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  }),
  
  // Soft glow for special elements
  glow: Platform.select({
    web: {
      shadowColor: "#D4A574",
      shadowOpacity: 0.2,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 4 },
      elevation: 0,
    },
    default: {
      shadowColor: "#D4A574",
      shadowOpacity: 0.2,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
  }),
  
  // Floating elements
  floating: Platform.select({
    web: {
      shadowColor: "rgba(44,42,46,0.16)",
      shadowOpacity: 1,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 12 },
      elevation: 0,
    },
    default: {
      shadowColor: "rgba(44,42,46,0.16)",
      shadowOpacity: 1,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
  }),
} as const;

const lightGradient = {
  // Primary brand gradients
  primary: ["#FF6B35", "#FF8A5B"] as const, // Energetic coral
  secondary: ["#004E89", "#3B82F6"] as const, // Professional blue
  tertiary: ["#1B998B", "#34D399"] as const, // Fresh teal
  
  // Background gradients
  hero: ["#F8FAFB", "#EEF2F6"] as const, // Clean to mist
  surface: ["#FFFFFF", "#F5F7FA"] as const, // White to light
  card: ["#FFFFFF", "#FAFBFC"] as const, // White to elevated
  
  // Modern themed gradients
  gold: ["#FFD89B", "#FFA726", "#D4850A"] as const, // Warm golds
  rose: ["#FF6B35", "#FF8A5B", "#FFA726"] as const, // Warm spectrum
  lavender: ["#6C63FF", "#818CF8", "#A78BFA"] as const, // Purple spectrum
  mint: ["#1B998B", "#34D399", "#6EE7B7"] as const, // Teal spectrum
  
  // Special effects
  shimmer: ["#FFFFFF", "#FF6B35", "#FFFFFF"] as const, // Clean shimmer
  glow: ["rgba(255,107,53,0.4)", "rgba(255,107,53,0.2)", "rgba(255,107,53,0.1)"] as const,
  aurora: ["#FF6B35", "#6C63FF", "#1B998B", "#FFA726"] as const, // Multi-color
  
  // Context gradients
  success: ["#10B981", "#34D399"] as const,
  warning: ["#F59E0B", "#FBB040"] as const,
  error: ["#EF4444", "#F87171"] as const,
  info: ["#3B82F6", "#60A5FA"] as const,
  
  // Premium paywall
  paywall: ["#0F1419", "#1A1F36"] as const,
} as const;

const darkGradient = {
  // Primary brand gradients
  primary: ["#FF8A5B", "#FFA576"] as const, // Bright coral
  secondary: ["#3B82F6", "#60A5FA"] as const, // Vibrant blue
  tertiary: ["#34D399", "#6EE7B7"] as const, // Bright teal
  
  // Background gradients
  hero: ["#0F1419", "#1A1F36"] as const, // Deep navy gradient
  surface: ["#1A1F36", "#252A41"] as const, // Navy elevation
  card: ["#1A1F36", "#2D3548"] as const, // Navy to elevated
  
  // Modern themed gradients
  gold: ["#FCD67B", "#FBB040", "#F59E0B"] as const, // Bright golds
  rose: ["#FF8A5B", "#FFA576", "#FBB040"] as const, // Warm spectrum
  lavender: ["#818CF8", "#A78BFA", "#C4B5FD"] as const, // Bright purple spectrum
  mint: ["#34D399", "#6EE7B7", "#A7F3D0"] as const, // Bright teal spectrum
  
  // Special effects
  shimmer: ["#F3F4F6", "#FF8A5B", "#F3F4F6"] as const, // Bright shimmer
  glow: ["rgba(255,138,91,0.3)", "rgba(255,138,91,0.15)", "rgba(255,138,91,0.05)"] as const,
  aurora: ["#FF8A5B", "#818CF8", "#34D399", "#FBB040"] as const, // Bright multi-color
  
  // Context gradients
  success: ["#34D399", "#6EE7B7"] as const,
  warning: ["#FBB040", "#FCD67B"] as const,
  error: ["#F87171", "#FCA5A5"] as const,
  info: ["#60A5FA", "#93C5FD"] as const,
  
  // Premium paywall
  paywall: ["#0F1419", "#1A1F36"] as const,
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
