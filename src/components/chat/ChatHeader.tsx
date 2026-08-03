"use client";

import { Users } from "lucide-react";

interface ChatHeaderProps {
  otherUser: any;
  presenceLabel: string;
  isTyping: boolean;
  chat?: any;
  onManageGroup?: () => void;
}

export default function ChatHeader({
  otherUser,
  presenceLabel,
  isTyping,
  chat,
  onManageGroup,
}: ChatHeaderProps) {
  const title = chat?.isGroup ? chat.name : otherUser?.name || otherUser?.email;
  const subtitle = chat?.isGroup
    ? `${chat.members?.length ?? 0} members`
    : presenceLabel;

  return (
    <div className="h-18 px-5 border-b border-white/10 flex items-center gap-3 bg-[#0f172a]">

      <img
        src={chat?.isGroup ? "/chatmeet-collapsed-logo.png" : otherUser?.image || "/default-avatar.png"}
        alt="avatar"
        className="w-11 h-11 rounded-full object-cover"
      />

      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-white font-semibold">
          {title}
        </h3>

        <span
          className={`text-xs transition ${!chat?.isGroup && isTyping
              ? "text-green-400 animate-pulse"
              : "text-gray-400"
            }`}
        >
          {subtitle}
        </span>
      </div>

      {chat?.isGroup && (
        <button
          type="button"
          title="Manage group"
          aria-label="Manage group"
          onClick={onManageGroup}
          className="p-2 rounded-md text-gray-400 hover:bg-white/10 hover:text-white transition"
        >
          <Users className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
