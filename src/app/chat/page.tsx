"use client";

import Sidebar from "@/components/Sidebar";
import ChatListPanel from "@/components/ChatListPanel";
import ChatWindow from "@/components/ChatWindow";
import RoomListPanel from "@/components/room/RoomListPanel";
import RoomChatWindow from "@/components/room/RoomChatWindow";
import VideoCallListPanel from "@/components/call/VideoCallListPanel";
import VideoCallMainPanel from "@/components/call/VideoCallMainPanel";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const { activeTab, activeChatId, activeRoomChatId } = useChatUIStore();
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b1220] text-white">
      <Sidebar />

      {activeTab === "room" ? (
        <>
          <RoomListPanel />
          <div className="flex-1">
            {activeRoomChatId ? (
              <RoomChatWindow />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a room to start messaging
              </div>
            )}
          </div>
        </>
      ) : activeTab === "video" ? (
        <>
          <VideoCallListPanel />
          <div className="flex-1">
            <VideoCallMainPanel />
          </div>
        </>
      ) : (
        <>
          <ChatListPanel type={activeTab} />
          <div className="flex-1">
            {activeChatId ? (
              <ChatWindow />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a chat to start messaging
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
