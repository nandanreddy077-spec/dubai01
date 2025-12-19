import { Platform } from "react-native";

export type ThemeMode = 'light' | 'dark';

// Luxurious feminine color palette inspired by high-end beauty brands
const lightPalette = {
  // Dreamy gradient backgrounds - softer, more ethereal
  background: "#FFFBF7", // Ethereal pearl
  backgroundStart: "#FFFBF7", // Ethereal pearl
  backgroundEnd: "#FDF4EE", // Silk champagne
  surface: "#FFFFFF", // Pure white
  surfaceAlt: "#FEFCF9", // Ivory silk
  surfaceElevated: "#FCF7F3", // Elevated pearl

  // Sophisticated accent colors - more refined
  primary: "#E6A478", // Refined rose gold
  secondary: "#D2A372", // Elegant warm gold
  tertiary: "#C7A76C", // Sophisticated champagne
  
  // Feminine pastels - enhanced for psychology
  blush: "#F4C4C4", // Nurturing blush
  lavender: "#EAD7F2", // Calming lavender
  mint: "#D6F2EA", // Refreshing mint
  peach: "#F7D7C4", // Comforting peach
  rose: "#F2CAD6", // Romantic rose
  cream: "#FAF2EA", // Luxurious cream
  pearl: "#FFFEFC", // Luminous pearl
  
  // Luxury metallics - more premium feel
  gold: "#D2A372", // Refined gold
  roseGold: "#E6A478", // Premium rose gold
  champagne: "#F2E6D4", // Elegant champagne
  bronze: "#CB9373", // Rich bronze
  
  // Text hierarchy - better readability
  text: "#2A282C", // Sophisticated charcoal
  textPrimary: "#2A282C", // Sophisticated charcoal
  textSecondary: "#6D6D6D", // Refined gray
  textMuted: "#9D9D9D", // Gentle gray
  textAccent: "#D2A372", // Gold accent
  textLight: "#FFFFFF", // Pure white
  
  // System colors - softer approach
  success: "#AAE8D1", // Gentle mint green
  warning: "#FFD5A7", // Soft peach warning
  error: "#FFB5BC", // Gentle coral
  info: "#AADAEC", // Soft sky blue
  danger: "#E85D75", // Elegant danger red
  disabled: "#E8E2DE", // Disabled state
  
  // Dividers and borders - more subtle
  divider: "#F2E8E8", // Whisper pink divider
  border: "#EAE2DE", // Subtle border
  borderLight: "#F7F2EE", // Ultra light border
  
  // Overlays and effects - enhanced depth
  overlayDark: "rgba(42,40,44,0.12)",
  overlayLight: "rgba(255,255,255,0.92)",
  overlayBlush: "rgba(244,196,196,0.25)",
  overlayGold: "rgba(210,163,114,0.18)",
  overlayLavender: "rgba(234,215,242,0.25)",
  overlaySuccess: "rgba(170,232,209,0.15)",
  overlayError: "rgba(255,181,188,0.15)",
  
  // Shimmer and glow effects - more magical
  shimmer: "#FFFEFC",
  glow: "#F4C4C4",
  highlight: "rgba(210,163,114,0.35)",
  shadow: "rgba(42,40,44,0.06)",
} as const;

