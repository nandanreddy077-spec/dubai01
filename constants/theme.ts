import { Platform } from "react-native";

export type ThemeMode = 'light' | 'dark';

// Sophisticated gender-neutral palette inspired by premium lifestyle brands
const lightPalette = {
  // Premium minimalist backgrounds
  background: "#FAFAFA", // Clean neutral
  backgroundStart: "#FFFFFF", // Pure white
  backgroundEnd: "#F5F5F7", // Subtle gray
  surface: "#FFFFFF", // Pure white
  surfaceAlt: "#FAFAFA", // Light gray
  surfaceElevated: "#F8F8F8", // Elevated neutral

  // Sophisticated accent colors - luxury gold & slate
  primary: "#C9A063", // Refined gold
  secondary: "#2C3E50", // Sophisticated slate
  tertiary: "#8B7355", // Premium bronze
  
  // Universal accent palette
  blush: "#E8D5C4", // Warm beige
  lavender: "#A8B2C1", // Cool slate
  mint: "#B8C9C5", // Sage green
  peach: "#D4B5A0", // Warm taupe
  rose: "#C5B5AC", // Greige
  cream: "#F5F1ED", // Warm white
  pearl: "#FFFFFF", // Pure white
  
  // Luxury metallics - universal premium
  gold: "#C9A063", // Refined gold
  roseGold: "#B8956A", // Muted bronze gold
  champagne: "#E8DCC8", // Warm neutral
  bronze: "#8B7355", // Rich bronze
  
  // Text hierarchy - premium readability
  text: "#1A1A1A", // Deep charcoal
  textPrimary: "#1A1A1A", // Deep charcoal
  textSecondary: "#6B6B6B", // Medium gray
  textMuted: "#999999", // Light gray
  textAccent: "#C9A063", // Gold accent
  textLight: "#FFFFFF", // Pure white
  
  // System colors - professional approach
  success: "#10B981", // Clean green
  warning: "#F59E0B", // Amber warning
  error: "#EF4444", // Clear red
  info: "#3B82F6", // Professional blue
  danger: "#DC2626", // Strong red
  disabled: "#E5E5E5", // Disabled state
  
  // Dividers and borders - clean lines
  divider: "#E5E5E5", // Neutral divider
  border: "#D4D4D4", // Clean border
  borderLight: "#F0F0F0", // Light border
  
  // Overlays and effects - sophisticated depth
  overlayDark: "rgba(0,0,0,0.6)",
  overlayLight: "rgba(255,255,255,0.95)",
  overlayBlush: "rgba(201,160,99,0.1)",
  overlayGold: "rgba(201,160,99,0.15)",
  overlayLavender: "rgba(168,178,193,0.1)",
  overlaySuccess: "rgba(16,185,129,0.1)",
  overlayError: "rgba(239,68,68,0.1)",
  
  // Shimmer and glow effects - premium polish
  shimmer: "#FFFFFF",
  glow: "#C9A063",
  highlight: "rgba(201,160,99,0.2)",
  shadow: "rgba(0,0,0,0.08)",
} as const;

