import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { palette, radii, shadow } from "@/constants/theme";
import PressableScale from "@/components/PressableScale";

type GlassTabBarRoute = {
  key: string;
  name: string;
};

type GlassTabBarState = {
  index: number;
  routes: GlassTabBarRoute[];
};

type GlassTabBarDescriptorOptions = {
  title?: string;
  tabBarLabel?: unknown;
  tabBarAccessibilityLabel?: string;
  tabBarIcon?: (args: { focused: boolean; color: string; size: number }) => React.ReactNode;
};

type GlassTabBarDescriptor = {
  options: GlassTabBarDescriptorOptions;
};

type GlassTabBarNavigation = {
  emit: (args: {
    type: "tabPress" | "tabLongPress";
    target: string;
    canPreventDefault?: boolean;
  }) => unknown;
  navigate: (name: string) => void;
};

export type GlassTabBarProps = {
  state: GlassTabBarState;
  descriptors: Record<string, GlassTabBarDescriptor>;
  navigation: GlassTabBarNavigation;
};

function GlassTabBarImpl({ state, descriptors, navigation }: GlassTabBarProps) {
  const routes = state.routes;

  const containerStyle = useMemo(
    () => [styles.container, shadow.soft] as const,
    []
  );

  const visibleRoutes = useMemo(() => {
    return routes.filter((route) => {
      const options = descriptors[route.key]?.options;
      const href = (options as { href?: unknown } | undefined)?.href;
      const tabBarButton = (options as { tabBarButton?: unknown } | undefined)?.tabBarButton;
      
      // Hide routes with href: null
      if (href === null) {
        return false;
      }
      
      // Hide routes with tabBarButton (even if it's a function that returns null)
      if (tabBarButton !== undefined) {
        return false;
      }
      
      // Hide the progress route explicitly
      if (route.name === 'progress') {
        return false;
      }
      
      return true;
    });
  }, [descriptors, routes]);

  return (
    <View style={containerStyle} pointerEvents="box-none" testID="glass-tabbar">
      <BlurView intensity={Platform.OS === "web" ? 18 : 28} tint="light" style={styles.blur} />
      <LinearGradient
        colors={["rgba(255,255,255,0.92)", "rgba(255,255,255,0.68)"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.chrome}
      />
      <View style={styles.hairline} />

      <View style={styles.row}>
        {visibleRoutes.map((route, index) => {
          const isFocused = state.routes[state.index]?.key === route.key;
          const { options } = descriptors[route.key];

          const rawLabel =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const label = typeof rawLabel === "string" ? rawLabel : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            }) as { defaultPrevented?: boolean } | undefined;

            if (!isFocused && !event?.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const renderIcon = options.tabBarIcon;

          return (
            <PressableScale
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              pressedScale={0.96}
              haptics={isFocused ? "none" : "light"}
              style={[styles.item, isFocused ? styles.itemFocused : undefined]}
              testID={`tab-${route.name}`}
              containerTestID={`tab-${route.name}-container`}
            >
              <View style={styles.itemInner}>
                <View style={[styles.iconWrap, isFocused ? styles.iconWrapFocused : undefined]}>
                  {typeof renderIcon === "function"
                    ? renderIcon({
                        focused: isFocused,
                        color: isFocused ? palette.primary : palette.textSecondary,
                        size: 22,
                      })
                    : null}
                </View>

                <Text
                  style={[styles.label, isFocused ? styles.labelFocused : undefined]}
                  numberOfLines={1}
                >
                  {typeof label === "string" ? label : route.name}
                </Text>

                {isFocused ? <View style={styles.activeDot} /> : <View style={styles.activeDotSpacer} />}
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: Platform.OS === "ios" ? 18 : 14,
    borderRadius: radii.xxl,
    overflow: "hidden",
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  chrome: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(10,10,10,0.08)",
    borderRadius: radii.xxl,
  },
  hairline: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    opacity: 0.75,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
  },
  item: {
    flex: 1,
    borderRadius: radii.xl,
  },
  itemFocused: {
    backgroundColor: "rgba(10,10,10,0.055)",
  },
  itemInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  iconWrap: {
    borderRadius: radii.lg,
    padding: 8,
  },
  iconWrapFocused: {
    backgroundColor: "rgba(212,165,116,0.14)",
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.15,
    color: palette.textSecondary,
  },
  labelFocused: {
    color: palette.textPrimary,
  },
  activeDot: {
    marginTop: 4,
    width: 14,
    height: 3,
    borderRadius: 99,
    backgroundColor: palette.primary,
    opacity: 0.22,
  },
  activeDotSpacer: {
    marginTop: 4,
    width: 14,
    height: 3,
    borderRadius: 99,
    backgroundColor: "transparent",
  },
});

export default memo(GlassTabBarImpl);
