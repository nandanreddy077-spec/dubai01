# Preview Image Design Guide
## Color Palettes & Typography Recommendations

Based on your ultra-premium design system, here are the recommended color palettes and typography for preview images:

---

## 🎨 Color Palettes

### **Primary Preview Image Palette** (Recommended)
For main preview images (outfit/style previews, analysis results):

```typescript
// Background
backgroundColor: palette.backgroundStart // #FFFFFF (light) or #000000 (dark)
// or use gradient
gradient: gradient.hero // ["#FFFFFF", "#F7F8FA"] (light)

// Image Frame/Border
borderColor: palette.primary // #0A0A0A (light) or #FFFFFF (dark)
borderWidth: 3-4px
borderRadius: 24px

// Overlay/Glow Effect
overlay: gradient.glow // Subtle gold glow
// or
overlay: palette.overlayGold // rgba(212,165,116,0.12)

// Badge/Label Background
badgeBackground: palette.overlayGold // rgba(212,165,116,0.12)
badgeBorder: palette.primary // #0A0A0A
```

### **Accent Palette Options**

#### Option 1: Gold Luxury (Premium Feel)
```typescript
primary: palette.primary // #0A0A0A
accent: palette.gold // #C9A961
overlay: palette.overlayGold // rgba(212,165,116,0.12)
border: palette.primary
```

#### Option 2: Architectural Neutral (Minimalist)
```typescript
primary: palette.primary // #0A0A0A
accent: palette.sage // #B8C5C2
overlay: palette.overlaySage // rgba(184,201,197,0.12)
border: palette.border // rgba(0,0,0,0.10)
```

#### Option 3: Warm Blush (Elegant)
```typescript
primary: palette.primary // #0A0A0A
accent: palette.blush // #E8DDD5
overlay: palette.overlayBlush // rgba(232,213,196,0.12)
border: palette.primary
```

#### Option 4: Cool Lavender (Sophisticated)
```typescript
primary: palette.primary // #0A0A0A
accent: palette.lavender // #9CA3AF
overlay: palette.overlayLavender // rgba(156,163,175,0.12)
border: palette.primary
```

### **Share Preview Card Palette**
For social sharing previews:

```typescript
// Card Background
background: gradient.glow // Subtle gradient
// or
background: palette.surface // #FFFFFF
border: palette.border // rgba(0,0,0,0.10)
borderRadius: 32px

// Text Colors
title: palette.textPrimary // #0A0A0A
score: palette.primary // #0A0A0A (bold)
subtext: palette.textSecondary // #6B7280

// Accent
accent: palette.gold // #C9A961 (for highlights)
```

---

## ✍️ Typography

### **Preview Image Typography Scale**

#### **Image Badge/Label** (Small overlay text)
```typescript
fontSize: typography.bodySmall // 14px
fontWeight: typography.semibold // 600
color: palette.primary // #0A0A0A
letterSpacing: 0.3
```

#### **Preview Title** (Main heading on preview card)
```typescript
fontSize: typography.h4 // 20px
fontWeight: typography.bold // 700
color: palette.textPrimary // #0A0A0A
letterSpacing: 0.2
```

#### **Preview Score/Value** (Large emphasis number)
```typescript
fontSize: typography.display // 36px
fontWeight: typography.black // 900
color: palette.primary // #0A0A0A
letterSpacing: -0.5
```

#### **Preview Subtext** (Supporting text)
```typescript
fontSize: typography.bodySmall // 14px
fontWeight: typography.medium // 500
color: palette.textSecondary // #6B7280
letterSpacing: 0.1
```

#### **Preview Caption** (Small metadata)
```typescript
fontSize: typography.caption // 12px
fontWeight: typography.regular // 400
color: palette.textTertiary // #9CA3AF
letterSpacing: 0.2
```

---

## 📐 Recommended Preview Image Styles

