'use client'
import { SessionProvider } from "next-auth/react";
import React from "react";
import QueryProvider from "@/providers/query-provider";
import SocketProvider from "@/providers/socket-provider";
import ThemeApplier from "@/components/ThemeApplier";
import SessionGuard from "@/components/SessionGuard";
import { ImagePreviewProvider } from "@/components/ui/ImagePreviewModal";

export default function Providers({ children }: { children: React.ReactNode}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <SocketProvider>
          <ImagePreviewProvider>
            <ThemeApplier />
            <SessionGuard />
            {children}
          </ImagePreviewProvider>
        </SocketProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
