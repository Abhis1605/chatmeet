'use client'
import { SessionProvider } from "next-auth/react";
import React from "react";
import QueryProvider from "@/providers/query-provider";
import SocketProvider from "@/providers/socket-provider";
import ThemeApplier from "@/components/ThemeApplier";

export default function Providers({ children }: { children: React.ReactNode}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <SocketProvider>
          <ThemeApplier />
          {children}
        </SocketProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
