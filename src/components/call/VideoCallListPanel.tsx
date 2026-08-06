"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useChats } from "@/hooks/queries/use-chats";

/**
 * VideoCallListPanel — lets the user pick who to video-call, mirroring the
 * Chats/Groups list panels. Selecting a chat sets activeChatId, which is
 * what VideoCallMainPanel and the call API routes key off of.
 */
export default function VideoCallListPanel() {
  const { data: session } = useSession();
  const { setActiveChatId, activeChatId } = useChatUIStore();
  const [subTab, setSubTab] = useState<"personal" | "group">("personal");

  const { data: chats, isLoading } = useChats(subTab);

  return (
    <div className="w-[320px] border-r border-white/10 flex flex-col">
      {/* HEADER */}
      <div className="p-3 border-b border-white/10">
        <h2 className="text-white font-semibold mb-3">Video Call</h2>

        <div className="flex gap-1 bg-white/5 rounded-md p-1">
          <button
            type="button"
            onClick={() => setSubTab("personal")}
            className={`flex-1 py-1.5 text-sm rounded-md transition ${
              subTab === "personal"
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Meet
          </button>
          <button
            type="button"
            onClick={() => setSubTab("group")}
            className={`flex-1 py-1.5 text-sm rounded-md transition ${
              subTab === "group"
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Group
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>}

        {Array.isArray(chats) && chats.length === 0 && !isLoading && (
          <div className="p-4 text-center text-gray-500 text-sm">
            {subTab === "personal" ? "No personal chats yet" : "No groups yet"}
          </div>
        )}

        {Array.isArray(chats) &&
          chats.map((chat) => {
            const otherUser = chat.members?.find(
              (m) => m.user.id !== session?.user?.id
            )?.user;

            const title = chat.isGroup ? chat.name : otherUser?.name || otherUser?.email;
            const subtitle = chat.isGroup
              ? `${chat.members?.length ?? 0} members`
              : otherUser?.isOnline
                ? "Online"
                : "Offline";

            return (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`p-3 flex items-center gap-3 cursor-pointer transition ${
                  activeChatId === chat.id ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <img
                  alt="avatar-img"
                  src={
                    chat.isGroup
                      ? "/chatmeet-collapsed-logo.png"
                      : otherUser?.image || "/default-avatar.png"
                  }
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium truncate">{title}</p>
                  <p className="text-xs text-gray-500 truncate">{subtitle}</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
