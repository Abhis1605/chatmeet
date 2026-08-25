"use client";

import { useState } from "react";
import { Users, Video } from "lucide-react";
import { startCall } from "@/services/call.service";
import { toast } from "sonner";
import { getAvatarSrc } from "@/lib/avatars";

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

  const [isStartingCall, setIsStartingCall] = useState(false);

  const handleGroupVideoCall = async () => {
    if (!chat?.id || isStartingCall) return;
    setIsStartingCall(true);
    try {
      await startCall(chat.id, "GROUP");
      // The call-incoming socket event is emitted server-side to other members.
      // For the caller, navigate to the video call tab so they can join.
      toast.success("Group call started! Switch to Video Call to join.");
    } catch {
      toast.error("Failed to start group call. Please try again.");
    } finally {
      setIsStartingCall(false);
    }
  };

  return (
    <div className="h-18 px-5 border-b border-border flex items-center gap-3 bg-surface">

      <div className="relative shrink-0">
        <img
          src={chat?.isGroup ? chat.image || "/chatmeet-collapsed-logo.png" : getAvatarSrc(otherUser)}
          alt="avatar"
          className="w-11 h-11 rounded-full object-cover"
        />
        {!chat?.isGroup && (
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${
              otherUser?.isOnline ? "bg-green-500" : "bg-muted"
            }`}
          />
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-foreground font-semibold">
          {title}
        </h3>

        <span
          className={`text-xs transition ${
            !chat?.isGroup && isTyping
              ? "text-green-400 animate-pulse"
              : !chat?.isGroup && otherUser?.isOnline
                ? "text-green-500"
                : "text-muted"
          }`}
        >
          {subtitle}
        </span>
      </div>

      {chat?.isGroup && (
        <>
          {/* Group video call button — additive, does not affect personal chat header */}
          <button
            id="group-video-call-btn"
            type="button"
            title="Start group video call"
            aria-label="Start group video call"
            onClick={handleGroupVideoCall}
            disabled={isStartingCall}
            className="p-2 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            type="button"
            title="Manage group"
            aria-label="Manage group"
            onClick={onManageGroup}
            className="p-2 rounded-md text-muted hover:bg-surface-soft hover:text-foreground transition cursor-pointer"
          >
            <Users className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
