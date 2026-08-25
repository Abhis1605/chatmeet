"use client";

import Sidebar from "@/components/Sidebar";
import ChatListPanel from "@/components/ChatListPanel";
import ChatWindow from "@/components/ChatWindow";
import RoomListPanel from "@/components/room/RoomListPanel";
import RoomChatWindow from "@/components/room/RoomChatWindow";
import VideoCallListPanel from "@/components/call/VideoCallListPanel";
import VideoCallMainPanel from "@/components/call/VideoCallMainPanel";
import ProfileMainPanel from "@/components/profile/ProfileMainPanel";
import SettingsMainPanel from "@/components/settings/SettingsMainPanel";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useSession } from "next-auth/react";
import { useLogout } from "@/hooks/use-logout";

export default function ChatPage() {
  const { activeTab, activeChatId, activeRoomChatId } = useChatUIStore();
  const { status } = useSession();
  const { handleLogoutClick } = useLogout();

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center text-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      {activeTab === "room" ? (
        <>
          <RoomListPanel />
          <div className="flex-1">
            {activeRoomChatId ? (
              <RoomChatWindow />
            ) : (
              <div className="h-full flex items-center justify-center text-muted">
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
      ) : activeTab === "profile" ? (
        <div className="flex-1">
          <ProfileMainPanel onLogout={handleLogoutClick} />
        </div>
      ) : activeTab === "settings" ? (
        <div className="flex-1">
          <SettingsMainPanel />
        </div>
      ) : (
        <>
          <ChatListPanel type={activeTab} />
          <div className="flex-1">
            {activeChatId ? (
              <ChatWindow />
            ) : (
              <div className="h-full flex items-center justify-center text-muted">
                Select a chat to start messaging
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
