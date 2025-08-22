"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authZustand";

export function useRealtimeAuth() {
  const { user, startRealtimeListener, stopRealtimeListener } = useAuthStore();

  useEffect(() => {
    if (user) {
      startRealtimeListener();
    } else {
      stopRealtimeListener();
    }

    return () => {
      stopRealtimeListener();
    };
  }, [user?.id, startRealtimeListener, stopRealtimeListener]);
}
