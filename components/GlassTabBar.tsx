import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
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
      return href !== null;
    });
  }, [descriptors, routes]);

  return (
    <View style={containerStyle} pointerEvents="box-none" testID="glass-tabbar">
      <BlurView intensity={Platform.OS === "web" ? 22 : 35} tint="light" style={styles.blur} />
      <View style={styles.chrome} />

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
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 20 : 16,
    borderRadius: radii.xxl,
    overflow: "hidden",
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  chrome: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(10,10,10,0.08)",
    borderRadius: radii.xxl,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
  },
  item: {
    flex: 1,
    borderRadius: radii.xl,
  },
  itemFocused: {
    backgroundColor: "rgba(10,10,10,0.06)",
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
    backgroundColor: palette.overlayGold,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
    color: palette.textSecondary,
  },
  labelFocused: {
    color: palette.textPrimary,
  },
});

export default memo(GlassTabBarImpl);