const darkPalette = {
  // Rich dark backgrounds with warmth - more luxurious
  background: "#1C1820", // Luxurious plum
  backgroundStart: "#1C1820", // Luxurious plum
  backgroundEnd: "#12101A", // Deep velvet
  surface: "#1E1A22", // Elegant surface
  surfaceAlt: "#232026", // Elevated dark
  surfaceElevated: "#27242B", // Premium elevation

  // Sophisticated accent colors - enhanced for dark mode
  primary: "#E6A478", // Refined rose gold
  secondary: "#D2A372", // Elegant warm gold
  tertiary: "#C7A76C", // Sophisticated champagne
  
  // Feminine pastels (adjusted for dark) - more vibrant
  blush: "#D6A7A7", // Rich blush
  lavender: "#CAB7D2", // Elegant lavender
  mint: "#B6D2CA", // Sophisticated mint
  peach: "#D7B7A4", // Warm peach
  rose: "#D2AAB6", // Romantic rose
  cream: "#DAD2CA", // Luxurious cream
  pearl: "#EAE8E6", // Luminous pearl
  
  // Luxury metallics - more premium
  gold: "#D2A372", // Refined gold
  roseGold: "#E6A478", // Premium rose gold
  champagne: "#D2C6B4", // Elegant champagne
  bronze: "#CB9373", // Rich bronze
  
  // Text hierarchy - better contrast
  text: "#F7F2EE", // Luxurious white
  textPrimary: "#F7F2EE", // Luxurious white
  textSecondary: "#CAC2BE", // Refined light gray
  textMuted: "#9D9D9D", // Gentle gray
  textAccent: "#D2A372", // Gold accent
  textLight: "#FFFFFF", // Pure white
  
  // System colors - refined for dark mode
  success: "#8AC8B1", // Elegant mint green
  warning: "#E1B587", // Sophisticated peach
  error: "#E1959C", // Refined coral
  info: "#8ABACA", // Elegant sky
  danger: "#E85D75", // Elegant danger red
  
  // Dividers and borders - more sophisticated
  divider: "#2D2732", // Elegant divider
  border: "#363137", // Refined border
  borderLight: "#3C373D", // Subtle border
  
  // Overlays and effects - enhanced depth
  overlayDark: "rgba(0,0,0,0.35)",
  overlayLight: "rgba(247,242,238,0.08)",
  overlayBlush: "rgba(214,167,167,0.18)",
  overlayGold: "rgba(210,163,114,0.18)",
  overlayLavender: "rgba(202,183,210,0.18)",
  overlaySuccess: "rgba(138,200,177,0.15)",
  overlayError: "rgba(225,149,156,0.15)",
  
  // Shimmer and glow effects - more magical
  shimmer: "#EAE8E6",
  glow: "#D6A7A7",
  highlight: "rgba(210,163,114,0.28)",
  shadow: "rgba(0,0,0,0.25)",
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
  primary: ["#E8A87C", "#D4A574"] as const, // Rose gold to warm gold
  secondary: ["#F2C2C2", "#E8D5F0"] as const, // Blush to lavender
  tertiary: ["#D4F0E8", "#F5D5C2"] as const, // Mint to peach
  
  // Background gradients
  hero: ["#FDF8F5", "#F9F1EC"] as const, // Pearl to champagne
  surface: ["#FFFFFF", "#FEFBF8"] as const, // White to ivory
  card: ["#FFFFFF", "#FBF6F2"] as const, // White to elevated pearl
  
  // Luxury themed gradients
  gold: ["#F0E4D2", "#D4A574", "#CD9575"] as const, // Champagne to gold to bronze
  rose: ["#F2C2C2", "#F0C8D4", "#E8A87C"] as const, // Blush to rose to rose gold
  lavender: ["#E8D5F0", "#D4C2E8", "#C8B5D0"] as const, // Lavender spectrum
  mint: ["#D4F0E8", "#C2E8D4", "#B4D0C8"] as const, // Mint spectrum
  
  // Special effects
  shimmer: ["#FEFCFA", "#F2C2C2", "#FEFCFA"] as const, // Pearl shimmer
  glow: ["rgba(212,165,116,0.4)", "rgba(212,165,116,0.2)", "rgba(212,165,116,0.1)"] as const,
  aurora: ["#F2C2C2", "#E8D5F0", "#D4F0E8", "#F5D5C2"] as const, // Multi-color aurora
  
  // Context gradients
  success: ["#A8E6CF", "#D4F0E8"] as const,
  warning: ["#FFD3A5", "#F5D5C2"] as const,
  error: ["#FFB3BA", "#F0C8D4"] as const,
  info: ["#A8D8EA", "#D4F0E8"] as const,
  
  // Premium paywall
  paywall: ["#1A1618", "#2B2530"] as const,
} as const;

const darkGradient = {
  // Primary brand gradients
  primary: ["#E8A87C", "#D4A574"] as const, // Rose gold to warm gold
  secondary: ["#D4A5A5", "#C8B5D0"] as const, // Muted blush to lavender
  tertiary: ["#B4D0C8", "#D5B5A2"] as const, // Muted mint to peach
  
  // Background gradients
  hero: ["#1A1618", "#0F0D10"] as const, // Deep plum to rich black
  surface: ["#1C1820", "#211E24"] as const, // Dark surface to elevated
  card: ["#1C1820", "#252229"] as const, // Dark surface to higher elevation
  
  // Luxury themed gradients
  gold: ["#D0C4B2", "#D4A574", "#CD9575"] as const, // Muted champagne to gold to bronze
  rose: ["#D4A5A5", "#D0A8B4", "#E8A87C"] as const, // Muted blush to rose to rose gold
  lavender: ["#C8B5D0", "#B4A2C0", "#A08FB0"] as const, // Muted lavender spectrum
  mint: ["#B4D0C8", "#A2C0B4", "#8FB0A0"] as const, // Muted mint spectrum
  
  // Special effects
  shimmer: ["#E8E6E4", "#D4A5A5", "#E8E6E4"] as const, // Dark pearl shimmer
  glow: ["rgba(212,165,116,0.3)", "rgba(212,165,116,0.15)", "rgba(212,165,116,0.05)"] as const,
  aurora: ["#D4A5A5", "#C8B5D0", "#B4D0C8", "#D5B5A2"] as const, // Muted multi-color aurora
  
  // Context gradients
  success: ["#88C6AF", "#B4D0C8"] as const,
  warning: ["#DFB385", "#D5B5A2"] as const,
  error: ["#DF939A", "#D0A8B4"] as const,
  info: ["#88B8CA", "#B4D0C8"] as const,
  
  // Premium paywall
  paywall: ["#1A1618", "#2B2530"] as const,
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
