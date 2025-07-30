import React, { useRef, useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, Animated, Easing, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { BlurView } from "expo-blur";

// Pulsing radius hook
function usePulsingRadius(min: number, max: number, duration: number) {
  const anim = useRef(new Animated.Value(0)).current;
  const [radius, setRadius] = useState(`${min}%`);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.quad),
        }),
      ])
    );
    loop.start();

    const id = anim.addListener(({ value }) => {
      const r = min + (max - min) * value;
      setRadius(`${r}%`);
    });

    return () => {
      loop.stop();
      anim.removeListener(id);
    };
  }, []);

  return radius;
}

export default function AnimatedBackground() {
  const { width, height } = useWindowDimensions();

  // Orb radii for pulsing
  const r1 = usePulsingRadius(90, 120, 7500);
  const r2 = usePulsingRadius(100, 160, 8000);
  const r3 = usePulsingRadius(80, 140, 8500);
  const r4 = usePulsingRadius(90, 120, 9000);

  return (
    <View style={[StyleSheet.absoluteFill,{backgroundColor : "black"}]}>
      <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad1" cx="0%" cy="30%" r={r1}>
            <Stop offset="0%" stopColor="#8140ac" stopOpacity={1} />
            <Stop offset="100%" stopColor="#0f0f0f" stopOpacity={0} />
          </RadialGradient>

          <RadialGradient id="grad2" cx="100%" cy="25%" r={r2}>
            <Stop offset="0%" stopColor="#1f204f" stopOpacity={1} />
            <Stop offset="100%" stopColor="#0f0f0f" stopOpacity={0} />
          </RadialGradient>

          <RadialGradient id="grad3" cx="5%" cy="75%" r={r3}>
            <Stop offset="0%" stopColor="#151947" stopOpacity={1} />
            <Stop offset="100%" stopColor="#0f0f0f" stopOpacity={0} />
          </RadialGradient>

          <RadialGradient id="grad4" cx="85%" cy="100%" r={r4}>
            <Stop offset="0%" stopColor="#064c6dff" stopOpacity={1} />
            <Stop offset="100%" stopColor="#0f0f0f" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad3)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad4)" />
      </Svg>

      <BlurView
        tint="dark"
        intensity={60}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
