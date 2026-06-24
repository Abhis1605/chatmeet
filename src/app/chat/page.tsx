"use client";

import Sidebar from "@/components/Sidebar";
import ChatListPanel from "@/components/ChatListPanel";
import ChatWindow from "@/components/ChatWindow";
import { useChatStore } from "@/store/useChatStore";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { connectSocket } from "@/lib/socket";

export default function ChatPage() {
  const { activeTab, selectedChat } = useChatStore();
  const { data: session, status } = useSession();

  // Initialize socket globally for the chat page
  useEffect(() => {
    if (status === "authenticated" && session) {
      const token = (session as any).accessToken;
      connectSocket(token);
    }
  }, [session, status]);

  // Handle loading state
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b1220] text-white">

      {/* SIDEBAR */}
      <Sidebar />

      {/* CHAT LIST PANEL */}
      <ChatListPanel type={activeTab} />

      {/* CHAT WINDOW */}
      <div className="flex-1">
        {selectedChat ? (
          <ChatWindow />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select a chat to start messaging
          </div>
        )}
      </div>

    </div>
  );
}