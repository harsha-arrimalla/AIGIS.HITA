/**
 * Web stub for react-native-maps — renders a warm placeholder instead of a map.
 * Keeps the explore screen bundling on web where react-native-maps is unsupported.
 */

import { forwardRef, type ReactNode } from "react";
import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { colors } from "@/lib/tokens";

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export function Marker(_props: Record<string, unknown>) {
  return null;
}

const MapView = forwardRef<View, { style?: ViewStyle; children?: ReactNode }>(
  function MapViewWeb({ style, children }, ref) {
    return (
      <View ref={ref} style={[styles.placeholder, style]}>
        <Text style={styles.text}>Map view is available in the mobile app</Text>
        {children}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default MapView;
