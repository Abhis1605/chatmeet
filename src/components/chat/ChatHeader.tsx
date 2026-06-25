"use client";

interface ChatHeaderProps {
  otherUser: any;
  presenceLabel: string;
  isTyping: boolean;
}

export default function ChatHeader({
  otherUser,
  presenceLabel,
  isTyping,
}: ChatHeaderProps) {
  return (
    <div className="h-18 px-5 border-b border-white/10 flex items-center gap-3 bg-[#0f172a]">

      <img
        src={otherUser?.image || "/default-avatar.png"}
        alt="avatar"
        className="w-11 h-11 rounded-full object-cover"
      />

      <div className="flex flex-col">
        <h3 className="text-white font-semibold">
          {otherUser?.name || otherUser?.email}
        </h3>

        <span
          className={`text-xs transition ${
            isTyping
              ? "text-green-400 animate-pulse"
              : "text-gray-400"
          }`}
        >
          {presenceLabel}
        </span>
      </div>
    </div>
  );
}