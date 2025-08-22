"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { ThemeSwitch } from "@/components/theme-switch";
import { useNavStore } from "@/store/navZustand";
import { useAuthStore } from "@/store/authZustand";

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMenuOpen } = useNavStore();
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

  return (
    <>
      <Navbar />
      <ThemeSwitch />
      <main
        className={`
          pt-16 transition-all duration-300 ease-in-out
          ${isMenuOpen ? "lg:pl-64" : "lg:pl-0"}
        `}
      >
        {children}
      </main>
    </>
  );
}