const darkPalette = {
  // Rich dark backgrounds - premium luxury
  background: "#0A0A0A", // Deep black
  backgroundStart: "#121212", // Charcoal
  backgroundEnd: "#0A0A0A", // Deep black
  surface: "#1A1A1A", // Dark surface
  surfaceAlt: "#222222", // Elevated dark
  surfaceElevated: "#2A2A2A", // Premium elevation

  // Sophisticated accent colors - premium dark mode
  primary: "#D4AF37", // Bright gold
  secondary: "#4A5568", // Cool slate
  tertiary: "#9C826B", // Warm bronze
  
  // Universal palette (adjusted for dark)
  blush: "#C9A88A", // Warm neutral
  lavender: "#9CA9B8", // Cool slate
  mint: "#A8BCB8", // Muted sage
  peach: "#C4A590", // Warm taupe
  rose: "#B5A8A0", // Neutral greige
  cream: "#E5E0DB", // Warm white
  pearl: "#F5F5F5", // Light gray
  
  // Luxury metallics - dark mode premium
  gold: "#D4AF37", // Bright gold
  roseGold: "#C9A063", // Rich gold
  champagne: "#C9B99A", // Warm neutral
  bronze: "#9C826B", // Warm bronze
  
  // Text hierarchy - premium contrast
  text: "#FFFFFF", // Pure white
  textPrimary: "#FFFFFF", // Pure white
  textSecondary: "#A3A3A3", // Medium gray
  textMuted: "#737373", // Muted gray
  textAccent: "#D4AF37", // Gold accent
  textLight: "#FFFFFF", // Pure white
  
  // System colors - professional dark mode
  success: "#34D399", // Bright green
  warning: "#FBBF24", // Bright amber
  error: "#F87171", // Bright red
  info: "#60A5FA", // Bright blue
  danger: "#EF4444", // Strong red
  disabled: "#404040", // Disabled dark
  
  // Dividers and borders - clean dark lines
  divider: "#2A2A2A", // Dark divider
  border: "#3A3A3A", // Dark border
  borderLight: "#333333", // Subtle dark border
  
  // Overlays and effects - sophisticated dark depth
  overlayDark: "rgba(0,0,0,0.7)",
  overlayLight: "rgba(255,255,255,0.05)",
  overlayBlush: "rgba(212,175,55,0.1)",
  overlayGold: "rgba(212,175,55,0.15)",
  overlayLavender: "rgba(156,166,184,0.1)",
  overlaySuccess: "rgba(52,211,153,0.1)",
  overlayError: "rgba(248,113,113,0.1)",
  
  // Shimmer and glow effects - premium dark polish
  shimmer: "#FFFFFF",
  glow: "#D4AF37",
  highlight: "rgba(212,175,55,0.2)",
  shadow: "rgba(0,0,0,0.4)",
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
  // Primary brand gradients - sophisticated
  primary: ["#C9A063", "#8B7355"] as const, // Gold to bronze
  secondary: ["#2C3E50", "#34495E"] as const, // Slate gradient
  tertiary: ["#B8C9C5", "#8B7355"] as const, // Sage to bronze
  
  // Background gradients - clean premium
  hero: ["#FFFFFF", "#F5F5F7"] as const, // White to subtle gray
  surface: ["#FFFFFF", "#FAFAFA"] as const, // White gradient
  card: ["#FFFFFF", "#F8F8F8"] as const, // Elevated white
  
  // Luxury themed gradients - universal
  gold: ["#E8DCC8", "#C9A063", "#8B7355"] as const, // Warm neutral to gold to bronze
  rose: ["#E8D5C4", "#C9A063", "#8B7355"] as const, // Warm beige spectrum
  lavender: ["#D4D9E0", "#A8B2C1", "#8A94A6"] as const, // Cool slate spectrum
  mint: ["#D8E2DE", "#B8C9C5", "#98ADA8"] as const, // Sage spectrum
  
  // Special effects - premium polish
  shimmer: ["#FFFFFF", "#C9A063", "#FFFFFF"] as const, // Gold shimmer
  glow: ["rgba(201,160,99,0.3)", "rgba(201,160,99,0.15)", "rgba(201,160,99,0.05)"] as const,
  aurora: ["#C9A063", "#8B7355", "#B8C9C5", "#A8B2C1"] as const, // Sophisticated spectrum
  
  // Context gradients - professional
  success: ["#10B981", "#34D399"] as const,
  warning: ["#F59E0B", "#FBBF24"] as const,
  error: ["#EF4444", "#F87171"] as const,
  info: ["#3B82F6", "#60A5FA"] as const,
  
  // Premium paywall - luxury dark
  paywall: ["#0A0A0A", "#1A1A1A"] as const,
} as const;

const darkGradient = {
  // Primary brand gradients - premium dark
  primary: ["#D4AF37", "#9C826B"] as const, // Bright gold to bronze
  secondary: ["#4A5568", "#5A6478"] as const, // Cool slate gradient
  tertiary: ["#A8BCB8", "#9C826B"] as const, // Sage to bronze
  
  // Background gradients - premium dark
  hero: ["#121212", "#0A0A0A"] as const, // Charcoal to deep black
  surface: ["#1A1A1A", "#222222"] as const, // Dark gradient
  card: ["#1A1A1A", "#2A2A2A"] as const, // Elevated dark
  
  // Luxury themed gradients - dark universal
  gold: ["#C9B99A", "#D4AF37", "#9C826B"] as const, // Warm neutral to gold to bronze
  rose: ["#C9A88A", "#C9A063", "#9C826B"] as const, // Warm spectrum
  lavender: ["#C4C9D0", "#9CA9B8", "#7A8A9E"] as const, // Cool slate spectrum
  mint: ["#C8D2CE", "#A8BCB8", "#88A698"] as const, // Sage spectrum
  
  // Special effects - dark premium polish
  shimmer: ["#FFFFFF", "#D4AF37", "#FFFFFF"] as const, // Gold shimmer
  glow: ["rgba(212,175,55,0.3)", "rgba(212,175,55,0.15)", "rgba(212,175,55,0.05)"] as const,
  aurora: ["#D4AF37", "#9C826B", "#A8BCB8", "#9CA9B8"] as const, // Dark sophisticated spectrum
  
  // Context gradients - professional dark
  success: ["#10B981", "#34D399"] as const,
  warning: ["#F59E0B", "#FBBF24"] as const,
  error: ["#EF4444", "#F87171"] as const,
  info: ["#3B82F6", "#60A5FA"] as const,
  
  // Premium paywall - luxury dark
  paywall: ["#0A0A0A", "#1A1A1A"] as const,
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
