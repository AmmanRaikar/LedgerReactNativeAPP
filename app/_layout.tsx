import { Slot } from "expo-router";
import AnimatedBackground from "../components/AnimatedBackground";

export default function RootLayout() {
  return (
    <>
      <AnimatedBackground />
      <Slot
        screenOptions={{
          animation: "fade",
          headerShown: false,
          presentation: "transparentModal",
        }}
      />
    </>
  );
}
