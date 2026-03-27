import React, { memo, useCallback, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

export type PressableScaleProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  haptics?: "none" | "light" | "medium";
  containerTestID?: string;
};

function PressableScaleImpl({
  style,
  children,
  pressedScale = 0.98,
  haptics = "light",
  onPressIn,
  onPressOut,
  onPress,
  containerTestID,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = useCallback(
    (toValue: number) => {
      Animated.spring(scale, {
        toValue,
        speed: 22,
        bounciness: 6,
        useNativeDriver: true,
      }).start();
    },
    [scale]
  );

  const handlePressIn = useCallback<NonNullable<PressableProps["onPressIn"]>>(
    (e) => {
      if (haptics !== "none") {
        const impactStyle =
          haptics === "medium"
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light;
        Haptics.impactAsync(impactStyle).catch(() => undefined);
      }
      animateTo(pressedScale);
      onPressIn?.(e);
    },
    [animateTo, haptics, onPressIn, pressedScale]
  );

  const handlePressOut = useCallback<NonNullable<PressableProps["onPressOut"]>>(
    (e) => {
      animateTo(1);
      onPressOut?.(e);
    },
    [animateTo, onPressOut]
  );

  const handlePress = useCallback<NonNullable<PressableProps["onPress"]>>(
    (e) => {
      onPress?.(e);
    },
    [onPress]
  );

  const animatedStyle = useMemo(
    () => [{ transform: [{ scale }] }] as const,
    [scale]
  );

  return (
    <Animated.View style={[animatedStyle, style]} testID={containerTestID}>
      <Pressable
        {...rest}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        testID={rest.testID}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default memo(PressableScaleImpl);