### **Style 1: Elegant Photo Preview** (Current - Recommended)
```typescript
imagePreview: {
  alignItems: 'center',
  marginBottom: spacing.xxxxl,
},
previewImage: {
  width: 160,
  height: 200,
  borderRadius: 24,
  borderWidth: 4,
  borderColor: palette.primary,
  ...shadow.floating,
},
previewBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: palette.overlayGold,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderRadius: 16,
  gap: spacing.xs,
  borderWidth: 1,
  borderColor: palette.primary,
  ...shadow.card,
},
previewText: {
  fontSize: typography.bodySmall, // 14px
  color: palette.primary,
  fontWeight: typography.semibold, // 600
  letterSpacing: 0.3,
},
```

### **Style 2: Share Preview Card**
```typescript
previewCard: {
  borderRadius: 32,
  overflow: 'hidden',
  ...shadow.elevated,
},
previewGradient: {
  padding: spacing.xxl,
  alignItems: 'center',
  borderRadius: 32,
},
previewTitle: {
  fontSize: typography.h4, // 20px
  fontWeight: typography.bold, // 700
  color: palette.textPrimary,
  marginBottom: spacing.sm,
  letterSpacing: 0.2,
},
previewScore: {
  fontSize: typography.display, // 36px
  fontWeight: typography.black, // 900
  color: palette.primary,
  marginBottom: spacing.xs,
  letterSpacing: -0.5,
},
previewSubtext: {
  fontSize: typography.bodySmall, // 14px
  fontWeight: typography.medium, // 500
  color: palette.textSecondary,
  letterSpacing: 0.1,
},
```

### **Style 3: Minimal Preview Badge**
```typescript
previewBadge: {
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: palette.overlayGold,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: palette.primary,
  ...shadow.card,
},
previewBadgeText: {
  fontSize: typography.caption, // 12px
  fontWeight: typography.semibold, // 600
  color: palette.primary,
  letterSpacing: 0.3,
},
```

---

## 🎯 Best Practices

### **Color Usage**
1. **Primary Text**: Always use `palette.primary` (#0A0A0A) for maximum contrast
2. **Secondary Text**: Use `palette.textSecondary` (#6B7280) for supporting text
3. **Accents**: Use `palette.overlayGold` for premium feel, or `palette.overlaySage` for minimal
4. **Borders**: Use `palette.primary` for strong definition, `palette.border` for subtle

### **Typography Hierarchy**
1. **Display/Score**: `typography.display` (36px) + `typography.black` (900) - for main numbers
2. **Title**: `typography.h4` (20px) + `typography.bold` (700) - for card titles
3. **Body**: `typography.bodySmall` (14px) + `typography.semibold` (600) - for labels
4. **Caption**: `typography.caption` (12px) + `typography.regular` (400) - for metadata

### **Spacing**
- Use `spacing.xxl` (32px) for card padding
- Use `spacing.md` (16px) for badge padding
- Use `spacing.xs` (8px) for tight spacing

### **Shadows**
- `shadow.floating` for image frames (elevated feel)
- `shadow.elevated` for preview cards (prominent)
- `shadow.card` for badges (subtle elevation)

---

## 🌓 Dark Mode Considerations

All color values automatically adapt:
- Light mode: `palette.primary` = #0A0A0A (black)
- Dark mode: `palette.primary` = #FFFFFF (white)

The design system handles theme switching automatically via `getPalette(theme)`.

---

## 💡 Quick Reference

### **Most Common Preview Image Palette**
```typescript
// Background
backgroundColor: palette.backgroundStart

// Border
borderColor: palette.primary
borderWidth: 4
borderRadius: 24

// Badge
backgroundColor: palette.overlayGold
borderColor: palette.primary

// Text
fontSize: typography.bodySmall (14px)
fontWeight: typography.semibold (600)
color: palette.primary
```

### **Most Common Typography**
- **Badge Text**: `bodySmall` (14px) + `semibold` (600)
- **Title**: `h4` (20px) + `bold` (700)
- **Score**: `display` (36px) + `black` (900)
- **Subtext**: `bodySmall` (14px) + `medium` (500)

---

This guide ensures all preview images maintain consistency with your ultra-premium design system while providing flexibility for different use cases.





