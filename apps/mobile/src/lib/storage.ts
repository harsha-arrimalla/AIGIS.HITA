/**
 * Platform-safe key-value storage.
 * Native: expo-secure-store. Web: localStorage (SecureStore has no web support).
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    } catch {
      // storage unavailable (private mode) — ignore
    }
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  return SecureStore.deleteItemAsync(key);
}
