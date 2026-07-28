'use client'
import { SessionProvider } from "next-auth/react";
import React from "react";
import QueryProvider from "@/providers/query-provider";
import SocketProvider from "@/providers/socket-provider";

export default function Providers({ children }: { children: React.ReactNode}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
