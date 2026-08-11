"use client";

import type { ReactNode } from "react";
import { AppProvider } from "@/context/AppContext";
import { AdminProvider } from "@/context/AdminContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <AdminProvider>{children}</AdminProvider>
    </AppProvider>
  );
}
