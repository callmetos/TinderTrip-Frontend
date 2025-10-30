import SafeScreen from "@/components/SafeScreen";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeScreen>
        <Slot />
        <StatusBar style="dark" />
      </SafeScreen>
    </AuthProvider>
  );
}

