import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, Platform, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { palette, radii, shadow } from "@/constants/theme";
import PressableScale from "@/components/PressableScale";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const visibleRoutes = useMemo(() => {
    return routes.filter((route) => {
      const options = descriptors[route.key]?.options;
      const href = (options as { href?: unknown } | undefined)?.href;
      const tabBarButton = (options as { tabBarButton?: unknown } | undefined)?.tabBarButton;
      
      if (href === null) return false;
      if (tabBarButton !== undefined) return false;
      if (route.name === 'progress') return false;
      
      return true;
    });
  }, [descriptors, routes]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.container} testID="glass-tabbar">
        <BlurView 
          intensity={Platform.OS === "web" ? 25 : 50} 
          tint="light" 
          style={styles.blur} 
        />
        <LinearGradient
          colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.85)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        />
        <View style={styles.topBorder} />

        <View style={styles.row}>
          {visibleRoutes.map((route) => {
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
                pressedScale={0.92}
                haptics={isFocused ? "none" : "light"}
                style={styles.tabItem}
                testID={`tab-${route.name}`}
              >
                <View style={styles.tabContent}>
                  <View style={[
                    styles.iconWrapper,
                    isFocused && styles.iconWrapperActive
                  ]}>
                    {typeof renderIcon === "function"
                      ? renderIcon({
                          focused: isFocused,
                          color: isFocused ? palette.primary : palette.textSecondary,
                          size: 22,
                        })
                      : null}
                  </View>

                  <Text
                    style={[
                      styles.label,
                      isFocused && styles.labelActive
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>

                  {isFocused && <View style={styles.indicator} />}
                </View>
              </PressableScale>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
  },
  container: {
    borderRadius: 28,
    overflow: "hidden",
    ...shadow.medium,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 28,
  },
  topBorder: {
    position: "absolute",
    left: 1,
    right: 1,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,1)",
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  iconWrapperActive: {
    backgroundColor: "rgba(10,10,10,0.06)",
  },
  label: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 0.1,
    color: palette.textSecondary,
  },
  labelActive: {
    color: palette.textPrimary,
    fontWeight: "700" as const,
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.primary,
  },
});

export default memo(GlassTabBarImpl);
