"use client";
import { useRealtimeAuth } from "@/hooks/useRealtimeAuth";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeAuth();
  return <>{children}</>;
}
