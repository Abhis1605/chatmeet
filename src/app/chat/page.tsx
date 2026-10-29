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
import Spinner from "@/components/Spinner";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useSession } from "next-auth/react";
import { useLogout } from "@/hooks/use-logout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const { activeTab, activeChatId, activeRoomChatId, mobilePanel, setMobilePanel } = useChatUIStore();
  const { status } = useSession();
  const { handleLogoutClick } = useLogout();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent("/chat")}`);
    }
  }, [router, status]);

  if (status !== "authenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Spinner />
      </div>
    );
  }

  const hasDetail = activeTab === "room" ? Boolean(activeRoomChatId) : Boolean(activeChatId);
  const showDetail = mobilePanel === "detail" && hasDetail;

  return (
    <div className="flex h-dvh w-full min-w-0 overflow-hidden bg-background pb-16 pt-14 text-foreground lg:pb-0 lg:pt-0">

      <Sidebar />

      {activeTab === "room" ? (
        <>
          <div className={`${showDetail ? "hidden" : "flex"} h-full w-full shrink-0 lg:flex lg:w-[320px]`}>
            <RoomListPanel />
          </div>
          <div className={`${showDetail ? "flex" : "hidden"} h-full min-w-0 flex-1 flex-col lg:flex`}>
            {activeRoomChatId ? (
              <RoomChatWindow onBack={() => setMobilePanel("list")} />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-4 text-center text-muted">
                Select a room to start messaging
              </div>
            )}
          </div>
        </>
      ) : activeTab === "video" ? (
        <>
          <div className={`${showDetail ? "hidden" : "flex"} h-full w-full shrink-0 lg:flex lg:w-[320px]`}>
            <VideoCallListPanel />
          </div>
          <div className={`${showDetail ? "flex" : "hidden"} h-full min-w-0 flex-1 flex-col lg:flex`}>
            <VideoCallMainPanel />
          </div>
        </>
      ) : activeTab === "profile" ? (
        <div className="h-full min-w-0 flex-1">
          <ProfileMainPanel onLogout={handleLogoutClick} />
        </div>
      ) : activeTab === "settings" ? (
        <div className="h-full min-w-0 flex-1">
          <SettingsMainPanel />
        </div>
      ) : (
        <>
          <div className={`${showDetail ? "hidden" : "flex"} h-full w-full shrink-0 lg:flex lg:w-[320px]`}>
            <ChatListPanel type={activeTab} />
          </div>
          <div className={`${showDetail ? "flex" : "hidden"} h-full min-w-0 flex-1 flex-col lg:flex`}>
            {activeChatId ? (
              <ChatWindow onBack={() => setMobilePanel("list")} />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-4 text-center text-muted">
                Select a chat to start messaging
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
