"use client";

import Sidebar from "@/components/Sidebar";
import ChatListPanel from "@/components/ChatListPanel";
import ChatWindow from "@/components/ChatWindow";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const { activeTab, activeChatId } = useChatUIStore();
  const { status } = useSession();

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
        {activeChatId ? (
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