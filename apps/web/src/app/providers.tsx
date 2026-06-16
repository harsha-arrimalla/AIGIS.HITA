"use client";

import { APIProvider } from "@/lib/api-provider";
import { AuthProvider } from "@/lib/auth-provider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <APIProvider>{children}</APIProvider>
    </AuthProvider>
  );
}
