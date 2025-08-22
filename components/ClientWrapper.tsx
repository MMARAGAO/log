"use client";
import dynamic from "next/dynamic";

const RealtimeProvider = dynamic(
  () =>
    import("@/components/RealtimeProvider").then((mod) => ({
      default: mod.RealtimeProvider,
    })),
  { ssr: false }
);

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <RealtimeProvider>{children}</RealtimeProvider>;
}
