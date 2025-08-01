import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
  View,
} from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle as SvgCircle,
} from "react-native-svg";
import { BlurView } from "expo-blur";
import { subscribe, getDepth } from "../lib/navigationDepth";

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

function useAnimatedRadius(min: number, max: number, duration: number) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  return anim.interpolate({
    inputRange: [0, 1],
    outputRange: [min, max],
  });
}

const AnimatedBackground = React.memo(() => {
  const { width, height } = useWindowDimensions();
  const r1 = useAnimatedRadius(150, 220, 7500);
  const r2 = useAnimatedRadius(160, 230, 8000);
  const r3 = useAnimatedRadius(140, 210, 8500);
  const r4 = useAnimatedRadius(150, 220, 9000);

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial depth
    translateY.setValue(-getDepth() * 8);

    const unsubscribe = subscribe((depth) => {
      Animated.timing(translateY, {
        toValue: -depth * 8,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: "#0e0e0e",
          transform: [{ translateY }],
          zIndex: -1, // stays behind everything else
        },
      ]}
      pointerEvents="none"
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
    >
      <Svg height={height + 100} width={width} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad1" cx="0%" cy="30%" r="100%">
            <Stop offset="0%" stopColor="#8140ac" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0e0e0e" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="grad2" cx="100%" cy="25%" r="100%">
            <Stop offset="0%" stopColor="#1f204f" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0e0e0e" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="grad3" cx="5%" cy="75%" r="100%">
            <Stop offset="0%" stopColor="#151947" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0e0e0e" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="grad4" cx="85%" cy="100%" r="100%">
            <Stop offset="0%" stopColor="#064c6dff" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0e0e0e" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <AnimatedCircle cx="0%" cy="30%" r={r1} fill="url(#grad1)" />
        <AnimatedCircle cx="100%" cy="25%" r={r2} fill="url(#grad2)" />
        <AnimatedCircle cx="5%" cy="75%" r={r3} fill="url(#grad3)" />
        <AnimatedCircle cx="85%" cy="100%" r={r4} fill="url(#grad4)" />
      </Svg>

      <BlurView tint="dark" intensity={60} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
});

export default AnimatedBackground;
